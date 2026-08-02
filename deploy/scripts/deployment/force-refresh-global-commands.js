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
  console.log(`Loaded ${commandsToDeploy.length} unique commands.`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const guilds = client.guilds.cache.map(g => g.id);
  
  // 1. Wipe all Guild-level commands across all joined guilds
  console.log(`🧹 Step 1: Wiping all Guild-level commands across ${guilds.length} guilds...`);
  for (const guildId of guilds) {
    try {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: [] });
      console.log(`  └─ Cleared guild ${guildId}`);
    } catch (e) {
      console.error(`  └─ Failed clearing guild ${guildId}: ${e.message}`);
    }
  }

  // 2. Wipe all Global commands to reset Discord API cache
  console.log('\n🧹 Step 2: Wiping Global Discord API commands cache...');
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
  console.log('  └─ Global commands wiped.');

  console.log('⏱️ Waiting 3 seconds for Discord API cache invalidation...');
  await new Promise(r => setTimeout(r, 3000));

  // 3. Re-push clean 59 commands to Global scope
  console.log('\n🚀 Step 3: Pushing fresh clean 59 Global commands...');
  const res = await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandsToDeploy });
  console.log(`✅ Successfully deployed ${res.length} clean unique commands globally!`);

  process.exit(0);
});

client.login(TOKEN);
