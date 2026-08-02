import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  
  const { loadCommands } = await import('../../../bot/core/commandHandler.js');
  const dummyClient = { commands: new Map() };
  await loadCommands(dummyClient);
  
  const commandsToDeploy = [...dummyClient.commands.values()].map(c => c.data.toJSON());
  console.log(`Prepared ${commandsToDeploy.length} commands.`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const guilds = client.guilds.cache.map(g => g.id);
  
  console.log(`🧹 Clearing Guild-level command overrides for ${guilds.length} guilds...`);
  
  for (const guildId of guilds) {
    try {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, guildId),
        { body: [] }
      );
      console.log(`✅ Cleared guild commands for guild ${guildId}.`);
    } catch (err) {
      console.error(`❌ Failed to clear guild ${guildId}:`, err.message);
    }
  }

  console.log('\n🚀 Registering single clean copy of Global Commands...');
  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commandsToDeploy }
  );
  
  console.log(`✅ Successfully deployed ${commandsToDeploy.length} commands GLOBALLY without any Guild duplicates!`);
  process.exit(0);
});

client.login(TOKEN);
