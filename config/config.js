// ================================================================
//  AURA BOT v2.0 — Master Configuration
//  MEE6-class + AI features
// ================================================================

export default {
  name:           'Aura',
  version:        '2.0.0',
  defaultPrefix:  '!',
  defaultLanguage:'en',
  supportServer:  process.env.SUPPORT_SERVER || 'https://discord.gg/aura',
  owners:         (process.env.BOT_OWNERS || '').split(',').filter(Boolean),

  // ── Tier Limits (Free vs Premium) ──────────────────────────
  limits: {
    free: {
      automations:      50,
      customCommands:   0,
      reactionRoles:    5,
      embedMessages:    3,
      tempChannels:     3,
      timedMessages:    1,
      ticketPanelEmbeds:1,
      economyItems:     0,
      giveaways:        0,
      socialAlerts:     0,
      musicQuiz:        5,
      aiRequests:       20,   // per day
      polls:            5,
    },
    premium: {
      automations:      999999,
      customCommands:   500,
      reactionRoles:    40,
      embedMessages:    500,
      tempChannels:     100,
      timedMessages:    100,
      ticketPanelEmbeds:10,
      economyItems:     300,
      giveaways:        999999,
      socialAlerts:     999999,
      musicQuiz:        999999,
      aiRequests:       99999, // per day
      polls:            999999,
    },
  },

  // ── Colors ──────────────────────────────────────────────────
  colors: {
    primary:  0x5865F2,
    success:  0x00C851,
    warning:  0xFFBB33,
    error:    0xFF4444,
    info:     0x33B5E5,
    security: 0xEB459E,
    premium:  0xFFD700,
    neutral:  0x2F3136,
    ai:       0x00E5FF,
    economy:  0x43A047,
    fun:      0xFF6B6B,
  },

  // ── Emojis ──────────────────────────────────────────────────
  emojis: {
    success: '✅', error: '❌', warning: '⚠️', loading: '⏳',
    shield: '🛡️', stats: '📊', ticket: '🎫', settings: '⚙️',
    premium: '⭐', ban: '🔨', kick: '👢', warn: '📝', mute: '🔇',
    unlock: '🔓', lock: '🔒', crown: '👑', log: '📋',
    ai: '🤖', economy: '💰', poll: '📊', birthday: '🎂',
    music: '🎵', gift: '🎁', star: '⭐', robot: '🤖',
    search: '🔍', alert: '🔔', social: '📱', level: '📈',
  },

  // ── AI Configuration ────────────────────────────────────────
  ai: {
    provider:        process.env.AI_PROVIDER || 'gemini',
    chatModel:       process.env.AI_CHAT_MODEL || 'gemini-1.5-flash',
    modModel:        process.env.AI_MOD_MODEL || 'gemini-1.5-flash',
    imageModel:      process.env.AI_IMAGE_MODEL || 'imagen-3.0-generate-001',
    enabled:         process.env.AI_ENABLED !== 'false',
    maxTokens:       1000,
    maxHistory:      20,       // messages to keep in memory
    systemPrompt:    `You are Aura, a helpful, friendly, and professional Discord bot assistant. 
You are bilingual (English and Arabic). You help with moderation, answer questions, assist with server management, and engage with the community.
Be concise, helpful, and always maintain a respectful, positive tone. 
When responding in Arabic, use formal Modern Standard Arabic.
Never produce harmful, offensive, or inappropriate content.`,
    moderationPrompt:`Analyze this Discord message for the following violations:
1. Hate speech or discrimination
2. Harassment or bullying
3. Spam or excessive self-promotion
4. NSFW or explicit content
5. Threats or violence
6. Doxxing or privacy violations
7. Scams or phishing attempts

Respond with JSON only:
{"violation": boolean, "category": "string|null", "severity": "low|medium|high|critical", "reason": "string", "confidence": 0-100}`,
  },

  // ── Moderation ──────────────────────────────────────────────
  moderation: {
    warnThresholds: { 3: 'timeout_1h', 5: 'timeout_24h', 7: 'kick', 10: 'ban' },
    defaultPurgeLimitPerCommand: 100,
    softbanDeleteDays: 7,
    caseLogRetentionDays: 365,
  },

  // ── Anti-Nuke ────────────────────────────────────────────────
  antiNuke: {
    banThreshold:           { count: 3,  window: 10 * 60 * 1000 },
    kickThreshold:          { count: 5,  window: 10 * 60 * 1000 },
    channelDeleteThreshold: { count: 2,  window:  5 * 60 * 1000 },
    roleDeleteThreshold:    { count: 3,  window:  5 * 60 * 1000 },
    webhookCreateThreshold: { count: 3,  window:  5 * 60 * 1000 },
    mentionSpamThreshold:   { count: 5,  window:      30 * 1000 },
    joinRaidThreshold:      { count: 10, window:      30 * 1000 },
    punishments:            ['derank', 'timeout', 'kick', 'ban'],
  },

  // ── Leveling ────────────────────────────────────────────────
  leveling: {
    xpPerMessage: { min: 15, max: 25 },
    xpCooldown:   60 * 1000,
    xpPerMinVoice: 5,
    levelFormula: (level) => 5 * (level ** 2) + (50 * level) + 100,
  },

  // ── Economy (Aura Credits) ──────────────────────────────────
  economy: {
    currencyName:    'Aura Credits',
    currencyEmoji:   '💰',
    dailyReward:     { min: 100, max: 500 },
    weeklyReward:    { min: 1000, max: 3000 },
    workReward:      { min: 50, max: 200 },
    workCooldown:    4 * 60 * 60 * 1000,     // 4 hours
    dailyCooldown:   24 * 60 * 60 * 1000,
    weeklyCooldown:  7 * 24 * 60 * 60 * 1000,
    gamblingMax:     10000,
    transferFee:     0.05,                   // 5% fee
    repCooldown:     24 * 60 * 60 * 1000,    // 24 hours
    streakBonus:     50,                     // +50 credits per day in streak
  },

  // ── Tickets ─────────────────────────────────────────────────
  tickets: {
    categories:     ['Technical', 'Billing', 'Report', 'Partnership', 'Other'],
    priorities:     ['Low', 'Medium', 'High', 'Critical'],
    idleAlertHrs:   2,
    slaHours:       { Low: 48, Medium: 24, High: 8, Critical: 2 },
    maxOpenPerUser: 3,
  },

  birthday: {
    defaultMessage: 'Happy Birthday {{user}}! 🎂🎉',
    checkHour:      9, // 9 AM guild timezone
  },

  // ── Cache ────────────────────────────────────────────────────
  cache: {
    guildSettingsTTL:  300,
    userProfileTTL:    120,
    leaderboardTTL:    60,
    xpCooldownTTL:     65,
    antiNukeWindowTTL: 600,
    aiContextTTL:      3600,  // 1 hour AI conversation context
    economyTTL:        60,
  },

  // ── Interaction Timeouts ────────────────────────────────────
  interactions: {
    buttonTimeout:     15 * 60 * 1000,
    selectMenuTimeout: 15 * 60 * 1000,
    modalTimeout:      10 * 60 * 1000,
  },

  // ── Social Alert Platforms ──────────────────────────────────
  socialPlatforms: ['twitch', 'youtube', 'reddit', 'twitter', 'instagram', 'tiktok', 'rss', 'kick', 'bluesky', 'podcast'],

  // ── Supported Locales ────────────────────────────────────────
  locales:    ['en', 'ar'],
  rtlLocales: ['ar'],

  // ── Logging ─────────────────────────────────────────────────
  logging: {
    retentionDays: 90,
    maxFileSize:   '20m',
    maxFiles:      '14d',
  },
};
