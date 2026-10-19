// ================================================================
//  @aura/database — Sequelize Models
//  Covers: Guild, User, Moderation, Economy, Tickets,
//          Giveaways, Birthdays, Leveling, Social, AI, Polls
// ================================================================

import { Sequelize, DataTypes, Op } from 'sequelize';
import logger from '../logger/index.js';

const dbUrl = process.env.DATABASE_URL;

const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: msg => logger.debug(msg),
    pool:    { max: 50, min: 5, acquire: 60000, idle: 5000 },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
      },
      keepAlive: true,
    },
  })
  : new Sequelize(
    process.env.DB_NAME    || 'aura_bot',
    process.env.DB_USER    || 'aura',
    process.env.DB_PASSWORD || '',
    {
      host:    process.env.DB_HOST || 'localhost',
      port:    parseInt(process.env.DB_PORT || '5432', 10),
      dialect: 'postgres',
      logging: msg => logger.debug(msg),
      pool:    { max: 50, min: 5, acquire: 60000, idle: 5000 },
      dialectOptions: process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: true } } : {},
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

  modLogChannelId:      { type: DataTypes.STRING, allowNull: true },
  auditLogChannelId:    { type: DataTypes.STRING, allowNull: true },
  levelUpChannelId:     { type: DataTypes.STRING, allowNull: true },
  ticketLogChannelId:   { type: DataTypes.STRING, allowNull: true },
  staffLogChannelId:    { type: DataTypes.STRING, allowNull: true },
  voiceLogChannelId:    { type: DataTypes.STRING, allowNull: true },
  birthdayChannelId:    { type: DataTypes.STRING, allowNull: true },
  starboardChannelId:   { type: DataTypes.STRING, allowNull: true },
  welcomeChannelId:     { type: DataTypes.STRING, allowNull: true },
  farewellChannelId:    { type: DataTypes.STRING, allowNull: true },
  statsChannelId:       { type: DataTypes.STRING, allowNull: true },

  muteRoleId:           { type: DataTypes.STRING, allowNull: true },
  autoRoleId:           { type: DataTypes.STRING, allowNull: true },
  autoRoleDelay:        { type: DataTypes.INTEGER, defaultValue: 0 },
  birthdayRoleId:       { type: DataTypes.STRING, allowNull: true },
  verificationRoleId:   { type: DataTypes.STRING, allowNull: true },
  verificationChannelId:{ type: DataTypes.STRING, allowNull: true },
  verificationMessageId:{ type: DataTypes.STRING, allowNull: true },
  unverifiedRoleId:     { type: DataTypes.STRING, allowNull: true },
  verificationMode:     { type: DataTypes.STRING(32), defaultValue: 'web' },
  altAgeLimit:          { type: DataTypes.INTEGER, defaultValue: 7 },

  welcomeEnabled:       { type: DataTypes.BOOLEAN, defaultValue: false },
  welcomeMessage:       { type: DataTypes.TEXT, allowNull: true },
  welcomeCard:          { type: DataTypes.BOOLEAN, defaultValue: true },
  farewellEnabled:      { type: DataTypes.BOOLEAN, defaultValue: false },
  farewellMessage:      { type: DataTypes.TEXT, allowNull: true },

  birthdayEnabled:      { type: DataTypes.BOOLEAN, defaultValue: false },
  birthdayMessage:      { type: DataTypes.TEXT, allowNull: true },

  levelingEnabled:      { type: DataTypes.BOOLEAN, defaultValue: true },
  levelUpMessage:       { type: DataTypes.TEXT, allowNull: true },
  xpMultiplier:         { type: DataTypes.FLOAT, defaultValue: 1.0 },
  xpDecayEnabled:       { type: DataTypes.BOOLEAN, defaultValue: true },
  xpDecayGraceDays:     { type: DataTypes.INTEGER, defaultValue: 7 },
  xpDecayHalfLifeDays:  { type: DataTypes.INTEGER, defaultValue: 14 },

  autoModEnabled:       { type: DataTypes.BOOLEAN, defaultValue: false },
  aiModEnabled:         { type: DataTypes.BOOLEAN, defaultValue: false },
  aiModSensitivity:     { type: DataTypes.STRING, defaultValue: 'medium' },
  autoModConfig:        { type: DataTypes.JSONB, defaultValue: { bannedWords: [], inviteLinks: false, spamThreshold: 5, action: 'timeout', durationMinutes: 10, exemptRoles: [], exemptChannels: [] } },
  warningConfig:        { type: DataTypes.JSONB, defaultValue: { maxWarnings: 3, defaultAction: 'timeout', durationMinutes: 60 } },
  appealsConfig:        { type: DataTypes.JSONB, defaultValue: { enabled: false, appealChannelId: null, formatInstructions: '' } },

  ticketEnabled:        { type: DataTypes.BOOLEAN, defaultValue: false },
  ticketCategoryId:     { type: DataTypes.STRING, allowNull: true },
  ticketSupportRoles:   { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },

  antiNukeEnabled:      { type: DataTypes.BOOLEAN, defaultValue: false },
  antiNukeConfig:       { type: DataTypes.JSONB, defaultValue: {} },
  antiRaidEnabled:      { type: DataTypes.BOOLEAN, defaultValue: false },
  verificationEnabled:  { type: DataTypes.BOOLEAN, defaultValue: false },

  tempVoiceEnabled:      { type: DataTypes.BOOLEAN, defaultValue: false },
  tempVoiceCreatorId:    { type: DataTypes.STRING, allowNull: true },
  tempVoiceCategoryId:   { type: DataTypes.STRING, allowNull: true },
  tempVoiceNameTemplate: { type: DataTypes.STRING, defaultValue: '{user}\'s Room' },
  voiceTextLinkedChannelId: { type: DataTypes.STRING, allowNull: true },

  starboardEnabled:     { type: DataTypes.BOOLEAN, defaultValue: false },
  starboardThreshold:   { type: DataTypes.INTEGER, defaultValue: 3 },
  starboardEmoji:       { type: DataTypes.STRING, defaultValue: '⭐' },

  statsEnabled:         { type: DataTypes.BOOLEAN, defaultValue: false },
  statsMemberChannelId: { type: DataTypes.STRING, allowNull: true },
  statsOnlineChannelId: { type: DataTypes.STRING, allowNull: true },
  statsBotChannelId:    { type: DataTypes.STRING, allowNull: true },
  statsCustomChannelId: { type: DataTypes.STRING, allowNull: true },
  statsMemberFormat:   { type: DataTypes.STRING, defaultValue: '👥 Members: {count}' },
  statsOnlineFormat:   { type: DataTypes.STRING, defaultValue: '🟢 Online: {count}' },
  statsBotFormat:      { type: DataTypes.STRING, defaultValue: '🤖 Bots: {count}' },
  statsCustomFormat:   { type: DataTypes.STRING, defaultValue: '🎯 Goal: {count}/{target}' },
  customGoalTarget:    { type: DataTypes.INTEGER, defaultValue: 1000 },

  inviteTrackEnabled:   { type: DataTypes.BOOLEAN, defaultValue: false },
  inviteConfig:         { type: DataTypes.JSONB, defaultValue: { fakeShieldEnabled: true, minAccountAgeDays: 7, rankRewards: [] } },

  aiChatEnabled:        { type: DataTypes.BOOLEAN, defaultValue: true },
  aiChatChannelId:      { type: DataTypes.STRING, allowNull: true },

  socialAlertsConfig:   { type: DataTypes.JSONB, defaultValue: {} },

  welcomeConfig: {
    type: DataTypes.JSONB,
    defaultValue: {
      enabled: false,
      channelId: null,
      message: 'Welcome {user} to {guild}!',
      image: 'default',
      coordinates: { avatar: { x: 50, y: 50 }, text: { x: 150, y: 150 } },
      color: '#FFFFFF'
    }
  },
  staffSystemEnabled:   { type: DataTypes.BOOLEAN, defaultValue: false },
  staffRoleIds:         { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },

  commandAliases:       { type: DataTypes.JSONB, defaultValue: {} },
  commandBlacklist:     { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  disabledChannels:     { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },

  suggestionsEnabled:   { type: DataTypes.BOOLEAN, defaultValue: false },
  suggestionsChannelId: { type: DataTypes.STRING, allowNull: true },
  suggestionUpvotes:    { type: DataTypes.JSONB, defaultValue: {} },
  suggestionDownvotes:  { type: DataTypes.JSONB, defaultValue: {} },
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

const CommandSettings = sequelize.define('CommandSettings', {
  guildId: { type: DataTypes.STRING, allowNull: false },
  commandName: { type: DataTypes.STRING, allowNull: false },
  enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  allowedRoles: { type: DataTypes.JSONB, defaultValue: [] },
}, {
  tableName: 'command_settings',
  timestamps: false,
  indexes: [{ unique: true, fields: ['guildId', 'commandName'] }],
});

// ── 5. Application Forms (Appy-style staff applications) ──────
const ApplicationForm = sequelize.define('ApplicationForm', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  guildId:        { type: DataTypes.STRING, allowNull: false },
  name:           { type: DataTypes.STRING, defaultValue: 'Staff Application' },
  description:    { type: DataTypes.TEXT, allowNull: true },
  enabled:        { type: DataTypes.BOOLEAN, defaultValue: false },
  questions:      { type: DataTypes.JSONB, defaultValue: [] },
  roleRewardId:   { type: DataTypes.STRING, allowNull: true },
  denyRoleId:     { type: DataTypes.STRING, allowNull: true },
  removeRoleId:   { type: DataTypes.STRING, allowNull: true },
  requiredRoleId: { type: DataTypes.STRING, allowNull: true },
  pingRoleId:     { type: DataTypes.STRING, allowNull: true },
  managerRoleId:  { type: DataTypes.STRING, allowNull: true },
  logChannelId:   { type: DataTypes.STRING, allowNull: true },
  cooldown:       { type: DataTypes.INTEGER, defaultValue: 86400 },
}, {
  tableName: 'application_forms', timestamps: true,
  indexes: [{ fields: ['guildId'] }, { fields: ['guildId', 'enabled'] }],
});

