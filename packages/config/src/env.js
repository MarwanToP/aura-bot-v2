import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

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
  
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').default('super_secret_jwt_key_at_least_32_chars_long'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters').default('super_secret_session_key_at_least_32_chars_long'),
  CORS_ORIGINS: z.string().transform((val) => val.split(',').map((s) => s.trim())).default('http://localhost:3000')
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid Environment Variables detected:');
  console.error(JSON.stringify(_env.error.format(), null, 2));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = _env.success ? _env.data : envSchema.partial().parse(process.env);
export default env;
