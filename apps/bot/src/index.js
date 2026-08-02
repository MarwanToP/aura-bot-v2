import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { env } from '../../../packages/config/src/env.js';
import { handleInteraction } from './handlers/interactionHandler.js';
import { handleVoiceStateUpdate } from './modules/tempVoice.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

client.once('ready', () => {
  console.log(`🤖 Aura Bot v2 online as ${client.user.tag} (Serving ${client.guilds.cache.size} guilds)`);
});

// 1. Slash Command & Interaction Event Listener
client.on('interactionCreate', (interaction) => {
  handleInteraction(client, interaction);
});

// 2. Voice State Updates (TempVoice Manager)
client.on('voiceStateUpdate', (oldState, newState) => {
  handleVoiceStateUpdate(client, oldState, newState);
});

if (process.env.NODE_ENV !== 'test') {
  client.login(env.DISCORD_TOKEN).catch(err => {
    console.warn('⚠️ Discord Client login deferred or missing token:', err.message);
  });
}

export default client;
