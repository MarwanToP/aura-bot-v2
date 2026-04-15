// ================================================================
//  Shared utilities bundle — handlers, redis, logger, i18n, embeds
// ================================================================

// ── commandHandler.js ─────────────────────────────────────────
import { readdirSync, statSync } from 'fs';
import { join, dirname }         from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  const commandsPath = join(__dirname, '../commands');
  await loadDir(client, commandsPath);
  // Also load commands defined inside systems (economy, polls, giveaway, birthday, social, customcmds)
  const systemsPath = join(__dirname, '../systems');
  await loadDir(client, systemsPath);
}

async function loadDir(client, dirPath) {
  for (const entry of readdirSync(dirPath)) {
    const full  = join(dirPath, entry);
    const isDir = statSync(full).isDirectory();
    if (isDir) { await loadDir(client, full); continue; }
    if (!entry.endsWith('.js')) continue;
    try {
      const mod = await import(pathToFileURL(full).href);
      // Default export
      if (mod.default?.data?.execute || (mod.default?.data && mod.default?.execute)) {
        client.commands.set(mod.default.data.name, mod.default);
      }
      // Named exports
      for (const [k, v] of Object.entries(mod)) {
        if (k !== 'default' && v?.data && v?.execute) client.commands.set(v.data.name, v);
      }
    } catch (err) {
      client.logger?.warn(`[Commands] Skipping ${entry}: ${err.message}`);
    }
  }
}
