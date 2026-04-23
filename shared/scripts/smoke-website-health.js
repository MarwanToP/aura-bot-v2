import { spawn } from 'child_process';

const port = process.env.SMOKE_PORT || '3199';
const timeoutMs = 60000;
const startedAt = Date.now();

const env = {
  ...process.env,
  NODE_ENV: 'development',
  PORT: port,
  DASHBOARD_STRICT_STARTUP: 'false',
  DASHBOARD_USE_REDIS_SESSION: 'false',
  DASHBOARD_DB_SYNC: 'false',
  DASHBOARD_DB_ALTER: 'false',
};

const child = spawn(process.execPath, ['website/server.js'], {
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
});

child.stdout.on('data', (data) => process.stdout.write(data));
child.stderr.on('data', (data) => process.stderr.write(data));

const cleanup = () => {
  if (!child.killed) child.kill('SIGTERM');
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForHealth() {
  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`website/server.js exited early with code ${child.exitCode}`);
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) {
        const payload = await response.json();
        if (payload?.status === 'ok') {
          console.log(`Website health smoke check passed on /api/health (port ${port}).`);
          return;
        }
      }
    } catch {}

    await sleep(1000);
  }

  throw new Error(`Timed out waiting for website health endpoint on port ${port}`);
}

try {
  await waitForHealth();
} finally {
  cleanup();
}
