import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  
  const { loadCommands } = await import('../../../bot/core/commandHandler.js');
  const dummyClient = { commands: new Map() };
  await loadCommands(dummyClient, join(__dirname, '../../../bot/cogs'), true);
  await loadCommands(dummyClient, join(__dirname, '../../systems'), false);
  
  const commandsToDeploy = [...dummyClient.commands.values()].map(c => c.data.toJSON());
  console.log(`Prepared ${commandsToDeploy.length} commands for deployment.`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const guilds = client.guilds.cache.map(g => g.id);
  
  console.log(`Found ${guilds.length} active guilds.`);
  
  for (const guildId of guilds) {
    try {
      console.log(`Deploying to guild ${guildId}...`);
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, guildId),
        { body: commandsToDeploy }
      );
      console.log(`✅ Instantly deployed commands to guild ${guildId}.`);
    } catch (err) {
      console.error(`❌ Failed to deploy to guild ${guildId}:`, err.message);
    }
  }
  
  console.log('✅ All guild deployments finished. The "outdated command" cache is now overridden!');
  process.exit(0);
});

client.login(TOKEN);
