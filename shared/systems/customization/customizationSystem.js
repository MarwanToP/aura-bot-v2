import logger from '../../utils/logger.js';

/**
 * Customization System — Handles Command Aliases and Channel Restrictions.
 */
class CustomizationSystem {
  sanitizeCommandName(value) {
    return String(value || '').trim().toLowerCase().replace(/^\/+/, '');
  }

  buildRedisKey(prefix, guildId) {
    const safeGuildId = encodeURIComponent(String(guildId || '').trim());
    return `${prefix}:${safeGuildId}`;
  }

  /**
   * Check if a command is restricted in a specific channel.
   * @param {Client} client 
   * @param {string} guildId 
   * @param {string} channelId 
   * @param {string} commandName 
   */
  async isCommandRestricted(client, guildId, channelId, commandName) {
    try {
      const cacheKey = this.buildRedisKey('settings:restrictions', guildId);
      let settings = await client.redis.getJSON(cacheKey);

      if (!settings) {
        settings = await client.db.models.GuildSettings.findOne({
          where: { guildId },
          attributes: ['commandBlacklist', 'disabledChannels']
        });
        if (settings) await client.redis.setJSON(cacheKey, settings, 300);
      }

      if (!settings) return false;

      const normalizedCommand = this.sanitizeCommandName(commandName);
      const normalizedChannel = String(channelId || '').trim();

      const blacklistedCommands = Array.isArray(settings.commandBlacklist)
        ? settings.commandBlacklist.map((entry) => this.sanitizeCommandName(entry)).filter(Boolean)
        : [];

      const disabledChannels = Array.isArray(settings.disabledChannels)
        ? settings.disabledChannels.map((entry) => String(entry || '').trim()).filter(Boolean)
        : [];

      // 1. Check Global Command Blacklist
      if (normalizedCommand && blacklistedCommands.includes(normalizedCommand)) return true;

      // 2. Check Channel Restrictions
      if (normalizedChannel && disabledChannels.includes(normalizedChannel)) return true;

      return false;
    } catch (err) {
      logger.error('[Customization] Restriction check failed:', err.message);
      return false;
    }
  }

  /**
   * Resolve an alias to its target command name.
   * @param {Client} client 
   * @param {string} guildId 
   * @param {string} alias 
   */
  async resolveAlias(client, guildId, alias) {
    try {
      const cacheKey = this.buildRedisKey('settings:aliases', guildId);
      let aliases = await client.redis.getJSON(cacheKey);

      if (!aliases) {
        const settings = await client.db.models.GuildSettings.findOne({
          where: { guildId },
          attributes: ['commandAliases']
        });
        aliases = settings?.commandAliases || {};
        await client.redis.setJSON(cacheKey, aliases, 300);
      }

      const normalizedAlias = this.sanitizeCommandName(alias);
      if (!normalizedAlias) return alias;
      return aliases[normalizedAlias] || normalizedAlias;
    } catch (err) {
      logger.error('[Customization] Alias resolution failed:', err.message);
      return alias;
    }
  }
}

export default new CustomizationSystem();
