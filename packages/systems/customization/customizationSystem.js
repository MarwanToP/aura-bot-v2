import logger from '../../utils/logger.js';

// Reason codes returned by `isCommandRestricted`. They describe WHAT was
// restricted so the caller can show a precise, branded message instead of a
// generic "restricted" error.
export const RESTRICTION_COMMAND_BLACKLIST = 'command-blacklist';
export const RESTRICTION_DISABLED_CHANNEL = 'disabled-channel';

/**
 * Customization System — Handles per-guild Command and Channel Restrictions.
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
   *
   * Reads the cached guild settings first and falls back to the database.
   * A guild without a settings row is never restricted.
   *
   * @param {Client} client
   * @param {string} guildId
   * @param {string} channelId
   * @param {string} commandName
   * @returns {Promise<{ restricted: boolean, reason: string|null }>}
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

      if (!settings) return { restricted: false, reason: null };

      const normalizedCommand = this.sanitizeCommandName(commandName);
      const normalizedChannel = String(channelId || '').trim();

      const blacklistedCommands = Array.isArray(settings.commandBlacklist)
        ? settings.commandBlacklist.map((entry) => this.sanitizeCommandName(entry)).filter(Boolean)
        : [];

      const disabledChannels = Array.isArray(settings.disabledChannels)
        ? settings.disabledChannels.map((entry) => String(entry || '').trim()).filter(Boolean)
        : [];

      // 1. Check Global Command Blacklist
      if (normalizedCommand && blacklistedCommands.includes(normalizedCommand)) {
        return { restricted: true, reason: RESTRICTION_COMMAND_BLACKLIST };
      }

      // 2. Check Channel Restrictions
      if (normalizedChannel && disabledChannels.includes(normalizedChannel)) {
        return { restricted: true, reason: RESTRICTION_DISABLED_CHANNEL };
      }

      return { restricted: false, reason: null };
    } catch (err) {
      // Fail open: an unreachable cache/database must never block a command.
      logger.error('[Customization] Restriction check failed:', err.message);
      return { restricted: false, reason: null };
    }
  }

  /**
   * Branded, user-facing text for a restriction reason.
   *
   * @param {string|null} reason  One of the RESTRICTION_* codes.
   * @returns {string}
   */
  describeRestriction(reason) {
    if (reason === RESTRICTION_COMMAND_BLACKLIST) {
      return '❌ This command has been disabled for this server by the administrators.';
    }
    if (reason === RESTRICTION_DISABLED_CHANNEL) {
      return '❌ Commands are disabled in this channel by the administrators.';
    }
    return '❌ This command is restricted in this channel or has been disabled globally by administrators.';
  }
}

export default new CustomizationSystem();
