import { StorageAdapter } from './storage';
import { INITIAL_BOTS } from './mockData';
import { Bot, CreateBotInput, UpdateBotInput } from '../types/bot';

const BOTS_KEY = 'bots_catalog';

export const BotService = {
  getBots(): Bot[] {
    return StorageAdapter.get<Bot[]>(BOTS_KEY, INITIAL_BOTS);
  },

  getBotById(id: string): Bot | undefined {
    const bots = this.getBots();
    return bots.find(b => b.id === id);
  },

  createBot(input: CreateBotInput): Bot {
    const bots = this.getBots();
    const newBot: Bot = {
      ...input,
      id: `bot_${Date.now()}`,
      createdAt: new Date().toISOString(),
      uptimeSeconds: 0,
      latencyMs: 15 + Math.floor(Math.random() * 20)
    };
    const updated = [newBot, ...bots];
    StorageAdapter.set(BOTS_KEY, updated);
    return newBot;
  },

  updateBot(id: string, updates: UpdateBotInput): Bot {
    const bots = this.getBots();
    const index = bots.findIndex(b => b.id === id);
    if (index === -1) throw new Error(`Bot with id ${id} not found`);

    const updatedBot = { ...bots[index], ...updates };
    bots[index] = updatedBot;
    StorageAdapter.set(BOTS_KEY, bots);
    return updatedBot;
  },

  deleteBot(id: string): void {
    const bots = this.getBots();
    const filtered = bots.filter(b => b.id !== id);
    StorageAdapter.set(BOTS_KEY, filtered);
  },

  toggleBotStatus(id: string): Bot {
    const bot = this.getBotById(id);
    if (!bot) throw new Error('Bot not found');
    const nextStatus = bot.status === 'online' ? 'offline' : 'online';
    return this.updateBot(id, { status: nextStatus });
  }
};
