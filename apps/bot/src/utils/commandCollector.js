import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Recursively scans a target commands directory and returns loaded command objects.
 */
export async function collectCommandModules(commandsPath) {
  const commands = [];
  const seenByPathAndName = new Set();

  if (!fs.existsSync(commandsPath)) {
    return commands;
  }

  const collectFromDir = async (dirPath) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await collectFromDir(fullPath);
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith('.js')) continue;

      try {
        const commandModule = await import(pathToFileURL(fullPath).href);
        const candidates = [];

        if (commandModule.default) candidates.push(commandModule.default);
        for (const [key, value] of Object.entries(commandModule)) {
          if (key === 'default') continue;
          candidates.push(value);
        }

        for (const command of candidates) {
          if (!command?.data || typeof command.execute !== 'function') continue;
          const name = command?.data?.name;
          if (!name) continue;

          const dedupeKey = `${fullPath}:${name}`;
          if (seenByPathAndName.has(dedupeKey)) continue;
          seenByPathAndName.add(dedupeKey);

          commands.push({ ...command, filePath: fullPath });
        }
      } catch (err) {
        console.warn(`⚠️ Skipped command at ${fullPath}: ${err.message}`);
      }
    }
  };

  await collectFromDir(commandsPath);

  return commands;
}
