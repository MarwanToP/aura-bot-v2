import { readdirSync, statSync } from 'fs';
import { join, resolve, relative } from 'path';
import { execFileSync } from 'child_process';

const root = resolve(process.cwd());
const targets = ['main.js', 'aura', 'shared', 'website'];
const files = [];

function walk(pathname) {
  const stats = statSync(pathname);
  if (stats.isDirectory()) {
    for (const entry of readdirSync(pathname)) {
      walk(join(pathname, entry));
    }
    return;
  }
  if (pathname.endsWith('.js')) files.push(pathname);
}

for (const target of targets) {
  const fullPath = resolve(root, target);
  walk(fullPath);
}

const checked = [];
for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  checked.push(relative(root, file));
}

console.log(`Syntax check passed for ${checked.length} JavaScript files.`);
