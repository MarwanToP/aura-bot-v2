import customization from '../../shared/systems/customization/customizationSystem.js';
import logger        from '../../shared/utils/logger.js';
import { trackActivity } from '../../shared/systems/staff/staffSystem.js';

export const mentionCache = new Map();

export default {
  name: 'messageCreate',
  async execute(client, message) {
    if (message.author.bot) return;
    if (!message.guild) return handleDM(client, message);

    // Track Staff Activity (Messages)
    await trackActivity(client, message.guildId, message.author.id, 'message');

    // ─── Neural Custom Handlers ──────────────────────────────
    await handlePrefixCommands(client, message);

    // Run parallel tasks
    await Promise.allSettled([
      awardMessageXp(client, message),
      handleAutoMod(client, message),
      handleAIChatChannel(client, message),
      handleAutoResponder(client, message),
    ]);
  },
};

/**
 * Prefix Command Handler — Supports Dynamic Aliases and Restrictions.
 */
async function handlePrefixCommands(client, message) {
  try {
    const { GuildSettings } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId: message.guildId } });
    const prefix = settings?.prefix || '!';

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    let commandName = args.shift().toLowerCase();

    // 1. Resolve Neural Aliases (e.g. p -> profile)
    commandName = await customization.resolveAlias(client, message.guildId, commandName);

    // 2. Enforce Neural Blacklists & Restrictions
    const isRestricted = await customization.isCommandRestricted(client, message.guildId, message.channel.id, commandName);
    if (isRestricted) return;

    const command = client.commands.get(commandName);
    if (!command) return;

    const lang = settings.language || 'en';
    await command.execute(client, message, lang, args);
  } catch (err) {
    logger.error(`[PrefixCmd] Handling failed:`, err.message);
  }
}

// ─── AI Auto-Mod ──────────────────────────────────────────────
async function handleAutoMod(client, message) {
  try {
    if (!client.ai.isAvailable()) return;

    const { GuildSettings } = client.db.models;
    const cacheKey  = `settings:aimod:${message.guild.id}`;
    let aiModEnabled = await client.redis.get(cacheKey);

    if (aiModEnabled === null) {
      const settings = await GuildSettings.findOne({ where: { guildId: message.guild.id } });
      aiModEnabled   = settings?.aiModEnabled ? '1' : '0';
      await client.redis.setex(cacheKey, 300, aiModEnabled);
    }

    if (aiModEnabled !== '1') return;
    if (message.member?.permissions.has('ModerateMembers')) return; // skip staff

    const content = message.content?.trim();
    if (!content || content.length < 5) return;

    const result = await client.ai.moderateContent(content);

    if (result.violation && result.confidence >= 70) {
      // Delete if high severity
      if (['high', 'critical'].includes(result.severity) && message.deletable) {
        await message.delete().catch(() => {});
      }

      // Warn the user
      await message.channel.send({
        content: `<@${message.author.id}>`,
        embeds: [{
          color: result.severity === 'critical' ? 0xFF4444 : 0xFFBB33,
          description: `⚠️ Your message was flagged by AI moderation.\n**Category:** ${result.category}\n**Severity:** ${result.severity}\n\nPlease review the server rules.`,
        }],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 10000));

      // Log to mod channel
      const settings = await GuildSettings.findOne({ where: { guildId: message.guild.id } });
      if (settings?.modLogChannelId) {
        const logChannel = await client.channels.fetch(settings.modLogChannelId).catch(() => null);
        if (logChannel) {
          await logChannel.send({ embeds: [{
            color: 0xFF4444,
            title: '🤖 AI AutoMod Alert',
            fields: [
              { name: '👤 User',      value: `<@${message.author.id}> (${message.author.tag})`, inline: true },
              { name: '📢 Channel',   value: `<#${message.channel.id}>`,                        inline: true },
              { name: '⚡ Severity',  value: result.severity,                                   inline: true },
              { name: '📂 Category',  value: result.category || 'unknown',                      inline: true },
              { name: '🎯 Confidence',value: `${result.confidence}%`,                           inline: true },
              { name: '📝 Content',   value: content.slice(0, 500),                             inline: false },
            ],
            timestamp: new Date().toISOString(),
          }] });
        }
      }
    }
  } catch (err) {
    logger.debug('[AI AutoMod]', err.message);
  }
}

