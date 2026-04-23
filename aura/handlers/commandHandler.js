// ================================================================
//  Shared utilities bundle — handlers, redis, logger, i18n, embeds
// ================================================================

// ── commandHandler.js ─────────────────────────────────────────
import { readdirSync, statSync } from 'fs';
import { join, dirname }         from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  const audit = {
    filesScanned: 0,
    modulesLoaded: 0,
    registered: 0,
    duplicateAliasesSkipped: 0,
    duplicatesSkipped: 0,
    duplicatesOverwritten: 0,
    invalidExports: 0,
    importFailures: 0,
  };
  const commandsPath = join(__dirname, '../commands');
  await loadDir(client, commandsPath, true, audit);
  // Also load commands defined inside shared systems (economy, polls, etc.)
  const systemsPath = join(__dirname, '../../shared/systems');
  await loadDir(client, systemsPath, false, audit);

  client.logger?.info(
    `[Commands] Audit complete | files=${audit.filesScanned} modules=${audit.modulesLoaded} registered=${audit.registered} duplicateAliasesSkipped=${audit.duplicateAliasesSkipped} duplicatesSkipped=${audit.duplicatesSkipped} duplicatesOverwritten=${audit.duplicatesOverwritten} invalidExports=${audit.invalidExports} importFailures=${audit.importFailures}`,
  );
}

async function loadDir(client, dirPath, allowOverwrite = true, audit) {
  for (const entry of readdirSync(dirPath)) {
    const full  = join(dirPath, entry);
    const isDir = statSync(full).isDirectory();
    if (isDir) { await loadDir(client, full, allowOverwrite, audit); continue; }
    if (!entry.endsWith('.js')) continue;
    audit.filesScanned += 1;
    try {
      const mod = await import(pathToFileURL(full).href);
      audit.modulesLoaded += 1;
      const moduleSeenNames = new Set();

      const register = (command, exportLabel) => {
        if (!command || typeof command !== 'object') return;
        if (command.register === false) return;
        const hasData = Object.prototype.hasOwnProperty.call(command, 'data');
        const hasExecute = Object.prototype.hasOwnProperty.call(command, 'execute');
        if (!hasData && !hasExecute) return;

        const name = command?.data?.name;
        if (!name || typeof command?.execute !== 'function') {
          audit.invalidExports += 1;
          client.logger?.warn(`[Commands] Invalid command export "${exportLabel}" in ${full}`);
          return;
        }

        if (moduleSeenNames.has(name)) {
          audit.duplicateAliasesSkipped += 1;
          return;
        }
        moduleSeenNames.add(name);

        if (!allowOverwrite && client.commands.has(name)) {
          audit.duplicatesSkipped += 1;
          client.logger?.warn(`[Commands] Duplicate command "${name}" skipped from ${full}`);
          return;
        }

        if (allowOverwrite && client.commands.has(name)) {
          audit.duplicatesOverwritten += 1;
          client.logger?.warn(`[Commands] Duplicate command "${name}" overwritten by ${full}`);
        }

        client.commands.set(name, command);
        audit.registered += 1;
      };

      // Default export
      if (mod.default) {
        register(mod.default, 'default');
      }
      // Named exports
      for (const [k, v] of Object.entries(mod)) {
        if (k !== 'default') register(v, k);
      }
    } catch (err) {
      audit.importFailures += 1;
      client.logger?.warn(`[Commands] Skipping ${entry}: ${err.message}`);
    }
  }
}
