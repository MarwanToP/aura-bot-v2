import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Scans a target commands directory and returns an array of loaded command objects.
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
        let command = commandModule.default;
        if (!command || !command.data) {
          const values = Object.values(commandModule);
          command = values.find((v) => v && v.data) || commandModule;
        }

        if (command && command.data) {
          commands.push({ ...command, filePath });
        }
      } catch (err) {
        console.warn(`⚠️ Skipped command at ${filePath}: ${err.message}`);
      }
    }
  }

  return commands;
}
