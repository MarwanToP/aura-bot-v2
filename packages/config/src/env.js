import { z } from 'zod';
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment files independent of the process cwd: app-local .env first,
// then the monorepo root .env. dotenv never overrides keys already present in
// process.env, so real environment variables and the app-local file win.
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DOMAIN: z.string().url().default('http://localhost:3000'),
  
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required').default('dummy_client_id'),
  DISCORD_CLIENT_SECRET: z.string().min(1, 'DISCORD_CLIENT_SECRET is required').default('dummy_client_secret'),
  DISCORD_REDIRECT_URI: z.string().url().default('http://localhost:3000/api/auth/callback'),
  
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string').default('postgresql://user:password@localhost:5432/neondb'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required').default('redis://localhost:6379'),
  
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required').default('dummy_gemini_key'),
  
  // Cloudflare AI credentials are OPTIONAL: the bot must boot without them
  // (the Cloudflare provider is only one of several AI providers). They are
  // still placeholder-checked below, because a .env.example value that
  // reaches production fails later in a very confusing way. An empty value
  // counts as "not configured".
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_API_KEY: z.string().optional(),
  
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').default('super_secret_jwt_key_at_least_32_chars_long'),
  CORS_ORIGINS: z.string().transform((val) => val.split(',').map((s) => s.trim())).default('http://localhost:3000')
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid Environment Variables detected:');
  console.error(JSON.stringify(_env.error.format(), null, 2));
  if (isProduction) {
    process.exit(1);
  }
}

// Dev fallback: keep every schema default while tolerating a missing
// DISCORD_TOKEN (a bot-only requirement). A plain .partial() parse drops the
// defaults entirely, leaving OAuth/JWT settings undefined for dashboard-only
// boots — so if even this relaxed parse fails, the configuration is genuinely
// broken: print the zod issues and refuse to start in every environment.
const relaxedSchema = envSchema.extend({
  DISCORD_TOKEN: z.string().min(1).optional(),
});
const _relaxed = relaxedSchema.safeParse(process.env);

if (!_relaxed.success) {
  console.error('❌ FATAL: Environment configuration is invalid (relaxed dev schema also failed):');
  console.error(JSON.stringify(_relaxed.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.success ? _env.data : _relaxed.data;

// In production, prohibit default fallback secrets. `env` already reflects the
// effective parsed values (unset vars fall back to the schema defaults above),
// so a raw process.env check would silently miss them.
if (isProduction) {
  const defaultSecrets = [
    'super_secret_jwt_key_at_least_32_chars_long', // env schema default
    'super_secret_jwt_key_at_least_32_chars',      // .env.example placeholder
    'your_client_secret_here',                     // .env.example placeholder
    'your_gemini_api_key_here',                    // .env.example placeholder
    'dummy_client_secret',
    'dummy_gemini_key',
  ];

  const foundDefault = defaultSecrets.some((s) =>
    env.JWT_SECRET === s ||
    env.DISCORD_CLIENT_SECRET === s ||
    env.GEMINI_API_KEY === s
  );

  if (foundDefault) {
    console.error('❌ FATAL: Default fallback secrets detected in production environment!');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Placeholder guards
//
// A placeholder token or default secret that reaches production fails in a
// confusing way (the bot never connects to the Gateway, OAuth silently breaks)
// instead of loudly, so the values shipped in .env.example must never survive
// a production boot. Development only warns — contributors can still run the
// whole stack with the example values.
// ---------------------------------------------------------------------------

// Substrings that mark a value as "not configured yet".
const PLACEHOLDER_PATTERNS = [
  'your_',
  'change_me',
  'dummy_',
  'super_secret',
  'example',
  'placeholder',
];

// A Discord token is a real, opaque credential. Anything that is empty, still
// contains the word "placeholder", is the shipped .env.example value, or starts
// with an obvious "your…/change…/dummy…/example…/xxx…" marker is a fake.
function isPlaceholderDiscordToken(value) {
  if (typeof value !== 'string') return true;
  const token = value.trim();
  if (!token) return true;
  if (token.toLowerCase().includes('placeholder')) return true;
  if (token.toLowerCase() === 'your_discord_bot_token_here') return true;
  return /^(your|change|dummy|example|xxx)/i.test(token);
}

function isPlaceholderSecret(value) {
  if (typeof value !== 'string') return false;
  const secret = value.trim().toLowerCase();
  if (!secret) return false;
  return PLACEHOLDER_PATTERNS.some((pattern) => secret.includes(pattern));
}

// (a) DISCORD_TOKEN must be a real token in production.
if (isPlaceholderDiscordToken(env.DISCORD_TOKEN)) {
  const fatal = '❌ FATAL: DISCORD_TOKEN is empty or still a placeholder (e.g. "your_discord_bot_token_here").';
  if (isProduction) {
    console.error(fatal);
    process.exit(1);
  }
  console.warn('⚠️  Development mode: DISCORD_TOKEN is empty or a placeholder — the bot will not connect to Discord.');
}

// (b) Generalized placeholder pattern for every secret-bearing variable.
const placeholderSecrets = Object.entries({
  DISCORD_TOKEN: env.DISCORD_TOKEN,
  DISCORD_CLIENT_SECRET: env.DISCORD_CLIENT_SECRET,
  GEMINI_API_KEY: env.GEMINI_API_KEY,
  JWT_SECRET: env.JWT_SECRET,
})
  .filter(([, value]) => isPlaceholderSecret(value))
  .map(([name]) => name);

if (placeholderSecrets.length > 0) {
  const fatal = `❌ FATAL: Placeholder secrets detected in production environment: ${placeholderSecrets.join(', ')}`;
  if (isProduction) {
    console.error(fatal);
    process.exit(1);
  }
  console.warn(`⚠️  Development mode: placeholder secrets detected (${placeholderSecrets.join(', ')}) — replace them before deploying.`);
}

// (c) CLOUDFLARE_* credentials are OPTIONAL and must stay that way — the bot
// has to boot without them (the Cloudflare provider is only one of several AI
// providers). They are nevertheless placeholder-checked, because the values
// shipped in .env.example must never reach production:
//   • absent              → nothing happens (the variable is optional)
//   • present, real value → nothing happens
//   • present + placeholder → warning in development, fatal in production
const cloudflarePlaceholders = Object.entries({
  CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_API_KEY: env.CLOUDFLARE_API_KEY,
})
  .filter(([, value]) => typeof value === 'string' && value.trim() !== '' && isPlaceholderSecret(value))
  .map(([name]) => name);

if (cloudflarePlaceholders.length > 0) {
  const fatal = `❌ FATAL: Placeholder Cloudflare credentials detected in production environment: ${cloudflarePlaceholders.join(', ')}`;
  if (isProduction) {
    console.error(fatal);
    process.exit(1);
  }
  console.warn(`⚠️  Development mode: placeholder Cloudflare credentials detected (${cloudflarePlaceholders.join(', ')}) — replace them before deploying (or remove the variable; it is optional).`);
}

export default env;
