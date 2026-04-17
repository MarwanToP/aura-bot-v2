// ================================================================
//  Events: guildMemberAdd/Remove/Update, voice, bans, reactions
// ================================================================
import logger from '../utils/logger.js';

// ── guildMemberAdd ────────────────────────────────────────────
export const guildMemberAdd = {
  name: 'guildMemberAdd',
  async execute(client, member) {
    await Promise.allSettled([
      importAndRun('../systems/welcome/welcomeSystem.js',       'handleMemberJoin',   client, member),
      importAndRun('../systems/logging/loggingSystem.js',       'logMemberJoin',      client, member),
      importAndRun('../systems/antinuke/antiRaid.js',           'trackJoin',          client, member),
      importAndRun('../systems/logging/inviteTracker.js',       'trackInvite',        client, member),
    ]);
  },
};

// ── guildMemberRemove ─────────────────────────────────────────
export const guildMemberRemove = {
  name: 'guildMemberRemove',
  async execute(client, member) {
    await Promise.allSettled([
      importAndRun('../systems/welcome/welcomeSystem.js',       'handleMemberLeave',  client, member),
      importAndRun('../systems/logging/loggingSystem.js',       'logMemberLeave',     client, member),
      importAndRun('../systems/antinuke/antiNuke.js',           'onGuildMemberRemove',client, member),
      importAndRun('../systems/logging/inviteTracker.js',       'markLeft',           client, member),
    ]);
  },
};

// ── guildMemberUpdate ─────────────────────────────────────────
export const guildMemberUpdate = {
  name: 'guildMemberUpdate',
  async execute(client, oldMember, newMember) {
    await importAndRun('../systems/logging/loggingSystem.js', 'logMemberUpdate', client, oldMember, newMember);
  },
};

// ── messageDelete ─────────────────────────────────────────────
export const messageDelete = {
  name: 'messageDelete',
  async execute(client, message) {
    // Ghost ping detection
    const { mentionCache } = await import('./messageCreate.js').catch(() => ({ mentionCache: new Map() }));
    const cached = mentionCache?.get?.(message.id);
    if (cached) {
      await importAndRun('../systems/logging/loggingSystem.js', 'logGhostPing', client, { ...message, author: cached.author, content: cached.content, channel: { id: cached.channelId } }, cached.mentions);
      mentionCache.delete(message.id);
    }
    await importAndRun('../systems/logging/loggingSystem.js', 'logMessageDelete', client, message);
  },
};

// ── messageUpdate ─────────────────────────────────────────────
export const messageUpdate = {
  name: 'messageUpdate',
  async execute(client, oldMsg, newMsg) {
    if (!newMsg.guild || newMsg.author?.bot) return;
    await importAndRun('../systems/logging/loggingSystem.js', 'logMessageEdit', client, oldMsg, newMsg);
  },
};

// ── voiceStateUpdate ──────────────────────────────────────────
export const voiceStateUpdate = {
  name: 'voiceStateUpdate',
  async execute(client, oldState, newState) {
    await Promise.allSettled([
      importAndRun('../systems/logging/loggingSystem.js', 'logVoiceUpdate', client, oldState, newState),
      importAndRun('../systems/voice/voiceSystem.js', 'handleVoiceUpdate', client, oldState, newState),
    ]);
  },
};

// ── channelCreate / channelDelete ─────────────────────────────
export const channelCreate = {
  name: 'channelCreate',
  async execute(client, channel) {
    await importAndRun('../systems/logging/loggingSystem.js', 'logChannelCreate', client, channel);
  },
};
export const channelDelete = {
  name: 'channelDelete',
  async execute(client, channel) {
    await Promise.allSettled([
      importAndRun('../systems/logging/loggingSystem.js', 'logChannelDelete',   client, channel),
      importAndRun('../systems/antinuke/antiNuke.js',     'onChannelDelete',    client, channel),
    ]);
  },
};

// ── roleCreate / roleDelete ───────────────────────────────────
export const roleCreate = {
  name: 'roleCreate',
  async execute(client, role) {
    await importAndRun('../systems/logging/loggingSystem.js', 'logRoleCreate', client, role);
  },
};
export const roleDelete = {
  name: 'roleDelete',
  async execute(client, role) {
    await Promise.allSettled([
      importAndRun('../systems/logging/loggingSystem.js', 'logRoleDelete', client, role),
      importAndRun('../systems/antinuke/antiNuke.js',     'onRoleDelete',  client, role),
    ]);
  },
};

// ── guildBanAdd / Remove ──────────────────────────────────────
export const guildBanAdd = {
  name: 'guildBanAdd',
  async execute(client, ban) {
    await Promise.allSettled([
      importAndRun('../systems/logging/loggingSystem.js', 'logBanAdd',    client, ban),
      importAndRun('../systems/antinuke/antiNuke.js',     'onGuildBanAdd',client, ban),
    ]);
  },
};
export const guildBanRemove = {
  name: 'guildBanRemove',
  async execute(client, ban) {
    await importAndRun('../systems/logging/loggingSystem.js', 'logBanRemove', client, ban);
  },
};

