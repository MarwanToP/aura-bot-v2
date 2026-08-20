import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Dynamically loads all command modules from apps/bot/src/commands/
 */
export async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  
  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    return;
  }

  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    
    // Check if it's a directory
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const commandModule = await import(pathToFileURL(filePath).href);
      let command = commandModule.default;
      if (!command || !command.data) {
        const values = Object.values(commandModule);
        command = values.find((v) => v && v.data && v.execute) || commandModule;
      }

      if (command && command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log(`🔹 Loaded Command: /${command.data.name}`);
      } else {
        console.warn(`⚠️ Command at ${filePath} is missing "data" or "execute" property.`);
      }
    }
  }
}
