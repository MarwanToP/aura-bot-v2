import baseConfig from './index.js';

const config = {
  ...baseConfig,
  links: {
    premium: process.env.PREMIUM_LINK || baseConfig.supportServer,
  },
  limits: {
    free: { aiRequests: Number(process.env.AI_FREE_DAILY_LIMIT || 20) },
    premium: { aiRequests: Number(process.env.AI_PREMIUM_DAILY_LIMIT || 200) },
  },
  cache: {
    aiContextTTL: Number(process.env.AI_CONTEXT_TTL || 3600),
  },
  leveling: {
    xpCooldown: Number(process.env.XP_COOLDOWN_MS || 60000),
    xpPerMessage: {
      min: Number(process.env.XP_PER_MESSAGE_MIN || 8),
      max: Number(process.env.XP_PER_MESSAGE_MAX || 15),
    },
    levelFormula: (level) => 5 * (level ** 2) + (50 * level) + 100,
  },
};

export default config;
