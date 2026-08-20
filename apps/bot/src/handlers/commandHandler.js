import path from 'path';
import { fileURLToPath } from 'url';
import { collectCommandModules } from '../utils/commandCollector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Dynamically loads all command modules from apps/bot/src/commands/
 */
export async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  const commands = await collectCommandModules(commandsPath);

  for (const command of commands) {
    if (command && command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`🔹 Loaded Command: /${command.data.name}`);
    } else {
      console.warn(`⚠️ Command at ${command.filePath} is missing "data" or "execute" property.`);
    }
  }
}
