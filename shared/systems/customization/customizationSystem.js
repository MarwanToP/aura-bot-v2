import logger from '../../utils/logger.js';

/**
 * Customization System — Handles Command Aliases and Channel Restrictions.
 */
class CustomizationSystem {
  /**
   * Check if a command is restricted in a specific channel.
   * @param {Client} client 
   * @param {string} guildId 
   * @param {string} channelId 
   * @param {string} commandName 
   */
  async isCommandRestricted(client, guildId, channelId, commandName) {
    try {
      const cacheKey = `settings:restrictions:${guildId}`;
      let settings = await client.redis.getJSON(cacheKey);

      if (!settings) {
        settings = await client.db.models.GuildSettings.findOne({
          where: { guildId },
          attributes: ['commandBlacklist', 'disabledChannels']
        });
        if (settings) await client.redis.setJSON(cacheKey, settings, 300);
      }

      if (!settings) return false;

      // 1. Check Global Command Blacklist
      if (settings.commandBlacklist?.includes(commandName)) return true;

      // 2. Check Channel Restrictions
      if (settings.disabledChannels?.includes(channelId)) return true;

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
      const cacheKey = `settings:aliases:${guildId}`;
      let aliases = await client.redis.getJSON(cacheKey);

      if (!aliases) {
        const settings = await client.db.models.GuildSettings.findOne({
          where: { guildId },
          attributes: ['commandAliases']
        });
        aliases = settings?.commandAliases || {};
        await client.redis.setJSON(cacheKey, aliases, 300);
      }

      return aliases[alias] || alias;
    } catch (err) {
      logger.error('[Customization] Alias resolution failed:', err.message);
      return alias;
    }
  }
}

export default new CustomizationSystem();
