// ================================================================
//  AURA BOT v2.0 — Database Models (PostgreSQL + Sequelize)
//  Covers: Guild, User, Moderation, Economy, Tickets,
//          Giveaways, Birthdays, Leveling, Social, AI, Polls
// ================================================================

import { Sequelize, DataTypes, Op } from 'sequelize';
import logger from '../utils/logger.js';

const dbUrl = process.env.DATABASE_URL;

const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: msg => logger.debug(msg),
    pool:    { max: 50, min: 5, acquire: 60000, idle: 5000 },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
      keepAlive: true,
    },
    // Addition for Neon/SSL robustness
    ssl: true
  })
  : new Sequelize(
    process.env.DB_NAME    || 'aura_bot',
    process.env.DB_USER    || 'aura',
    process.env.DB_PASSWORD || '',
    {
      host:    process.env.DB_HOST || 'localhost',
      port:    parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: msg => logger.debug(msg),
      pool:    { max: 50, min: 5, acquire: 60000, idle: 5000 },
      dialectOptions: process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    }
  );

sequelize.Op = Op;

// ── 1. Guild Settings ─────────────────────────────────────────
const GuildSettings = sequelize.define('GuildSettings', {
  guildId:              { type: DataTypes.STRING, primaryKey: true },
  language:             { type: DataTypes.STRING(5), defaultValue: 'en' },
  prefix:               { type: DataTypes.STRING(10), defaultValue: '!' },
  premiumTier:          { type: DataTypes.INTEGER, defaultValue: 0 },
  premiumExpiry:        { type: DataTypes.DATE, allowNull: true },
  timezone:             { type: DataTypes.STRING, defaultValue: 'UTC' },
  hijriDates:           { type: DataTypes.BOOLEAN, defaultValue: false },

  // Channels
  modLogChannelId:      { type: DataTypes.STRING, allowNull: true },
  auditLogChannelId:    { type: DataTypes.STRING, allowNull: true },
  levelUpChannelId:     { type: DataTypes.STRING, allowNull: true },
  ticketLogChannelId:   { type: DataTypes.STRING, allowNull: true },
  birthdayChannelId:    { type: DataTypes.STRING, allowNull: true },
  starboardChannelId:   { type: DataTypes.STRING, allowNull: true },
  welcomeChannelId:     { type: DataTypes.STRING, allowNull: true },
  farewellChannelId:    { type: DataTypes.STRING, allowNull: true },
  statsChannelId:       { type: DataTypes.STRING, allowNull: true },

  // Roles
  muteRoleId:           { type: DataTypes.STRING, allowNull: true },
  autoRoleId:           { type: DataTypes.STRING, allowNull: true },
  autoRoleDelay:        { type: DataTypes.INTEGER, defaultValue: 0 },
  birthdayRoleId:       { type: DataTypes.STRING, allowNull: true },
  verificationRoleId:   { type: DataTypes.STRING, allowNull: true },

  // Welcome
  welcomeEnabled:       { type: DataTypes.BOOLEAN, defaultValue: false },
  welcomeMessage:       { type: DataTypes.TEXT, allowNull: true },
  welcomeCard:          { type: DataTypes.BOOLEAN, defaultValue: true },
  farewellEnabled:      { type: DataTypes.BOOLEAN, defaultValue: false },
  farewellMessage:      { type: DataTypes.TEXT, allowNull: true },

  // Birthday
  birthdayEnabled:      { type: DataTypes.BOOLEAN, defaultValue: false },
  birthdayMessage:      { type: DataTypes.TEXT, allowNull: true },

  // Leveling
  levelingEnabled:      { type: DataTypes.BOOLEAN, defaultValue: true },
  levelUpMessage:       { type: DataTypes.TEXT, allowNull: true },
  xpMultiplier:         { type: DataTypes.FLOAT, defaultValue: 1.0 },

  // Moderation
  autoModEnabled:       { type: DataTypes.BOOLEAN, defaultValue: false },
  aiModEnabled:         { type: DataTypes.BOOLEAN, defaultValue: false },
  aiModSensitivity:     { type: DataTypes.STRING, defaultValue: 'medium' },

  // Tickets
  ticketEnabled:        { type: DataTypes.BOOLEAN, defaultValue: false },
  ticketCategoryId:     { type: DataTypes.STRING, allowNull: true },
  ticketSupportRoles:   { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },

  // Security
  antiNukeEnabled:      { type: DataTypes.BOOLEAN, defaultValue: false },
  antiNukeConfig:       { type: DataTypes.JSONB, defaultValue: {} },
  antiRaidEnabled:      { type: DataTypes.BOOLEAN, defaultValue: false },
  verificationEnabled:  { type: DataTypes.BOOLEAN, defaultValue: false },

  // Starboard
  starboardEnabled:     { type: DataTypes.BOOLEAN, defaultValue: false },
  starboardThreshold:   { type: DataTypes.INTEGER, defaultValue: 3 },
  starboardEmoji:       { type: DataTypes.STRING, defaultValue: '⭐' },

  // Stats
  statsEnabled:         { type: DataTypes.BOOLEAN, defaultValue: false },
  statsMemberChannelId: { type: DataTypes.STRING, allowNull: true },
  statsOnlineChannelId: { type: DataTypes.STRING, allowNull: true },
  statsBotChannelId:    { type: DataTypes.STRING, allowNull: true },

  // Invites
  inviteTrackEnabled:   { type: DataTypes.BOOLEAN, defaultValue: false },

  // AI
  aiChatEnabled:        { type: DataTypes.BOOLEAN, defaultValue: true },
  aiChatChannelId:      { type: DataTypes.STRING, allowNull: true },

  // Social Alerts
  socialAlertsConfig:   { type: DataTypes.JSONB, defaultValue: {} },

}, { tableName: 'guild_settings', timestamps: true });

