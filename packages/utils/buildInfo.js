// ================================================================
//  Build Info Utility
//  Identifies WHICH build of the bot is currently running.
//
//  The live production bot was once found serving a stale build, which
//  looked exactly like "most commands don't work". This module makes the
//  running build identifiable (e.g. from the /doctor report):
//
//    version    — repo root package.json "version" field
//    commit     — short git SHA of the current checkout (or "unknown")
//    branch     — current git branch (or "unknown")
//    buildDate  — ISO mtime of the repo root package.json
//    node       — process.version
//
//  Design rules:
//   • never throws — every probe (fs, git) is individually guarded
//   • git is optional — a missing git binary / non-repo / timeout
//     degrades to "unknown" instead of breaking the caller
//   • the result is cached, but exposed as a function so it can be
//     re-read on demand (getBuildInfo({ refresh: true }))
// ================================================================
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Walk up from packages/utils/ to the monorepo root.
 * The root is the nearest ancestor owning a package.json with a
 * "workspaces" field — two levels up from packages/utils/ in this repo.
 */
function findRepoRoot(startDir) {
  try {
    let dir = startDir;
    const { root } = parse(dir);
    for (let i = 0; i < 12; i++) {
      try {
        const parsed = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
        if (parsed && typeof parsed === 'object' && parsed.workspaces) return dir;
      } catch {
        // no readable/parsable package.json here — keep walking up
      }
      if (dir === root) break;
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // fall through to the fixed fallback below
  }
  // packages/utils/ → two levels up is the repo root.
  return join(startDir, '..', '..');
}

const REPO_ROOT = findRepoRoot(THIS_DIR);

/** Read + parse the repo root package.json (null on any failure). */
function readRootPackage() {
  try {
    const parsed = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** Run a git command in the repo root. Returns "unknown" on any failure. */
function git(args) {
  try {
    const out = execFileSync('git', args, {
      cwd: REPO_ROOT,
      timeout: 500,
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    });
    const text = String(out ?? '').trim();
    return text || 'unknown';
  } catch {
    return 'unknown';
  }
}

/** Compute a fresh snapshot of the build information. */
function computeBuildInfo() {
  const pkg = readRootPackage();

  let buildDate;
  try {
    buildDate = statSync(join(REPO_ROOT, 'package.json')).mtime.toISOString();
  } catch {
    buildDate = new Date().toISOString();
  }

  return {
    version: typeof pkg?.version === 'string' && pkg.version ? pkg.version : 'unknown',
    commit: git(['rev-parse', '--short', 'HEAD']),
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
    buildDate,
    node: process.version,
  };
}

// Module-level cache — repeated calls are cheap.
let cached = null;

/**
 * Return the build information of the running code.
 * @param {{ refresh?: boolean }} [options] pass { refresh: true } to re-read.
 * @returns {{ version: string, commit: string, branch: string, buildDate: string, node: string }}
 */
export function getBuildInfo(options = {}) {
  if (!cached || options?.refresh === true) {
    try {
      cached = computeBuildInfo();
    } catch {
      cached = {
        version: 'unknown',
        commit: 'unknown',
        branch: 'unknown',
        buildDate: new Date().toISOString(),
        node: process.version,
      };
    }
  }
  return cached;
}

/** Drop the cached snapshot (forces the next getBuildInfo() to re-read). */
export function resetBuildInfoCache() {
  cached = null;
}

/** Shorten an ISO timestamp to "YYYY-MM-DDTHH:MMZ" (falls back to the raw value). */
function shortenIso(iso) {
  if (typeof iso !== 'string' || !iso) return 'unknown';
  const m = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/.exec(iso);
  return m ? `${m[1]}Z` : iso;
}

/**
 * One-line human readable build description, e.g.
 * "v2.0.0 · abc1234 (main) · built 2026-10-19T12:34Z"
 * @param {object} [info] optional pre-fetched build info
 */
export function formatBuildInfo(info = null) {
  const i = info && typeof info === 'object' ? info : getBuildInfo();
  const version = i.version || 'unknown';
  const commit = i.commit || 'unknown';
  const branch = i.branch || 'unknown';
  return `v${version} · ${commit} (${branch}) · built ${shortenIso(i.buildDate)}`;
}

export default getBuildInfo;
