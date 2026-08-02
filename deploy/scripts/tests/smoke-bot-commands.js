import { Collection } from 'discord.js';
import { loadCommands } from '../../../bot/core/commandHandler.js';

const logger = {
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  debug: () => {},
};

const client = {
  commands: new Collection(),
  logger,
};

await loadCommands(client);

const requiredCommands = ['staff', 'modstaff', 'settings', 'aura'];
const missing = requiredCommands.filter((name) => !client.commands.has(name));

if (client.commands.size === 0) {
  throw new Error('No commands were loaded. Command discovery path is broken.');
}

if (missing.length > 0) {
  throw new Error(`Missing expected command(s): ${missing.join(', ')}`);
}

console.log(`Bot command smoke check passed. Loaded ${client.commands.size} commands.`);
