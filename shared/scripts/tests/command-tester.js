// shared/scripts/tests/command-tester.js
// Live Command Verification and Diagnostic Harness for Discord API Testing

import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

dotenv.config({ path: './.env.test' });
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const token = process.env.DISCORD_TOKEN;
const guildId = process.env.TEST_GUILD_ID || process.env.DISCORD_GUILD_ID;
const clientId = process.env.DISCORD_CLIENT_ID;

console.log('════════════════════════════════════════════════════════════════════════');
console.log('  AURA BOT v2.0 — LIVE COMMAND TESTER & DIAGNOSTIC HARNESS');
console.log('════════════════════════════════════════════════════════════════════════');

if (!token) {
  console.error('❌ Missing DISCORD_TOKEN in environment variables.');
  console.log('👉 Please set DISCORD_TOKEN in your .env or .env.test file.');
  process.exit(1);
}

// 1. Audit and load all local command files
const localCommands = new Map();

async function scanDirectory(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      await scanDirectory(full);
      continue;
    }
    if (!entry.endsWith('.js')) continue;
    try {
      const mod = await import(pathToFileURL(full).href);
      const items = [mod.default, ...Object.values(mod).filter(v => v !== mod.default)];
      for (const item of items) {
        if (item && item.register !== false && item.data && typeof item.data.toJSON === 'function') {
          const json = item.data.toJSON();
          if (json && json.name && !localCommands.has(json.name)) {
            localCommands.set(json.name, {
              data: json,
              execute: item.execute,
              file: entry
            });
          }
        }
      }
    } catch (err) {
      console.warn(`  ⚠️ Failed loading file ${entry}: ${err.message}`);
    }
  }
}

await scanDirectory(join(__dirname, '../../../bot/cogs'));
await scanDirectory(join(__dirname, '../../../shared/systems'));

console.log(`\n📦 Successfully indexed ${localCommands.size} local slash commands.`);

// 2. Query Discord API for registered slash commands
const rest = new REST({ version: '10' }).setToken(token);

try {
  if (clientId && guildId) {
    console.log(`\n⏳ Deploying commands directly to Test Guild (${guildId}) for instant testing...`);
    const payload = Array.from(localCommands.values()).map(c => c.data);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: payload });
    console.log(`✅ Registered ${payload.length} commands to Guild ${guildId}.`);
  }
} catch (err) {
  console.warn(`⚠️ Guild deployment notice: ${err.message}`);
}

// 3. Launch Discord client to listen for real slash command interactions & catch physical test errors
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once('ready', async () => {
  console.log(`\n🤖 Bot is online as ${client.user.tag}`);
  console.log(`🔗 Invite URL: https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`);
  console.log('\n💬 READY FOR PHYSICAL DISCORD TESTING!');
  console.log('👉 Go to your Discord app, select your server, and test typing slash commands.');
  console.log('------------------------------------------------------------------------');
});

// Real-time error interceptor for slash commands executed by users in Discord
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;
  const cmd = localCommands.get(commandName);

  console.log(`\n📥 [PHYSICAL INTERACTION] /${commandName} triggered by ${interaction.user.tag} (${interaction.user.id}) in #${interaction.channel?.name || 'DM'}`);

  if (!cmd || typeof cmd.execute !== 'function') {
    console.error(`❌ Command /${commandName} registered on Discord but handler missing in codebase.`);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Command handler not found on bot backend.', ephemeral: true });
    }
    return;
  }

  const startTime = Date.now();
  try {
    await cmd.execute(interaction);
    const duration = Date.now() - startTime;
    console.log(`✅ [SUCCESS] /${commandName} executed cleanly in ${duration}ms.`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [ERROR] /${commandName} failed after ${duration}ms:`, error);
    
    // Friendly response to Discord UI if execution fails physically
    const errorMsg = `❌ **Error executing /${commandName}**: \`${error.message || 'Unknown error'}\``;
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: errorMsg, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMsg, ephemeral: true });
      }
    } catch (replyErr) {
      console.error(`  ⚠️ Could not send error feedback to Discord: ${replyErr.message}`);
    }
  }
});

client.login(token).catch(err => {
  console.error('❌ Failed to log into Discord:', err.message);
  process.exit(1);
});
