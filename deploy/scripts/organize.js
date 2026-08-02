import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function moveFile(src, dest) {
  if (fs.existsSync(src)) {
    ensureDir(path.dirname(dest));
    fs.renameSync(src, dest);
    console.log(`Moved ${src} -> ${dest}`);
  }
}

function copyDir(src, dest) {
  if (fs.existsSync(src)) {
    ensureDir(dest);
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log(`Copied ${src} -> ${dest}`);
  }
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Removed ${dir}`);
  }
}

// 1. Ensure target directories
ensureDir('deploy/scripts');
ensureDir('deploy/platform-configs');
ensureDir('packages/systems');
ensureDir('packages/locales');
ensureDir('packages/utils');
ensureDir('apps/bot/src/commands');
ensureDir('apps/bot/src/events');
ensureDir('apps/bot/src/core');
ensureDir('apps/bot/src/utils');
ensureDir('apps/dashboard/src/app');
ensureDir('apps/dashboard/src/components');
ensureDir('refs');

// 2. Move root files
moveFile('PROJECT.md', 'docs/PROJECT.md');
moveFile('main.js', 'deploy/scripts/legacy-main.js');
moveFile('next.config.js', 'apps/dashboard/next.config.js');
moveFile('tailwind.config.js', 'apps/dashboard/tailwind.config.js');

const platformConfigs = [
  'discloud.config', 'docker-compose.oracle.yml', 'koyeb.yaml',
  'railway.json', 'render.yaml', 'squarecloud.app', 'wrangler.toml', '.dev.vars'
];

for (const cfg of platformConfigs) {
  moveFile(cfg, path.join('deploy/platform-configs', cfg));
}

// Move PNG images to refs
fs.readdirSync(rootDir).forEach(file => {
  if (file.startsWith('aura_landing_hero_') && file.endsWith('.png')) {
    moveFile(file, path.join('refs', file));
  }
});

// 3. Copy modules & scripts into new structure
copyDir('shared/scripts', 'deploy/scripts');
copyDir('shared/systems', 'packages/systems');
copyDir('shared/locales', 'packages/locales');
copyDir('shared/utils', 'packages/utils');

copyDir('bot/cogs', 'apps/bot/src/commands');
copyDir('bot/events', 'apps/bot/src/events');
copyDir('bot/core', 'apps/bot/src/core');
copyDir('bot/utils', 'apps/bot/src/utils');

copyDir('dashboard/app', 'apps/dashboard/src/app');
copyDir('dashboard/components', 'apps/dashboard/src/components');
copyDir('components', 'apps/dashboard/src/components');
copyDir('app', 'apps/dashboard/src/app');

// 4. Remove obsolete root directories
removeDir('bot');
removeDir('dashboard');
removeDir('aura-ai-worker');
removeDir('app');
removeDir('components');
removeDir('shared');

console.log('✅ Organization complete!');
