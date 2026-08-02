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
        rejectUnauthorized: false,
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

const models = {
  GuildSettings, UserProfile, ModerationCase, CommandSettings,
};

Object.entries(models).forEach(([name, model]) => {
  sequelize.models[name] = model;
});

export { sequelize, GuildSettings, UserProfile, ModerationCase, CommandSettings };
export default sequelize;
