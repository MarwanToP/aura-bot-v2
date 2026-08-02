export { env } from './src/env.js';
import { env } from './src/env.js';

export default {
  env,
  name: 'Aura',
  version: '2.0.0',
  defaultPrefix: '!',
  defaultLanguage: 'en',
  supportServer: 'https://discord.gg/aura',
  owners: [],
  colors: {
    primary: 0x5865F2,
    success: 0x00C851,
    warning: 0xFFBB33,
    error: 0xFF4444,
    info: 0x33B5E5,
    security: 0xEB459E,
    premium: 0xFFD700,
    neutral: 0x2F3136,
    ai: 0x00E5FF,
    economy: 0x43A047,
  },
  ai: {
    provider: 'gemini',
    chatModel: 'gemini-1.5-flash',
    modModel: 'gemini-1.5-flash',
    enabled: true,
    systemPrompt: `You are Aura, a helpful, friendly, and professional Discord bot assistant.`,
  }
};