// ── messageReactionAdd ────────────────────────────────────────
export const messageReactionAdd = {
  name: 'messageReactionAdd',
  async execute(client, reaction, user) {
    if (user.bot) return;
    await Promise.allSettled([
      handleStarboard(client, reaction, user),
      handleReactionRole(client, reaction, user, true),
    ]);
  },
};
export const messageReactionRemove = {
  name: 'messageReactionRemove',
  async execute(client, reaction, user) {
    if (user.bot) return;
    await handleReactionRole(client, reaction, user, false);
  },
};

// ── guildCreate ───────────────────────────────────────────────
export const guildCreate = {
  name: 'guildCreate',
  async execute(client, guild) {
    logger.info(`[Guild] Joined: ${guild.name} (${guild.memberCount} members)`);
    try {
      const { GuildSettings } = client.db.models;
      await GuildSettings.findOrCreate({ where: { guildId: guild.id }, defaults: {} });
    } catch {}
  },
};

// ─── Helpers ─────────────────────────────────────────────────
async function importAndRun(path, fn, ...args) {
  try {
    const mod = await import(path);
    if (mod[fn]) await mod[fn](...args);
  } catch (err) {
    logger.debug(`[Event] ${path}::${fn}: ${err.message}`);
  }
}

async function handleStarboard(client, reaction, user) {
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const { GuildSettings, StarboardEntry } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId: reaction.message.guild.id } });
    if (!settings?.starboardEnabled || !settings?.starboardChannelId) return;
    if (reaction.emoji.toString() !== settings.starboardEmoji) return;
    if (reaction.message.author.id === user.id) return;

    const starChannel = await client.channels.fetch(settings.starboardChannelId).catch(() => null);
    if (!starChannel?.isTextBased()) return;

    const [entry] = await StarboardEntry.findOrCreate({
      where: { guildId: reaction.message.guild.id, messageId: reaction.message.id },
      defaults: { channelId: reaction.message.channel.id, authorId: reaction.message.author.id, starCount: 0 },
    });
    await entry.update({ starCount: reaction.count });

    const { buildEmbed } = await import('../utils/embedBuilder.js');
    const msg     = reaction.message;
    const embed   = buildEmbed({
      type: 'premium',
      author: msg.author.tag, authorIcon: msg.author.displayAvatarURL({ size: 64 }),
      description: msg.content?.slice(0, 1000) || '*[embed/attachment]*',
      image: msg.attachments.first()?.url || null,
      fields: [{ name: '📍 Source', value: `[Jump](${msg.url}) in <#${msg.channel.id}>`, inline: false }],
      footer: `${settings.starboardEmoji} ${reaction.count} stars`, timestamp: true,
    });

    if (reaction.count >= settings.starboardThreshold) {
      if (entry.starboardMsgId) {
        const old = await starChannel.messages.fetch(entry.starboardMsgId).catch(() => null);
        if (old) await old.edit({ embeds: [embed] });
        else {
          const nm = await starChannel.send({ content: `${settings.starboardEmoji} **${reaction.count}** | <#${msg.channel.id}>`, embeds: [embed] });
          await entry.update({ starboardMsgId: nm.id });
        }
      } else {
        const nm = await starChannel.send({ content: `${settings.starboardEmoji} **${reaction.count}** | <#${msg.channel.id}>`, embeds: [embed] });
        await entry.update({ starboardMsgId: nm.id });
      }
    }
  } catch {}
}

async function handleReactionRole(client, reaction, user, adding) {
  try {
    if (reaction.partial) await reaction.fetch();
    const { ReactionRole } = client.db.models;
    const rroles = await ReactionRole.findAll({ where: { messageId: reaction.message.id, emoji: reaction.emoji.toString() } });
    if (!rroles.length) return;

    const guild  = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    for (const rr of rroles) {
      const role = guild.roles.cache.get(rr.roleId);
      if (!role) continue;

      if (rr.type === 'unique' && adding) {
        // Remove all other roles from same message
        const others = await ReactionRole.findAll({ where: { messageId: reaction.message.id } });
        for (const o of others) {
          if (o.roleId !== rr.roleId && member.roles.cache.has(o.roleId)) {
            await member.roles.remove(o.roleId, '[Aura] Reaction Role').catch(() => {});
          }
        }
      }

      if (adding && rr.type !== 'remove_only')  await member.roles.add(role, '[Aura] Reaction Role').catch(() => {});
      if (!adding && rr.type !== 'add_only')     await member.roles.remove(role, '[Aura] Reaction Role').catch(() => {});
    }
  } catch {}
}

export default guildMemberAdd;
