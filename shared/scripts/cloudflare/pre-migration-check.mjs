import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../');

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'REDIS_URL',
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_CALLBACK_URL',
  'GEMINI_API_KEY',
  'JWT_SECRET'
];

async function checkConfig() {
  console.log('🔍 Aura Bot v2.0 — Pre-Migration Readiness Check\n');

  // 1. Check Root wrangler.toml
  const rootWranglerPath = path.join(ROOT, 'wrangler.toml');
  if (fs.existsSync(rootWranglerPath)) {
    const content = fs.readFileSync(rootWranglerPath, 'utf8');
    const hasOrigin = content.includes('BACKEND_ORIGIN = "http');
    if (!hasOrigin) {
      console.warn('⚠️  [DASHBOARD] BACKEND_ORIGIN is empty in root wrangler.toml. You must set this to your current backend URL before deploying.');
    } else {
      console.log('✅ [DASHBOARD] BACKEND_ORIGIN is configured.');
    }
  }

  // 2. Check AI Worker wrangler.toml
  const aiWranglerPath = path.join(ROOT, 'aura-ai-worker/wrangler.toml');
  if (fs.existsSync(aiWranglerPath)) {
    const content = fs.readFileSync(aiWranglerPath, 'utf8');
    if (!content.includes('[ai]') && !content.includes('binding = "AI"')) {
      console.warn('⚠️  [AI WORKER] AI binding is missing in aura-ai-worker/wrangler.toml. Ensure you have "npx wrangler ai" enabled or the binding added.');
    } else {
      console.log('✅ [AI WORKER] AI binding is present.');
    }
  }

  // 3. Check GitHub Actions Secrets
  console.log('\n🔐 Required GitHub Secrets for Cloudflare CI/CD:');
  const missingSecrets = [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID'
  ];
  missingSecrets.forEach(s => console.log(`   - ${s}`));

  // 4. Check App Env Vars
  console.log('\n📋 Required Backend Environment Variables (Ensure these match in Cloudflare/Render):');
  REQUIRED_ENV_VARS.forEach(v => console.log(`   - ${v}`));

  console.log('\n🚀 Next Step: Run "npm run cf:deploy" to test the Edge Proxy.');
}

checkConfig().catch(console.error);