// ── 2. User Profile ────────────────────────────────────────────
const UserProfile = sequelize.define('UserProfile', {
  userId:        { type: DataTypes.STRING, allowNull: false },
  guildId:       { type: DataTypes.STRING, allowNull: false },
  language:      { type: DataTypes.STRING(5), allowNull: true },
  xp:            { type: DataTypes.BIGINT, defaultValue: 0 },
  level:         { type: DataTypes.INTEGER, defaultValue: 0 },
  totalMessages: { type: DataTypes.BIGINT, defaultValue: 0 },
  voiceMinutes:  { type: DataTypes.BIGINT, defaultValue: 0 },
  reputation:    { type: DataTypes.INTEGER, defaultValue: 0 },
  lastXpAt:      { type: DataTypes.DATE, allowNull: true },
  lastRepAt:     { type: DataTypes.DATE, allowNull: true },
  bio:           { type: DataTypes.TEXT, allowNull: true },
  cardBackground:{ type: DataTypes.STRING, allowNull: true },
  cardColor:     { type: DataTypes.STRING(7), defaultValue: '#5865F2' },
}, {
  tableName: 'user_profiles', timestamps: true,
  indexes: [{ unique: true, fields: ['userId', 'guildId'] }, { fields: ['guildId', 'xp'] }],
});

