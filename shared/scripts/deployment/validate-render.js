// ================================================================
//  Aura Bot v2.0 — Render Pre-Flight Verification Script
// ================================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

console.log('🔍 Starting Render Deployment Readiness Audit...\n');

let issues = 0;

// 1. Check render.yaml
const renderYamlPath = path.join(rootDir, 'render.yaml');
if (fs.existsSync(renderYamlPath)) {
  console.log('✅ render.yaml found at repository root.');
} else {
  console.log('❌ MISSING: render.yaml at repository root.');
  issues++;
}

// 2. Check Dockerfile
const dockerfilePath = path.join(rootDir, 'Dockerfile');
if (fs.existsSync(dockerfilePath)) {
  console.log('✅ Dockerfile found at repository root.');
} else {
  console.log('❌ MISSING: Dockerfile at repository root.');
  issues++;
}

// 3. Check .dockerignore
const dockerignorePath = path.join(rootDir, '.dockerignore');
if (fs.existsSync(dockerignorePath)) {
  console.log('✅ .dockerignore found at repository root.');
} else {
  console.log('⚠️ WARNING: .dockerignore missing (build speed may be impacted).');
}

// 4. Check main.js entrypoint
const mainJsPath = path.join(rootDir, 'main.js');
if (fs.existsSync(mainJsPath)) {
  console.log('✅ main.js entrypoint verified.');
} else {
  console.log('❌ MISSING: main.js entrypoint.');
  issues++;
}

// 5. Environment requirements check
console.log('\n📋 Required Environment Variables for Render Deployment:');
const requiredVars = [
  { name: 'DISCORD_TOKEN', desc: 'Bot token from Discord Developer Portal' },
  { name: 'DATABASE_URL', desc: 'PostgreSQL connection string (e.g. Neon or Render Postgres)' },
  { name: 'REDIS_URL', desc: 'Redis connection string (e.g. Upstash Redis)' },
  { name: 'DISCORD_CLIENT_ID', desc: 'Required for Dashboard mode' },
  { name: 'DISCORD_CLIENT_SECRET', desc: 'Required for Dashboard mode' },
];

requiredVars.forEach(v => {
  const isSet = !!process.env[v.name];
  const icon = isSet ? '✅' : 'ℹ️ ';
  console.log(`${icon} ${v.name.padEnd(22)} - ${v.desc} ${isSet ? '(Found in env)' : '(Required in Render Settings)'}`);
});

console.log('\n------------------------------------------------');
if (issues === 0) {
  console.log('✨ All repository deployment files are READY for Render deployment!');
  console.log('🚀 Connect this GitHub repository to Render using Blueprint or Docker Web/Worker Service.');
} else {
  console.log(`❌ Found ${issues} critical issue(s) that must be resolved before deploying.`);
  process.exit(1);
}