// ─── AI Chat Channel ──────────────────────────────────────────
async function handleAIChatChannel(client, message) {
  let inAiChannel = false;
  let isMentioned = false;

  try {
    if (!client.ai.isAvailable()) return;

    const { GuildSettings } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId: message.guild.id } });

    // Only respond in designated AI chat channel OR when mentioned
    inAiChannel = settings?.aiChatChannelId === message.channel.id;
    isMentioned = message.mentions.has(client.user.id);

    if (!inAiChannel && !isMentioned) return;
    if (!settings?.aiChatEnabled) return;

    const content = message.content.replace(/<@!?\d+>/g, '').trim();
    if (!content) return;

    const lang     = settings.language || 'en';
    const history  = await client.ai.getContext(client.redis, message.author.id, message.guild.id);
    const langNote = lang === 'ar' ? '\n\nPlease respond in Arabic.' : '';

    const messages = [...history, { role: 'user', content: content + langNote }];

    await message.channel.sendTyping();

    const result = await client.ai.chat({ messages });
    const newHistory = [...messages, { role: 'assistant', content: result.content }];
    await client.ai.saveContext(client.redis, message.author.id, message.guild.id, newHistory);

    await message.reply({
      content: result.content.slice(0, 2000),
      allowedMentions: { repliedUser: true },
    });

  } catch (err) {
    logger.error('[AI Chat Channel] Error:', err);
    if (inAiChannel || isMentioned) {
      await message.react('❌').catch(() => {});
    }
  }
}

// ─── Auto Responder ───────────────────────────────────────────
async function handleAutoResponder(client, message) {
  try {
    const cacheKey  = `autoresponder:${message.guild.id}`;
    let responders  = await client.redis.getJSON(cacheKey);

    if (!responders) {
      const { AutoResponder } = client.db.models;
      const records = await AutoResponder.findAll({ where: { guildId: message.guild.id, enabled: true } });
      responders = records.map(r => r.toJSON());
      await client.redis.setJSON(cacheKey, responders, 120);
    }

    for (const r of responders) {
      if (r.allowedChannels?.length && !r.allowedChannels.includes(message.channel.id)) continue;
      if (r.requiredRoles?.length && !r.requiredRoles.some(rId => message.member.roles.cache.has(rId))) continue;

      let matched = false;
      const c = message.content.toLowerCase(), t = r.trigger.toLowerCase();
      switch (r.triggerType) {
        case 'exact':      matched = c === t; break;
        case 'contains':   matched = c.includes(t); break;
        case 'startsWith': matched = c.startsWith(t); break;
        case 'regex': try { matched = new RegExp(r.trigger, 'i').test(message.content); } catch (err) { logger.warn(`[AutoResponder] Invalid regex in guild ${message.guild.id}: "${r.trigger}"`, err.message); } break;
      }

      if (!matched) continue;

      if (r.cooldown > 0) {
        const coolKey = `ar:cool:${message.guild.id}:${r.id}:${message.channel.id}`;
        if (await client.redis.get(coolKey)) continue;
        await client.redis.setex(coolKey, r.cooldown, '1');
      }

      let response = r.response;
      if (r.useAI && client.ai.isAvailable()) {
        try {
          const res = await client.ai.generateCommandResponse(message.content, `Trigger: ${r.trigger}`);
          response  = res.content;
        } catch {}
      }

      await message.channel.send(response);
      break;
    }
  } catch {}
}

// ─── DM Handler ───────────────────────────────────────────────
async function handleDM(client, message) {
  if (!client.ai.isAvailable()) return;

  try {
    const history  = await client.ai.getContext(client.redis, message.author.id, 'dm');
    const messages = [...history, { role: 'user', content: message.content }];

    await message.channel.sendTyping();
    const result = await client.ai.chat({ messages });

    const newHistory = [...messages, { role: 'assistant', content: result.content }];
    await client.ai.saveContext(client.redis, message.author.id, 'dm', newHistory);

    await message.reply(result.content.slice(0, 2000));
  } catch {}
}
