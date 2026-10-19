import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Scans a target commands directory and returns an array of loaded command objects.
 * Handles both default exports and named multi-command exports.
 */
export async function collectCommandModules(commandsPath) {
  const commands = [];

  if (!fs.existsSync(commandsPath)) {
    return commands;
  }

  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      try {
        const commandModule = await import(pathToFileURL(filePath).href);
        const seenNames = new Set();

        const addCmd = (cmd) => {
          if (!cmd || typeof cmd !== 'object') return;
          if (cmd.register === false) return;
          if (cmd.data && typeof cmd.execute === 'function') {
            const name = cmd.data.name;
            if (name && !seenNames.has(name)) {
              seenNames.add(name);
              commands.push({ ...cmd, filePath });
            }
          }
        };

        if (commandModule.default) {
          addCmd(commandModule.default);
        }
        for (const [key, val] of Object.entries(commandModule)) {
          if (key !== 'default') {
            addCmd(val);
          }
        }
      } catch (err) {
        console.warn(`⚠️ Skipped command at ${filePath}: ${err.message}`);
      }
    }
  }

  return commands;
}
