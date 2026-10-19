import { readdirSync, statSync } from 'fs';
import { join, resolve, relative } from 'path';
import { execFileSync } from 'child_process';

const root = resolve(process.cwd());
const targets = ['apps', 'packages', 'deploy'];
const files = [];

function walk(pathname) {
  if (pathname.includes('node_modules') || pathname.includes('.next')) return;
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
const skippedJsx = [];
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    checked.push(relative(root, file));
  } catch (err) {
    // Next.js app-router files legitimately contain JSX inside .js files.
    // ONLY those are skipped - every other syntax error is fatal.
    // (A previous version matched on the substring "app", which silently
    //  skipped every file under apps/ - including the whole Discord bot.)
    const stderr = String(err?.stderr || '');
    if (stderr.includes("Unexpected token '<'") || stderr.includes('Unexpected token `<`')) {
      skippedJsx.push(relative(root, file));
      continue;
    }
    console.error(`Syntax error in ${relative(root, file)}:\n${stderr.trim()}`);
    throw err;
  }
}

console.log(`Syntax check passed for ${checked.length} JavaScript files.`);
if (skippedJsx.length > 0) {
  console.log(`Skipped ${skippedJsx.length} JSX file(s): ${skippedJsx.join(', ')}`);
}