// ── 6. Staff Applications (submissions + review state) ────────
const StaffApplication = sequelize.define('StaffApplication', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  guildId:      { type: DataTypes.STRING, allowNull: false },
  formId:       { type: DataTypes.UUID, allowNull: true, references: { model: 'application_forms', key: 'id' }, onDelete: 'RESTRICT' },
  userId:       { type: DataTypes.STRING, allowNull: false },
  answers:      { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  status:       { type: DataTypes.STRING, defaultValue: 'pending' },
  moderatorId:  { type: DataTypes.STRING, allowNull: true },
  reviewedAt:   { type: DataTypes.DATE, allowNull: true },
  logChannelId: { type: DataTypes.STRING, allowNull: true },
  logMessageId: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'staff_applications', timestamps: true,
  indexes: [{ fields: ['guildId', 'userId'] }, { fields: ['guildId', 'status'] }, { fields: ['guildId', 'formId'] }, { fields: ['guildId', 'createdAt'] }, { fields: ['formId'] }],
});

// ── 7. Warnings ───────────────────────────────────────────────
const Warning = sequelize.define('Warning', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:     { type: DataTypes.STRING, allowNull: false },
  userId:      { type: DataTypes.STRING, allowNull: false },
  moderatorId: { type: DataTypes.STRING, allowNull: false },
  reason:      { type: DataTypes.TEXT, allowNull: false },
  points:      { type: DataTypes.INTEGER, defaultValue: 1 },
  active:      { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'warnings', timestamps: true,
  indexes: [{ fields: ['guildId', 'userId'] }],
});

