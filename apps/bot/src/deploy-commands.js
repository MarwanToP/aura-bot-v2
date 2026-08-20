import { REST, Routes } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../../../packages/config/src/env.js';
import { collectCommandModules } from './utils/commandCollector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function deploy() {
  const commandsPath = path.join(__dirname, 'commands');
  const commandModules = await collectCommandModules(commandsPath);
  const commands = commandModules.map((cmd) => cmd.data.toJSON());

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
