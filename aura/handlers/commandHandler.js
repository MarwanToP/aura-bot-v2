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
  await loadDir(client, commandsPath, true);
  // Also load commands defined inside shared systems (economy, polls, etc.)
  const systemsPath = join(__dirname, '../../shared/systems');
  await loadDir(client, systemsPath, false);
}

async function loadDir(client, dirPath, allowOverwrite = true) {
  for (const entry of readdirSync(dirPath)) {
    const full  = join(dirPath, entry);
    const isDir = statSync(full).isDirectory();
    if (isDir) { await loadDir(client, full, allowOverwrite); continue; }
    if (!entry.endsWith('.js')) continue;
    try {
      const mod = await import(pathToFileURL(full).href);
      const register = (command) => {
        const name = command?.data?.name;
        if (!name || !command?.execute) return;
        if (!allowOverwrite && client.commands.has(name)) return;
        client.commands.set(name, command);
      };
      // Default export
      if (mod.default?.data?.execute || (mod.default?.data && mod.default?.execute)) {
        register(mod.default);
      }
      // Named exports
      for (const [k, v] of Object.entries(mod)) {
        if (k !== 'default' && v?.data && v?.execute) register(v);
      }
    } catch (err) {
      client.logger?.warn(`[Commands] Skipping ${entry}: ${err.message}`);
    }
  }
}