// ── 3. Moderation Case ─────────────────────────────────────────
const ModerationCase = sequelize.define('ModerationCase', {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  caseId:       { type: DataTypes.INTEGER, allowNull: false },
  guildId:      { type: DataTypes.STRING, allowNull: false },
  userId:       { type: DataTypes.STRING, allowNull: false },
  moderatorId:  { type: DataTypes.STRING, allowNull: false },
  type:         { type: DataTypes.ENUM('warn','kick','ban','unban','timeout','timeout_remove','softban','note'), allowNull: false },
  reason:       { type: DataTypes.TEXT, defaultValue: 'No reason provided' },
  duration:     { type: DataTypes.BIGINT, allowNull: true },
  expiresAt:    { type: DataTypes.DATE, allowNull: true },
  active:       { type: DataTypes.BOOLEAN, defaultValue: true },
  attachments:  { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  aiAnalysis:   { type: DataTypes.JSONB, allowNull: true },
}, {
  tableName: 'moderation_cases', timestamps: true,
  indexes: [{ unique: true, fields: ['guildId', 'caseId'] }, { fields: ['guildId', 'userId'] }],
});

// ── 4. Warning ─────────────────────────────────────────────────
const Warning = sequelize.define('Warning', {
  guildId:     { type: DataTypes.STRING, allowNull: false },
  userId:      { type: DataTypes.STRING, allowNull: false },
  moderatorId: { type: DataTypes.STRING, allowNull: false },
  reason:      { type: DataTypes.TEXT,   allowNull: false },
  points:      { type: DataTypes.INTEGER, defaultValue: 1 },
  active:      { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'warnings', timestamps: true, indexes: [{ fields: ['guildId', 'userId'] }] });

// ── 5. Ticket ──────────────────────────────────────────────────
const Ticket = sequelize.define('Ticket', {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticketId:       { type: DataTypes.STRING, allowNull: false },
  guildId:        { type: DataTypes.STRING, allowNull: false },
  userId:         { type: DataTypes.STRING, allowNull: false },
  channelId:      { type: DataTypes.STRING, allowNull: false },
  category:       { type: DataTypes.STRING, defaultValue: 'Other' },
  subject:        { type: DataTypes.STRING, allowNull: true },
  priority:       { type: DataTypes.ENUM('Low','Medium','High','Critical'), defaultValue: 'Medium' },
  status:         { type: DataTypes.ENUM('open','claimed','closed','archived'), defaultValue: 'open' },
  claimedBy:      { type: DataTypes.STRING, allowNull: true },
  closedBy:       { type: DataTypes.STRING, allowNull: true },
  closedAt:       { type: DataTypes.DATE, allowNull: true },
  firstResponseAt:{ type: DataTypes.DATE, allowNull: true },
  satisfaction:   { type: DataTypes.INTEGER, allowNull: true },
  transcriptUrl:  { type: DataTypes.TEXT, allowNull: true },
  tags:           { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
}, {
  tableName: 'tickets', timestamps: true,
  indexes: [{ unique: true, fields: ['guildId', 'ticketId'] }, { fields: ['guildId', 'userId'] }],
});

// ── 6. Economy ─────────────────────────────────────────────────
const Economy = sequelize.define('Economy', {
  userId:      { type: DataTypes.STRING, allowNull: false },
  guildId:     { type: DataTypes.STRING, allowNull: false },
  balance:     { type: DataTypes.BIGINT, defaultValue: 0 },
  bank:        { type: DataTypes.BIGINT, defaultValue: 0 },
  totalEarned: { type: DataTypes.BIGINT, defaultValue: 0 },
}, {
  tableName: 'economy', timestamps: true,
  indexes: [{ unique: true, fields: ['userId', 'guildId'] }, { fields: ['guildId', 'balance'] }],
});

// ── 7. Shop Item ───────────────────────────────────────────────
const ShopItem = sequelize.define('ShopItem', {
  guildId:     { type: DataTypes.STRING, allowNull: false },
  name:        { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  price:       { type: DataTypes.INTEGER, allowNull: false },
  stock:       { type: DataTypes.INTEGER, defaultValue: -1 },
  roleId:      { type: DataTypes.STRING, allowNull: true },
  enabled:     { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'shop_items', timestamps: true });

// ── 8. Inventory ───────────────────────────────────────────────
const Inventory = sequelize.define('Inventory', {
  userId:   { type: DataTypes.STRING, allowNull: false },
  guildId:  { type: DataTypes.STRING, allowNull: false },
  itemId:   { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
}, {
  tableName: 'inventories', timestamps: true,
  indexes: [{ unique: true, fields: ['userId', 'guildId', 'itemId'] }],
});

// ── 9. Giveaway ────────────────────────────────────────────────
const Giveaway = sequelize.define('Giveaway', {
  guildId:     { type: DataTypes.STRING, allowNull: false },
  channelId:   { type: DataTypes.STRING, allowNull: false },
  messageId:   { type: DataTypes.STRING, allowNull: true },
  hostId:      { type: DataTypes.STRING, allowNull: false },
  prize:       { type: DataTypes.TEXT, allowNull: false },
  winnerCount: { type: DataTypes.INTEGER, defaultValue: 1 },
  endsAt:      { type: DataTypes.DATE, allowNull: false },
  active:      { type: DataTypes.BOOLEAN, defaultValue: true },
  winners:     { type: DataTypes.TEXT, allowNull: true },
  requirements:{ type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'giveaways', timestamps: true });

// ── 10. Giveaway Entry ─────────────────────────────────────────
const GiveawayEntry = sequelize.define('GiveawayEntry', {
  giveawayId: { type: DataTypes.INTEGER, allowNull: false },
  userId:     { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'giveaway_entries', timestamps: true,
  indexes: [{ unique: true, fields: ['giveawayId', 'userId'] }],
});

// ── 11. Birthday ───────────────────────────────────────────────
const Birthday = sequelize.define('Birthday', {
  userId:  { type: DataTypes.STRING, allowNull: false },
  guildId: { type: DataTypes.STRING, allowNull: false },
  day:     { type: DataTypes.INTEGER, allowNull: false },
  month:   { type: DataTypes.INTEGER, allowNull: false },
  year:    { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'birthdays', timestamps: true,
  indexes: [{ unique: true, fields: ['userId', 'guildId'] }, { fields: ['day', 'month'] }],
});

// ── 12. Level Reward ───────────────────────────────────────────
const LevelReward = sequelize.define('LevelReward', {
  guildId:      { type: DataTypes.STRING, allowNull: false },
  level:        { type: DataTypes.INTEGER, allowNull: false },
  roleId:       { type: DataTypes.STRING, allowNull: false },
  removeOnNext: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'level_rewards', timestamps: true });

// ── 13. Auto Responder ─────────────────────────────────────────
const AutoResponder = sequelize.define('AutoResponder', {
  guildId:        { type: DataTypes.STRING, allowNull: false },
  trigger:        { type: DataTypes.TEXT, allowNull: false },
  triggerType:    { type: DataTypes.ENUM('exact','contains','startsWith','regex'), defaultValue: 'exact' },
  response:       { type: DataTypes.TEXT, allowNull: false },
  enabled:        { type: DataTypes.BOOLEAN, defaultValue: true },
  cooldown:       { type: DataTypes.INTEGER, defaultValue: 0 },
  allowedChannels:{ type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  requiredRoles:  { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  useAI:          { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'auto_responders', timestamps: true });

// ── 14. Custom Command ─────────────────────────────────────────
const CustomCommand = sequelize.define('CustomCommand', {
  guildId:      { type: DataTypes.STRING, allowNull: false },
  name:         { type: DataTypes.STRING, allowNull: false },
  response:     { type: DataTypes.TEXT, allowNull: false },
  description:  { type: DataTypes.STRING, allowNull: true },
  enabled:      { type: DataTypes.BOOLEAN, defaultValue: true },
  cooldown:     { type: DataTypes.INTEGER, defaultValue: 0 },
  requiredRoles:{ type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  allowedChannels:{ type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  useAI:        { type: DataTypes.BOOLEAN, defaultValue: false },
  usageCount:   { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'custom_commands', timestamps: true,
  indexes: [{ unique: true, fields: ['guildId', 'name'] }],
});

// ── 15. Reaction Role ──────────────────────────────────────────
const ReactionRole = sequelize.define('ReactionRole', {
  guildId:   { type: DataTypes.STRING, allowNull: false },
  channelId: { type: DataTypes.STRING, allowNull: false },
  messageId: { type: DataTypes.STRING, allowNull: false },
  emoji:     { type: DataTypes.STRING, allowNull: false },
  roleId:    { type: DataTypes.STRING, allowNull: false },
  type:      { type: DataTypes.ENUM('toggle','add_only','remove_only','unique'), defaultValue: 'toggle' },
}, {
  tableName: 'reaction_roles', timestamps: true,
  indexes: [{ fields: ['messageId', 'emoji'] }],
});

// ── 16. Starboard Entry ────────────────────────────────────────
const StarboardEntry = sequelize.define('StarboardEntry', {
  guildId:       { type: DataTypes.STRING, allowNull: false },
  messageId:     { type: DataTypes.STRING, allowNull: false },
  channelId:     { type: DataTypes.STRING, allowNull: false },
  authorId:      { type: DataTypes.STRING, allowNull: false },
  starboardMsgId:{ type: DataTypes.STRING, allowNull: true },
  starCount:     { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'starboard_entries', timestamps: true, indexes: [{ unique: true, fields: ['guildId', 'messageId'] }] });

// ── 17. Invite Track ───────────────────────────────────────────
const InviteTrack = sequelize.define('InviteTrack', {
  guildId:   { type: DataTypes.STRING, allowNull: false },
  inviterId: { type: DataTypes.STRING, allowNull: false },
  invitedId: { type: DataTypes.STRING, allowNull: false },
  code:      { type: DataTypes.STRING, allowNull: true },
  fake:      { type: DataTypes.BOOLEAN, defaultValue: false },
  left:      { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'invite_tracks', timestamps: true });

// ── 18. Guild Counter ──────────────────────────────────────────
const GuildCounter = sequelize.define('GuildCounter', {
  guildId:     { type: DataTypes.STRING, primaryKey: true },
  caseCount:   { type: DataTypes.INTEGER, defaultValue: 0 },
  ticketCount: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'guild_counters', timestamps: false });

// ── 19. Automation ─────────────────────────────────────────────
const Automation = sequelize.define('Automation', {
  guildId:  { type: DataTypes.STRING, allowNull: false },
  name:     { type: DataTypes.STRING, allowNull: false },
  trigger:  { type: DataTypes.STRING, allowNull: false },
  actions:  { type: DataTypes.JSONB, defaultValue: [] },
  conditions:{ type: DataTypes.JSONB, defaultValue: [] },
  enabled:  { type: DataTypes.BOOLEAN, defaultValue: true },
  runCount: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'automations', timestamps: true });

// ── 20. Timed Message ──────────────────────────────────────────
const TimedMessage = sequelize.define('TimedMessage', {
  guildId:   { type: DataTypes.STRING, allowNull: false },
  channelId: { type: DataTypes.STRING, allowNull: false },
  content:   { type: DataTypes.TEXT, allowNull: false },
  interval:  { type: DataTypes.INTEGER, allowNull: false },
  enabled:   { type: DataTypes.BOOLEAN, defaultValue: true },
  lastSentAt:{ type: DataTypes.DATE, allowNull: true },
  nextSendAt:{ type: DataTypes.DATE, allowNull: true },
}, { tableName: 'timed_messages', timestamps: true });

// ── 21. Achievement ────────────────────────────────────────────
const Achievement = sequelize.define('Achievement', {
  guildId:     { type: DataTypes.STRING, allowNull: false },
  name:        { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  emoji:       { type: DataTypes.STRING, defaultValue: '🏆' },
  criteria:    { type: DataTypes.JSONB, defaultValue: {} },
  roleRewardId:{ type: DataTypes.STRING, allowNull: true },
  xpReward:    { type: DataTypes.INTEGER, defaultValue: 0 },
  coinsReward: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'achievements', timestamps: true });

// ── 22. User Achievement ───────────────────────────────────────
const UserAchievement = sequelize.define('UserAchievement', {
  userId:        { type: DataTypes.STRING, allowNull: false },
  guildId:       { type: DataTypes.STRING, allowNull: false },
  achievementId: { type: DataTypes.INTEGER, allowNull: false },
  unlockedAt:    { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'user_achievements', timestamps: false,
  indexes: [{ unique: true, fields: ['userId', 'guildId', 'achievementId'] }],
});

// ── 23. Temp Channel ───────────────────────────────────────────
const TempChannel = sequelize.define('TempChannel', {
  guildId:   { type: DataTypes.STRING, allowNull: false },
  channelId: { type: DataTypes.STRING, allowNull: false },
  ownerId:   { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'temp_channels', timestamps: true });

// ── 24. Application Form ───────────────────────────────────────
const ApplicationForm = sequelize.define('ApplicationForm', {
  guildId:      { type: DataTypes.STRING, primaryKey: true },
  questions:    { type: DataTypes.JSONB, defaultValue: [] },
  logChannelId: { type: DataTypes.STRING, allowNull: true },
  roleRewardId: { type: DataTypes.STRING, allowNull: true },
  enabled:      { type: DataTypes.BOOLEAN, defaultValue: false },
  cooldown:     { type: DataTypes.INTEGER, defaultValue: 86400 }, // 24h default
}, { tableName: 'application_forms', timestamps: true });

// ── 25. Staff Application ─────────────────────────────────────
const StaffApplication = sequelize.define('StaffApplication', {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:      { type: DataTypes.STRING, allowNull: false },
  userId:       { type: DataTypes.STRING, allowNull: false },
  answers:      { type: DataTypes.JSONB, allowNull: false },
  status:       { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  moderatorId:  { type: DataTypes.STRING, allowNull: true },
  reason:       { type: DataTypes.TEXT, allowNull: true },
}, { 
  tableName: 'staff_applications', timestamps: true,
  indexes: [{ fields: ['guildId', 'userId'] }, { fields: ['status'] }],
});

// ── Register all models ───────────────────────────────────────
const models = {
  GuildSettings, UserProfile, ModerationCase, Warning, Ticket,
  Economy, ShopItem, Inventory, Giveaway, GiveawayEntry,
  Birthday, LevelReward, AutoResponder, CustomCommand,
  ReactionRole, StarboardEntry, InviteTrack, GuildCounter,
  Automation, TimedMessage, Achievement, UserAchievement, TempChannel,
  ApplicationForm, StaffApplication,
};

Object.entries(models).forEach(([name, model]) => {
  sequelize.models[name] = model;
});

export default sequelize;
