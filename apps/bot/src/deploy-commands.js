import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { env } from '../../../packages/config/src/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

async function collectCommands() {
  if (!fs.existsSync(commandsPath)) return;

  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const commandModule = await import(pathToFileURL(filePath).href);
      let command = commandModule.default;
      if (!command || !command.data) {
        const values = Object.values(commandModule);
        command = values.find((v) => v && v.data) || commandModule;
      }

      if (command?.data) {
        commands.push(command.data.toJSON());
      }
    }
  }
}

async function deploy() {
  await collectCommands();

  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

  try {
    console.log(`🚀 Refreshing ${commands.length} application (/) commands...`);

    // Register globally across all guilds
    const data = await rest.put(
      Routes.applicationCommands(env.DISCORD_CLIENT_ID),
      { body: commands }
    );

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands globally.`);
  } catch (error) {
    console.error('❌ Error deploying application commands:', error);
  }
}

deploy();