// ── 8. Guild Counter (per-guild case/ticket tallies) ──────────
const GuildCounter = sequelize.define('GuildCounter', {
  guildId:     { type: DataTypes.STRING, primaryKey: true },
  caseCount:   { type: DataTypes.INTEGER, defaultValue: 0 },
  ticketCount: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'guild_counters', timestamps: false });

// ── 9. Tickets ─────────────────────────────────────────────────
const Ticket = sequelize.define('Ticket', {
  id:               { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticketId:         { type: DataTypes.STRING, allowNull: false },
  guildId:          { type: DataTypes.STRING, allowNull: false },
  userId:           { type: DataTypes.STRING, allowNull: false },
  channelId:        { type: DataTypes.STRING, allowNull: false },
  category:         { type: DataTypes.STRING, defaultValue: 'Other' },
  subject:          { type: DataTypes.STRING, allowNull: true },
  priority:         { type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'), defaultValue: 'Medium' },
  status:           { type: DataTypes.ENUM('open', 'claimed', 'closed', 'archived'), defaultValue: 'open' },
  claimedBy:        { type: DataTypes.STRING, allowNull: true },
  closedBy:         { type: DataTypes.STRING, allowNull: true },
  closedAt:         { type: DataTypes.DATE, allowNull: true },
  firstResponseAt:  { type: DataTypes.DATE, allowNull: true },
  satisfaction:     { type: DataTypes.INTEGER, allowNull: true },
  transcriptUrl:    { type: DataTypes.TEXT, allowNull: true },
  tags:             { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  tier:             { type: DataTypes.INTEGER, defaultValue: 1 },
}, {
  tableName: 'tickets', timestamps: true,
  indexes: [{ fields: ['guildId', 'status'] }, { unique: true, fields: ['guildId', 'ticketId'] }],
});

// ── 10. Ticket CSAT feedback ───────────────────────────────────
const TicketCSAT = sequelize.define('TicketCSAT', {
  id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticketId: { type: DataTypes.STRING, allowNull: false },
  guildId:  { type: DataTypes.STRING, allowNull: false },
  userId:   { type: DataTypes.STRING, allowNull: false },
  rating:   { type: DataTypes.INTEGER, allowNull: false },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  staffId:  { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'ticket_csat', timestamps: true,
  indexes: [{ fields: ['ticketId'] }],
});

// ── 11. Ticket Panels ──────────────────────────────────────────
const TicketPanel = sequelize.define('TicketPanel', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:     { type: DataTypes.STRING, allowNull: false },
  panelId:     { type: DataTypes.STRING, allowNull: false },
  title:       { type: DataTypes.STRING, defaultValue: 'Support Ticket' },
  description: { type: DataTypes.TEXT, defaultValue: 'Click a button below to open a ticket' },
  image:       { type: DataTypes.STRING, allowNull: true },
  thumbnail:   { type: DataTypes.STRING, allowNull: true },
  channelId:   { type: DataTypes.STRING, allowNull: true },
  messageId:   { type: DataTypes.STRING, allowNull: true },
  categories:  { type: DataTypes.JSONB, defaultValue: [] },
  active:      { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'ticket_panels', timestamps: true,
  indexes: [{ fields: ['guildId'] }, { fields: ['guildId', 'panelId'] }],
});

// ── 12. Economy ────────────────────────────────────────────────
const Economy = sequelize.define('Economy', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:      { type: DataTypes.STRING, allowNull: false },
  guildId:     { type: DataTypes.STRING, allowNull: false },
  balance:     { type: DataTypes.BIGINT, defaultValue: 0 },
  bank:        { type: DataTypes.BIGINT, defaultValue: 0 },
  totalEarned: { type: DataTypes.BIGINT, defaultValue: 0 },
  reputation:  { type: DataTypes.BIGINT, defaultValue: 0 },
  lastRepAt:   { type: DataTypes.DATE, allowNull: true },
  dailyStreak: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'economy', timestamps: true,
  indexes: [{ fields: ['userId', 'guildId'] }],
});

// ── 13. Shop ───────────────────────────────────────────────────
const ShopItem = sequelize.define('ShopItem', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:     { type: DataTypes.STRING, allowNull: false },
  name:        { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  price:       { type: DataTypes.INTEGER, allowNull: false },
  stock:       { type: DataTypes.INTEGER, defaultValue: -1 },
  roleId:      { type: DataTypes.STRING, allowNull: true },
  enabled:     { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'shop_items', timestamps: true,
  indexes: [{ fields: ['guildId'] }],
});

// ── 14. Inventory ──────────────────────────────────────────────
const Inventory = sequelize.define('Inventory', {
  id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:   { type: DataTypes.STRING, allowNull: false },
  guildId:  { type: DataTypes.STRING, allowNull: false },
  itemId:   { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
}, {
  tableName: 'inventories', timestamps: true,
  indexes: [{ unique: true, fields: ['userId', 'guildId', 'itemId'] }],
});

// ── 15. Giveaways ──────────────────────────────────────────────
const Giveaway = sequelize.define('Giveaway', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
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
}, {
  tableName: 'giveaways', timestamps: true,
  indexes: [{ fields: ['guildId', 'active'] }],
});

// ── 16. Giveaway entries ───────────────────────────────────────
const GiveawayEntry = sequelize.define('GiveawayEntry', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  giveawayId: { type: DataTypes.INTEGER, allowNull: false },
  userId:     { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'giveaway_entries', timestamps: true,
  indexes: [{ unique: true, fields: ['giveawayId', 'userId'] }],
});

// ── 17. Birthdays ──────────────────────────────────────────────
const Birthday = sequelize.define('Birthday', {
  id:      { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:  { type: DataTypes.STRING, allowNull: false },
  guildId: { type: DataTypes.STRING, allowNull: false },
  day:     { type: DataTypes.INTEGER, allowNull: false },
  month:   { type: DataTypes.INTEGER, allowNull: false },
  year:    { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'birthdays', timestamps: true,
  indexes: [{ unique: true, fields: ['userId', 'guildId'] }, { fields: ['day', 'month'] }],
});

// ── 18. Level Rewards ──────────────────────────────────────────
const LevelReward = sequelize.define('LevelReward', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:       { type: DataTypes.STRING, allowNull: false },
  level:         { type: DataTypes.INTEGER, allowNull: false },
  roleId:        { type: DataTypes.STRING, allowNull: false },
  removeOnNext:  { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'level_rewards', timestamps: true,
  indexes: [{ fields: ['guildId', 'level'] }],
});

// ── 19. Auto Responders ────────────────────────────────────────
const AutoResponder = sequelize.define('AutoResponder', {
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:         { type: DataTypes.STRING, allowNull: false },
  trigger:         { type: DataTypes.TEXT, allowNull: false },
  triggerType:     { type: DataTypes.ENUM('exact', 'contains', 'startsWith', 'regex'), defaultValue: 'exact' },
  response:        { type: DataTypes.TEXT, allowNull: false },
  enabled:         { type: DataTypes.BOOLEAN, defaultValue: true },
  cooldown:        { type: DataTypes.INTEGER, defaultValue: 0 },
  allowedChannels: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  requiredRoles:   { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  useAI:           { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'auto_responders', timestamps: true,
  indexes: [{ fields: ['guildId'] }, { fields: ['guildId', 'enabled'] }],
});

// ── 20. Custom Commands ────────────────────────────────────────
const CustomCommand = sequelize.define('CustomCommand', {
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:         { type: DataTypes.STRING, allowNull: false },
  name:            { type: DataTypes.STRING, allowNull: false },
  response:        { type: DataTypes.TEXT, allowNull: false },
  description:     { type: DataTypes.STRING, allowNull: true },
  enabled:         { type: DataTypes.BOOLEAN, defaultValue: true },
  cooldown:        { type: DataTypes.INTEGER, defaultValue: 0 },
  requiredRoles:   { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  allowedChannels: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  useAI:           { type: DataTypes.BOOLEAN, defaultValue: false },
  usageCount:      { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'custom_commands', timestamps: true,
  indexes: [{ unique: true, fields: ['guildId', 'name'] }],
});

// ── 21. Reaction Roles ─────────────────────────────────────────
const ReactionRole = sequelize.define('ReactionRole', {
  id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:   { type: DataTypes.STRING, allowNull: false },
  channelId: { type: DataTypes.STRING, allowNull: false },
  messageId: { type: DataTypes.STRING, allowNull: false },
  emoji:     { type: DataTypes.STRING, allowNull: false },
  roleId:    { type: DataTypes.STRING, allowNull: false },
  type:      { type: DataTypes.ENUM('toggle', 'add_only', 'remove_only', 'unique'), defaultValue: 'toggle' },
}, {
  tableName: 'reaction_roles', timestamps: true,
  indexes: [{ fields: ['guildId', 'messageId'] }],
});

// ── 22. Starboard ──────────────────────────────────────────────
const StarboardEntry = sequelize.define('StarboardEntry', {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:        { type: DataTypes.STRING, allowNull: false },
  messageId:      { type: DataTypes.STRING, allowNull: false },
  channelId:      { type: DataTypes.STRING, allowNull: false },
  authorId:       { type: DataTypes.STRING, allowNull: false },
  starboardMsgId: { type: DataTypes.STRING, allowNull: true },
  starCount:      { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'starboard_entries', timestamps: true,
  indexes: [{ unique: true, fields: ['guildId', 'messageId'] }],
});

// ── 23. Invite Tracking ────────────────────────────────────────
const InviteTrack = sequelize.define('InviteTrack', {
  id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:   { type: DataTypes.STRING, allowNull: false },
  inviterId: { type: DataTypes.STRING, allowNull: false },
  invitedId: { type: DataTypes.STRING, allowNull: false },
  code:      { type: DataTypes.STRING, allowNull: true },
  fake:      { type: DataTypes.BOOLEAN, defaultValue: false },
  left:      { type: DataTypes.BOOLEAN, defaultValue: false },
  bonus:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'invite_tracks', timestamps: true,
  indexes: [{ fields: ['guildId', 'inviterId'] }, { fields: ['guildId', 'invitedId'] }],
});

// ── 24. Automations ────────────────────────────────────────────
const Automation = sequelize.define('Automation', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:    { type: DataTypes.STRING, allowNull: false },
  name:       { type: DataTypes.STRING, allowNull: false },
  trigger:    { type: DataTypes.STRING, allowNull: false },
  actions:    { type: DataTypes.JSONB, defaultValue: [] },
  conditions: { type: DataTypes.JSONB, defaultValue: [] },
  enabled:    { type: DataTypes.BOOLEAN, defaultValue: true },
  runCount:   { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'automations', timestamps: true,
  indexes: [{ fields: ['guildId'] }],
});

// ── 25. Timed Messages ─────────────────────────────────────────
const TimedMessage = sequelize.define('TimedMessage', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:    { type: DataTypes.STRING, allowNull: false },
  channelId:  { type: DataTypes.STRING, allowNull: false },
  content:    { type: DataTypes.TEXT, allowNull: false },
  interval:   { type: DataTypes.INTEGER, allowNull: false },
  enabled:    { type: DataTypes.BOOLEAN, defaultValue: true },
  lastSentAt: { type: DataTypes.DATE, allowNull: true },
  nextSendAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'timed_messages', timestamps: true,
  indexes: [{ fields: ['guildId'] }, { fields: ['enabled', 'nextSendAt'] }],
});

// ── 26. Suggestions ────────────────────────────────────────────
const Suggestion = sequelize.define('Suggestion', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:       { type: DataTypes.STRING, allowNull: false },
  userId:        { type: DataTypes.STRING, allowNull: false },
  content:       { type: DataTypes.TEXT, allowNull: false },
  status:        { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'implemented'), defaultValue: 'pending' },
  upvotes:       { type: DataTypes.INTEGER, defaultValue: 0 },
  downvotes:     { type: DataTypes.INTEGER, defaultValue: 0 },
  moderatorId:   { type: DataTypes.STRING, allowNull: true },
  moderatorNote: { type: DataTypes.TEXT, allowNull: true },
  messageId:     { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'suggestions', timestamps: true,
  indexes: [{ fields: ['guildId', 'status'] }],
});

// ── 27. Temporary Channels ─────────────────────────────────────
const TempChannel = sequelize.define('TempChannel', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:       { type: DataTypes.STRING, allowNull: false },
  channelId:     { type: DataTypes.STRING, allowNull: false },
  ownerId:       { type: DataTypes.STRING, allowNull: false },
  textChannelId: { type: DataTypes.STRING, allowNull: true },
  expiresAt:     { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'temp_channels', timestamps: true,
  indexes: [{ fields: ['guildId', 'channelId'] }, { fields: ['expiresAt'] }],
});

// ── 28. Staff Duty ─────────────────────────────────────────────
const StaffDuty = sequelize.define('StaffDuty', {
  id:                { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:           { type: DataTypes.STRING, allowNull: false },
  userId:            { type: DataTypes.STRING, allowNull: false },
  isOnDuty:          { type: DataTypes.BOOLEAN, defaultValue: false },
  lastDutyStart:     { type: DataTypes.DATE, allowNull: true },
  totalDutyTime:     { type: DataTypes.INTEGER, defaultValue: 0 },
  messagesSent:      { type: DataTypes.INTEGER, defaultValue: 0 },
  voiceTime:         { type: DataTypes.INTEGER, defaultValue: 0 },
  ticketsHandled:    { type: DataTypes.INTEGER, defaultValue: 0 },
  vacationStatus:    { type: DataTypes.BOOLEAN, defaultValue: false },
  resigned:          { type: DataTypes.BOOLEAN, defaultValue: false },
  promotionHistory:  { type: DataTypes.JSONB, defaultValue: [] },
}, {
  tableName: 'staff_duty', timestamps: true,
  indexes: [{ fields: ['guildId', 'userId'] }],
});

// ── 29. Staff Fingerprints (no timestamps on this table) ───────
const StaffFingerprint = sequelize.define('StaffFingerprint', {
  id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:   { type: DataTypes.STRING, allowNull: false },
  userId:    { type: DataTypes.STRING, allowNull: false },
  type:      { type: DataTypes.ENUM('on', 'off'), allowNull: false },
  timestamp: { type: DataTypes.DATE, allowNull: true },
  duration:  { type: DataTypes.INTEGER, allowNull: true },
  tickets:   { type: DataTypes.INTEGER, defaultValue: 0 },
  messages:  { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'staff_fingerprints', timestamps: false,
  indexes: [{ fields: ['guildId', 'userId'] }],
});

// ── 30. Achievements ───────────────────────────────────────────
const Achievement = sequelize.define('Achievement', {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guildId:      { type: DataTypes.STRING, allowNull: false },
  name:         { type: DataTypes.STRING, allowNull: false },
  description:  { type: DataTypes.TEXT, allowNull: true },
  emoji:        { type: DataTypes.STRING, defaultValue: '🏆' },
  criteria:     { type: DataTypes.JSONB, defaultValue: {} },
  roleRewardId: { type: DataTypes.STRING, allowNull: true },
  xpReward:     { type: DataTypes.INTEGER, defaultValue: 0 },
  coinsReward:  { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'achievements', timestamps: true,
  indexes: [{ fields: ['guildId'] }],
});

// ── 31. User Achievements (no timestamps on this table) ────────
const UserAchievement = sequelize.define('UserAchievement', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:        { type: DataTypes.STRING, allowNull: false },
  guildId:       { type: DataTypes.STRING, allowNull: false },
  achievementId: { type: DataTypes.INTEGER, allowNull: false },
  unlockedAt:    { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'user_achievements', timestamps: false,
  indexes: [{ unique: true, fields: ['userId', 'guildId', 'achievementId'] }],
});

// ── 32. Reminders ──────────────────────────────────────────────
const Reminder = sequelize.define('Reminder', {
  id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:    { type: DataTypes.STRING, allowNull: false },
  guildId:   { type: DataTypes.STRING, allowNull: false },
  channelId: { type: DataTypes.STRING, allowNull: false },
  content:   { type: DataTypes.TEXT, allowNull: false },
  remindAt:  { type: DataTypes.DATE, allowNull: false },
  sent:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'reminders', timestamps: true,
  indexes: [{ fields: ['sent', 'remindAt'] }],
});

const models = {
  GuildSettings, UserProfile, ModerationCase, CommandSettings,
  ApplicationForm, StaffApplication,
  Warning, GuildCounter, Ticket, TicketCSAT, TicketPanel,
  Economy, ShopItem, Inventory, Giveaway, GiveawayEntry,
  Birthday, LevelReward, AutoResponder, CustomCommand, ReactionRole,
  StarboardEntry, InviteTrack, Automation, TimedMessage, Suggestion,
  TempChannel, StaffDuty, StaffFingerprint, Achievement, UserAchievement, Reminder,
};

Object.entries(models).forEach(([name, model]) => {
  sequelize.models[name] = model;
});

export {
  sequelize,
  GuildSettings, UserProfile, ModerationCase, CommandSettings,
  ApplicationForm, StaffApplication,
  Warning, GuildCounter, Ticket, TicketCSAT, TicketPanel,
  Economy, ShopItem, Inventory, Giveaway, GiveawayEntry,
  Birthday, LevelReward, AutoResponder, CustomCommand, ReactionRole,
  StarboardEntry, InviteTrack, Automation, TimedMessage, Suggestion,
  TempChannel, StaffDuty, StaffFingerprint, Achievement, UserAchievement, Reminder,
};
export default sequelize;
