// ================================================================
//  Ticket System v2 — Skill-Based Routing, Claiming, Escalation & CSAT
// ================================================================
import { trackActivity } from '../staff/staffSystem.js';
import { buildEmbed } from '../../utils/embedBuilder.js';
import config         from '../../config/config.js';
import logger         from '../../utils/logger.js';
import discordTranscripts from 'discord-html-transcripts';
import { 
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ChannelType, PermissionFlagsBits 
} from 'discord.js';

/**
 * Initializes a persistent ticket panel from a database configuration
 */
export async function initializeTicketPanel(client, panelId, guildId = null) {
  const { TicketPanel } = client.db.models;
  const where = guildId ? { guildId, panelId } : { panelId };
  const panel = await TicketPanel.findOne({ where });
  if (!panel) return;

  const channel = await client.channels.fetch(panel.channelId).catch(() => null);
  if (!channel) return;

  const embed = buildEmbed({
    type: 'primary',
    title: panel.title || '🎫 Aura Support Portal',
    description: panel.description || 'Access our specialized support departments below.',
    footer: 'Aura Intelligence // Secure Channel'
  });

  const row = new ActionRowBuilder();
  panel.categories.slice(0, 5).forEach((cat) => {
    const categoryKey = String(cat?.name || cat?.id || '').trim();
    if (!categoryKey) return;
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket:open:${categoryKey}`)
        .setLabel(cat.label || categoryKey)
        .setEmoji(cat.emoji || '🎫')
        .setStyle(ButtonStyle.Primary)
    );
  });

  try {
    if (panel.messageId) {
      const msg = await channel.messages.fetch(panel.messageId).catch(() => null);
      if (msg) return await msg.edit({ embeds: [embed], components: [row] });
    }
    const newMsg = await channel.send({ embeds: [embed], components: [row] });
    await panel.update({ messageId: newMsg.id });
  } catch (err) {
    console.error(`[TicketSystem] Failed to post panel ${panelId}:`, err);
  }
}

/**
 * Match ticket skill tags against staff roles and members in a guild
 */
export function matchStaffBySkills(guild, skillTags = []) {
  if (!guild || !skillTags || !skillTags.length) return { matchingRoles: [], onlineStaff: [], allStaff: [] };

  const tags = skillTags.map(t => String(t).toLowerCase().trim()).filter(Boolean);
  if (!tags.length) return { matchingRoles: [], onlineStaff: [], allStaff: [] };

  const skillAliases = {
    'tech': ['tech', 'technical', 'support', 'developer', 'it'],
    'technical': ['tech', 'technical', 'support', 'developer', 'it'],
    'billing': ['billing', 'finance', 'payment', 'sales'],
    'security': ['security', 'mod', 'moderator', 'admin', 'safety'],
    'management': ['management', 'manager', 'lead', 'high management', 'admin'],
  };

  const expandedTags = new Set(tags);
  for (const tag of tags) {
    if (skillAliases[tag]) {
      skillAliases[tag].forEach(t => expandedTags.add(t));
    }
  }

  const matchingRoles = guild.roles.cache.filter(role => {
    const roleName = role.name.toLowerCase();
    return Array.from(expandedTags).some(t => roleName.includes(t));
  });

  const allStaff = [];
  const onlineStaff = [];

  guild.members.cache.forEach(member => {
    if (member.user.bot) return;
    const hasMatchingRole = member.roles.cache.some(r => matchingRoles.has(r.id));
    if (hasMatchingRole) {
      allStaff.push(member);
      const status = member.presence?.status || 'online';
      if (['online', 'idle', 'dnd'].includes(status)) {
        onlineStaff.push(member);
      }
    }
  });

  return {
    matchingRoles: Array.from(matchingRoles.values()),
    onlineStaff,
    allStaff
  };
}

/**
 * Routes ticket channel to staff members possessing matching skill tags
 */
export async function routeTicketBySkill(client, guild, channel, skillTags = []) {
  try {
    const { matchingRoles, onlineStaff } = matchStaffBySkills(guild, skillTags);

    if (channel && matchingRoles.length > 0) {
      for (const role of matchingRoles) {
        await channel.permissionOverwrites.edit(role.id, {
          ViewChannel: true,
          SendMessages: true,
          AttachFiles: true,
          ReadMessageHistory: true,
        }).catch(() => {});
      }
    }

    if (channel && (matchingRoles.length > 0 || onlineStaff.length > 0)) {
      const mentions = [
        ...matchingRoles.map(r => `<@&${r.id}>`),
        ...onlineStaff.map(m => `<@${m.id}>`)
      ].slice(0, 5).join(' ');

      await channel.send({
        content: mentions ? `🔔 **Skill-based Triage**: ${mentions}` : undefined,
        embeds: [
          buildEmbed({
            type: 'info',
            title: '🎯 Skill-Based Ticket Routing',
            description: `Ticket assigned based on skill tags: \`${skillTags.join(', ')}\`.\n` +
              `**Matching Staff Roles:** ${matchingRoles.length ? matchingRoles.map(r => r.name).join(', ') : 'Default Support'}\n` +
              `**Available Online Staff:** ${onlineStaff.length ? onlineStaff.map(m => `<@${m.id}>`).join(', ') : 'Notified staff role(s)'}`,
            footer: 'Aura Intelligent Ticket Router',
            timestamp: true
          })
        ]
      }).catch(() => {});
    }

    return {
      routedRoles: matchingRoles.map(r => r.id),
      notifiedStaff: onlineStaff.map(m => m.id)
    };
  } catch (err) {
    logger.error('[Tickets] routeTicketBySkill:', err);
    return { routedRoles: [], notifiedStaff: [] };
  }
}

/**
 * Create a new support ticket
 */
export async function createTicket(client, guild, user, { category = 'Other', subject = '', priority = 'Medium', tags = [], skillTags = [] } = {}) {
  try {
    const { GuildSettings, Ticket, GuildCounter } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId: guild.id } });
    if (!settings?.ticketEnabled)   return { error: 'Ticket system is not enabled.' };
    if (!settings?.ticketCategoryId) return { error: 'Ticket category not configured. Use /settings.' };

    const openCount = await Ticket.count({ where: { guildId: guild.id, userId: user.id, status: ['open', 'claimed'] } });
    if (openCount >= config.tickets.maxOpenPerUser) return { error: client.i18n.t('tickets.alreadyOpen', { count: openCount }) };

    const [counter] = await GuildCounter.findOrCreate({ where: { guildId: guild.id }, defaults: { ticketCount: 0 } });
    await counter.increment('ticketCount');
    const ticketId = `TKT-${String(counter.ticketCount).padStart(4, '0')}`;
    const chanName = `${ticketId.toLowerCase()}-${user.username.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,15)}`;

    // Normalize skill tags
    const rawTags = [...(Array.isArray(tags) ? tags : []), ...(Array.isArray(skillTags) ? skillTags : [])];
    const categorySkillMap = {
      'Technical': 'tech',
      'Billing': 'billing',
      'Security': 'security',
      'Member Complaint': 'security',
      'Admin Complaint': 'management',
      'Management': 'management'
    };
    if (categorySkillMap[category] && !rawTags.includes(categorySkillMap[category])) {
      rawTags.push(categorySkillMap[category]);
    }
    const finalSkillTags = Array.from(new Set(rawTags.map(t => String(t).toLowerCase().trim()).filter(Boolean)));

    const channel = await guild.channels.create({
      name:   chanName, type: ChannelType.GuildText, parent: settings.ticketCategoryId,
      permissionOverwrites: [
        { id: guild.roles.everyone,    deny:  [PermissionFlagsBits.ViewChannel] },
        { id: user.id,                 allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
        { id: guild.members.me.id,     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
        ...((settings.ticketSupportRoles||[]).map(r => ({ id: r, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }))),
      ],
    });

    const ticket = await Ticket.create({
      ticketId,
      guildId: guild.id,
      userId: user.id,
      channelId: channel.id,
      category,
      subject,
      priority,
      status: 'open',
      tier: 1,
      tags: finalSkillTags
    });

    const lang = await client.i18n.resolveLanguage(client, user.id, guild.id);
    const pEmoji = { Low: '🟢', Medium: '🟡', High: '🟠', Critical: '🔴' };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket:claim:${ticketId}`).setLabel('Claim').setStyle(ButtonStyle.Primary).setEmoji('🙋'),
      new ButtonBuilder().setCustomId(`ticket:escalate:${ticketId}`).setLabel('Escalate').setStyle(ButtonStyle.Secondary).setEmoji('⬆️'),
      new ButtonBuilder().setCustomId(`ticket:close:${ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
    );

    await channel.send({
      content: `<@${user.id}>`,
      embeds: [
        buildEmbed({
          type: 'primary',
          title: `${config.emojis.ticket} ${ticketId} — ${category}`,
          description: `Welcome, <@${user.id}>!\n\nPlease describe your issue in detail.${subject ? `\n\n**Subject:** ${subject}` : ''}`,
          fields: [
            { name: '📋 Category', value: category, inline: true },
            { name: '⚡ Priority', value: `${pEmoji[priority]} ${priority}`, inline: true },
            { name: '🏷️ Skill Tags', value: finalSkillTags.length ? finalSkillTags.map(t => `\`${t}\``).join(', ') : 'General', inline: true }
          ],
          footer: `${ticketId} • Tier 1 Support`,
          timestamp: true
        })
      ],
      components: [row]
    });

    // --- AUTO-REPLY SYSTEM ---
    const categoryAutoReplies = {
      'Technical': {
        en: 'Thank you for contacting Technical Support. Please provide your server version and any error logs you have.',
        ar: 'شكراً لتواصلك مع الدعم الفني. يرجى تزويدنا بإصدار السيرفر وأي سجلات أخطاء تظهر لديك.'
      },
      'Member Complaint': {
        en: 'Your complaint against a member has been received. Please include the Member ID and screenshots of the incident.',
        ar: 'لقد تم استلام شكواك ضد العضو. يرجى إدراج معرف العضو (ID) ولقطات شاشة للواقعة.'
      },
      'Admin Complaint': {
        en: 'This ticket is private and only visible to High Management. Please describe the incident with the moderator in detail.',
        ar: 'هذه التذكرة خاصة وتظهر للإدارة العليا فقط. يرجى توضيح الموقف مع الإداري بالتفصيل.'
      },
      'Management': {
        en: 'You are now in direct contact with High Management. Responses here may take longer than usual.',
        ar: 'أنت الآن في تواصل مباشر مع الإدارة العليا. قد تستغرق الردود هنا وقتاً أطول من المعتاد.'
      }
    };

    const replyData = categoryAutoReplies[category];
    if (replyData) {
      const autoReplyText = replyData[lang] || replyData['en'];
      await channel.send({
        embeds: [buildEmbed({
          type: 'info',
          title: '🤖 Aura Assistant',
          description: autoReplyText,
          footer: 'Automated Response based on category'
        })]
      });
    }

    if (settings.ticketLogChannelId) {
      const logCh = await client.channels.fetch(settings.ticketLogChannelId).catch(() => null);
      if (logCh?.isTextBased()) await logCh.send({ embeds: [buildEmbed({ type: 'info', title: `📨 New Ticket — ${ticketId}`, description: `**User:** <@${user.id}>\n**Category:** ${category}\n**Priority:** ${priority}\n**Skill Tags:** ${finalSkillTags.join(', ')}\n**Channel:** <#${channel.id}>`, timestamp: true })] });
    }

    // Skill-based ticket routing
    if (finalSkillTags.length > 0) {
      await routeTicketBySkill(client, guild, channel, finalSkillTags);
    }

    return { channel, ticketId, ticket };
  } catch (err) {
    logger.error('[Tickets] createTicket:', err);
    return { error: 'Failed to create ticket.' };
  }
}

/**
 * Claim a ticket by staff member
 */
export async function claimTicket(client, ticketId, guildId, staffUser) {
  try {
    const { Ticket } = client.db.models;
    const ticket = await Ticket.findOne({ where: { ticketId, guildId } });
    if (!ticket) return { error: 'Ticket not found.' };
    if (ticket.status === 'closed') return { error: 'Cannot claim a closed ticket.' };
    if (ticket.claimedBy && ticket.claimedBy !== staffUser.id) {
      return { error: `Ticket is already claimed by <@${ticket.claimedBy}>.` };
    }

    await ticket.update({
      claimedBy: staffUser.id,
      status: 'claimed',
      firstResponseAt: ticket.firstResponseAt || new Date()
    });

    await trackActivity(client, guildId, staffUser.id, 'ticket').catch(() => {});

    const channel = await client.channels.fetch(ticket.channelId).catch(() => null);
    if (channel) {
      await channel.send({
        embeds: [
          buildEmbed({
            type: 'success',
            title: '🙋 Ticket Claimed',
            description: `Ticket **${ticketId}** claimed by <@${staffUser.id}>.\nStaff member will assist you shortly!`,
            timestamp: true
          })
        ]
      }).catch(() => {});
    }

    return { success: true, ticket };
  } catch (err) {
    logger.error('[Tickets] claimTicket:', err);
    return { error: 'Failed to claim ticket.' };
  }
}

/**
 * Escalate ticket tier level (Tier 1 -> Tier 2 -> Tier 3)
 */
export async function escalateTicket(client, ticketId, guildId, escalatedBy, reason = 'Escalation requested by staff') {
  try {
    const { Ticket, GuildSettings } = client.db.models;
    const ticket = await Ticket.findOne({ where: { ticketId, guildId } });
    if (!ticket) return { error: 'Ticket not found.' };
    if (ticket.status === 'closed') return { error: 'Cannot escalate a closed ticket.' };

    const currentTier = ticket.tier || 1;
    if (currentTier >= 3) {
      return { error: 'Ticket is already at the highest escalation level (Tier 3).' };
    }

    const newTier = currentTier + 1;
    let newPriority = ticket.priority;

    if (newTier === 2) {
      if (newPriority === 'Low' || newPriority === 'Medium') newPriority = 'High';
    } else if (newTier === 3) {
      newPriority = 'Critical';
    }

    await ticket.update({
      tier: newTier,
      priority: newPriority
    });

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    const channel = await client.channels.fetch(ticket.channelId).catch(() => null);
    const settings = await GuildSettings.findOne({ where: { guildId } });

    const higherTierRoles = [];
    if (guild) {
      const targetKeywords = newTier === 2
        ? ['tier 2', 'senior', 'lead', 'tier2', 'supervisor']
        : ['tier 3', 'manager', 'management', 'admin', 'tier3', 'executive'];

      guild.roles.cache.forEach(role => {
        const name = role.name.toLowerCase();
        if (targetKeywords.some(kw => name.includes(kw))) {
          higherTierRoles.push(role);
        }
      });

      if (channel && higherTierRoles.length > 0) {
        for (const role of higherTierRoles) {
          await channel.permissionOverwrites.edit(role.id, {
            ViewChannel: true,
            SendMessages: true,
            ManageChannels: true,
            AttachFiles: true,
          }).catch(() => {});
        }
      }
    }

    const pEmoji = { Low: '🟢', Medium: '🟡', High: '🟠', Critical: '🔴' };
    const tierLabels = { 1: 'Tier 1 (General Support)', 2: 'Tier 2 (Senior Support)', 3: 'Tier 3 (Executive Management)' };

    if (channel) {
      const pings = higherTierRoles.map(r => `<@&${r.id}>`).slice(0, 3).join(' ');
      await channel.send({
        content: pings ? `🚨 **Senior Staff Alert**: ${pings}` : undefined,
        embeds: [
          buildEmbed({
            type: 'warning',
            title: `🚨 Ticket Escalated — Tier ${newTier}`,
            description: `Ticket **${ticketId}** has been escalated to **${tierLabels[newTier]}**.\n\n` +
              `**Escalated By:** <@${escalatedBy.id}>\n` +
              `**Reason:** ${reason}\n` +
              `**New Priority:** ${pEmoji[newPriority]} ${newPriority}`,
            footer: 'Aura Multi-Tier Escalation Protocol',
            timestamp: true
          })
        ]
      }).catch(() => {});
    }

    if (settings?.ticketLogChannelId) {
      const logCh = await client.channels.fetch(settings.ticketLogChannelId).catch(() => null);
      if (logCh?.isTextBased()) {
        await logCh.send({
          embeds: [
            buildEmbed({
              type: 'warning',
              title: `⚠️ Ticket Escalation Log — ${ticketId}`,
              description: `**Ticket:** <#${ticket.channelId}>\n` +
                `**User:** <@${ticket.userId}>\n` +
                `**Escalated By:** <@${escalatedBy.id}>\n` +
                `**Tier:** Tier ${currentTier} ➡️ Tier ${newTier}\n` +
                `**Priority:** ${ticket.priority} ➡️ ${newPriority}\n` +
                `**Reason:** ${reason}`,
              timestamp: true
            })
          ]
        }).catch(() => {});
      }
    }

    return { success: true, ticket, newTier, newPriority };
  } catch (err) {
    logger.error('[Tickets] escalateTicket:', err);
    return { error: 'Failed to escalate ticket.' };
  }
}

/**
 * Sends a CSAT rating prompt to user DM upon ticket closure
 */
export async function sendCSATPrompt(client, user, ticketId) {
  try {
    const row = new ActionRowBuilder().addComponents(
      [1, 2, 3, 4, 5].map(rating =>
        new ButtonBuilder()
          .setCustomId(`csat:${ticketId}:${rating}`)
          .setLabel(`${'⭐'.repeat(rating)} (${rating}/5)`)
          .setStyle(rating >= 4 ? ButtonStyle.Success : rating === 3 ? ButtonStyle.Primary : ButtonStyle.Secondary)
      )
    );

    await user.send({
      embeds: [
        buildEmbed({
          type: 'primary',
          title: '⭐ Aura CSAT Support Survey',
          description: `Your ticket **${ticketId}** has been closed. How would you rate your support experience?`,
          footer: 'Aura ITSM Quality Assurance'
        })
      ],
      components: [row]
    }).catch(() => {
      logger.debug(`[CSAT] Direct Message to user ${user?.id} failed or blocked.`);
    });
  } catch (err) {
    logger.debug('[CSAT] Failed to send DM:', err.message);
  }
}

/**
 * Record CSAT rating and optional feedback into database
 */
export async function recordCSATResponse(client, { ticketId, guildId, userId, rating, feedback = null }) {
  try {
    const { Ticket, TicketCSAT } = client.db.models;
    const numRating = parseInt(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return { error: 'Rating must be an integer between 1 and 5.' };
    }

    const ticket = await Ticket.findOne({
      where: ticketId ? { ticketId } : { guildId, userId }
    });

    const targetGuildId = guildId || ticket?.guildId;
    const targetUserId = userId || ticket?.userId;

    if (ticket) {
      await ticket.update({ satisfaction: numRating });
    }

    let csatRecord = null;
    if (TicketCSAT && targetGuildId) {
      csatRecord = await TicketCSAT.create({
        ticketId: ticketId || ticket?.ticketId || 'UNKNOWN',
        guildId: targetGuildId,
        userId: targetUserId,
        rating: numRating,
        feedback,
        staffId: ticket?.claimedBy || null,
      });
    }

    return { success: true, rating: numRating, csatRecord, ticket };
  } catch (err) {
    logger.error('[Tickets] recordCSATResponse:', err);
    return { error: 'Failed to record CSAT response.' };
  }
}

/**
 * Export satisfaction metrics for a guild
 */
export async function exportCSATMetrics(client, guildId, options = {}) {
  try {
    const { TicketCSAT, Ticket } = client.db.models;
    let csatRecords = [];
    if (TicketCSAT) {
      csatRecords = await TicketCSAT.findAll({ where: { guildId } });
    }

    const totalResponses = csatRecords.length;
    let averageRating = 0;
    let satisfactionPercentage = 0;
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const staffStats = {};

    if (totalResponses > 0) {
      let sumRating = 0;
      let satisfiedCount = 0;

      csatRecords.forEach(rec => {
        const r = rec.rating;
        if (r >= 1 && r <= 5) breakdown[r] = (breakdown[r] || 0) + 1;
        sumRating += r;
        if (r >= 4) satisfiedCount += 1;

        if (rec.staffId) {
          if (!staffStats[rec.staffId]) {
            staffStats[rec.staffId] = { staffId: rec.staffId, total: 0, sum: 0, positive: 0 };
          }
          staffStats[rec.staffId].total += 1;
          staffStats[rec.staffId].sum += r;
          if (r >= 4) staffStats[rec.staffId].positive += 1;
        }
      });

      averageRating = parseFloat((sumRating / totalResponses).toFixed(2));
      satisfactionPercentage = parseFloat(((satisfiedCount / totalResponses) * 100).toFixed(1));
    }

    const staffMetrics = Object.values(staffStats).map(s => ({
      staffId: s.staffId,
      totalResponses: s.total,
      averageRating: parseFloat((s.sum / s.total).toFixed(2)),
      satisfactionPercentage: parseFloat(((s.positive / s.total) * 100).toFixed(1))
    }));

    const closedTicketsCount = await Ticket.count({ where: { guildId, status: 'closed' } });
    const openTicketsCount = await Ticket.count({ where: { guildId, status: ['open', 'claimed'] } });

    return {
      guildId,
      totalResponses,
      averageRating,
      satisfactionPercentage,
      ratingBreakdown: breakdown,
      staffMetrics,
      ticketsSummary: {
        closed: closedTicketsCount,
        open: openTicketsCount
      },
      exportedAt: new Date().toISOString()
    };
  } catch (err) {
    logger.error('[Tickets] exportCSATMetrics:', err);
    return {
      guildId,
      totalResponses: 0,
      averageRating: 0,
      satisfactionPercentage: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      staffMetrics: [],
      error: 'Failed to export CSAT metrics'
    };
  }
}

export const getCSATMetrics = exportCSATMetrics;

/**
 * Close a ticket
 */
export async function closeTicket(client, ticketId, guildId, closedBy) {
  try {
    const { Ticket, GuildSettings } = client.db.models;
    const ticket = await Ticket.findOne({ where: { ticketId, guildId } });
    if (!ticket || ticket.status === 'closed') return { error: 'Ticket not found or already closed.' };

    await ticket.update({ status: 'closed', closedBy: closedBy.id, closedAt: new Date() });

    // Send CSAT survey to ticket creator
    const ticketUser = await client.users.fetch(ticket.userId).catch(() => null);
    if (ticketUser) await sendCSATPrompt(client, ticketUser, ticketId);

    const channel = await client.channels.fetch(ticket.channelId).catch(() => null);
    if (!channel) return { success: true };

    const settings = await GuildSettings.findOne({ where: { guildId } });
    if (settings?.premiumTier > 0) {
      const attachment = await discordTranscripts.createTranscript(channel, {
        limit: -1,
        fileName: `${ticketId}-transcript.html`,
        returnType: 'attachment',
        poweredBy: false
      });
      if (settings.ticketLogChannelId) {
        const logCh = await client.channels.fetch(settings.ticketLogChannelId).catch(() => null);

        if (logCh?.isTextBased()) await logCh.send({ content: `📑 Transcript for **${ticketId}**`, files: [attachment] });
      }
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket:reopen:${ticketId}`).setLabel('Re-open').setStyle(ButtonStyle.Success).setEmoji('🔓'),
      new ButtonBuilder().setCustomId(`ticket:delete:${ticketId}`).setLabel('Delete').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
      new ButtonBuilder().setCustomId(`csat:${ticketId}:5`).setLabel('Rate Us').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
    );

    await channel.send({ embeds: [buildEmbed({ type: 'warning', title: '🔒 Ticket Closed', description: `Closed by <@${closedBy.id}>. Use buttons below.`, timestamp: true })], components: [row] });
    await channel.permissionOverwrites.edit(guildId, { SendMessages: false }).catch(() => {});
    return { success: true };
  } catch (err) {
    logger.error('[Tickets] closeTicket:', err);
    return { error: 'Failed to close ticket.' };
  }
}

/**
 * Button Interaction Router
 */
export async function handleButton(client, interaction, args) {
  const [action, ...parts] = args.split(':');
  const ticketId = parts[0];
  const extra = parts.slice(1).join(':');
  const lang = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);

  if (action === 'claim') {
    const result = await claimTicket(client, ticketId, interaction.guildId, interaction.user);
    if (result.error) {
      return interaction.reply({ embeds: [buildEmbed({ type: 'error', description: `❌ ${result.error}` })], ephemeral: true });
    }
    return interaction.reply({ embeds: [buildEmbed({ type: 'success', description: `✅ Ticket **${ticketId}** claimed successfully.` })], ephemeral: true });
  }

  if (action === 'escalate') {
    const result = await escalateTicket(client, ticketId, interaction.guildId, interaction.user, 'Escalation via button interaction');
    if (result.error) {
      return interaction.reply({ embeds: [buildEmbed({ type: 'error', description: `❌ ${result.error}` })], ephemeral: true });
    }
    return interaction.reply({ embeds: [buildEmbed({ type: 'success', description: `✅ Escalated ticket to Tier ${result.newTier} (${result.newPriority} Priority).` })], ephemeral: true });
  }

  // Handle dynamic buttons from the Web-configured Ticket Panel
  if (action === 'open') {
    const categoryName = parts.join(':') || 'Support';
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket:setlang:dummy:${categoryName}|ar`).setLabel('🇸🇦 Arabic / عربى').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ticket:setlang:dummy:${categoryName}|en`).setLabel('🇬🇧 English').setStyle(ButtonStyle.Secondary),
    );

    return interaction.reply({
      embeds: [buildEmbed({ 
        type: 'info', 
        title: 'Select Language | اختر لغتك', 
        description: `Please select the language for your **Ticket**.\nيرجى اختيار لغة تذكرة.` 
      })],
      components: [row],
      ephemeral: true
    });
  }

  if (action === 'close') {
    const result = await closeTicket(client, ticketId, interaction.guildId, interaction.user);
    return interaction.reply({ embeds: [buildEmbed({ type: result.error ? 'error' : 'success', description: result.error || client.i18n.t('tickets.closed', { id: ticketId }, lang) })], ephemeral: true });
  }

  if (action === 'delete') {
    await interaction.channel?.delete('[Aura] Ticket deleted').catch(() => {});
    return;
  }

  if (action === 'survey') {
    const row = new ActionRowBuilder().addComponents([1,2,3,4,5].map(n => new ButtonBuilder().setCustomId(`csat:${ticketId}:${n}`).setLabel(`${n} ⭐`).setStyle(ButtonStyle.Secondary)));
    return interaction.reply({ embeds: [buildEmbed({ type: 'primary', description: client.i18n.t('tickets.survey', {}, lang) })], components: [row], ephemeral: true });
  }

  if (action === 'rate' || action === 'rating') {
    const ratingVal = parseInt(extra || ticketId);
    const targetId = extra ? ticketId : parts[0];
    await recordCSATResponse(client, {
      ticketId: targetId,
      guildId: interaction.guildId,
      userId: interaction.user.id,
      rating: ratingVal
    });
    return interaction.reply({ embeds: [buildEmbed({ type: 'success', description: `Thank you for your **${ratingVal}⭐** rating!` })], ephemeral: true });
  }

  // Language Selection
  if (action === 'setlang') {
    const langPayload = parts.slice(1).join(':');
    const [category, language] = langPayload.split('|'); // e.g., "Technical|ar"
    await interaction.deferUpdate();
    const result = await createTicket(client, interaction.guild, interaction.user, { category });
    
    if (result.error) return interaction.followUp({ embeds: [buildEmbed({ type: 'error', description: result.error })], ephemeral: true });
    
    return interaction.followUp({ 
      embeds: [buildEmbed({ type: 'success', description: language === 'ar' ? `✅ تم إنشاء التذكرة: <#${result.channel.id}>` : `✅ Ticket created: <#${result.channel.id}>` })], 
      ephemeral: true 
    });
  }
}

/**
 * Sends a premium ticket panel to a specific channel
 */
export async function sendTicketPanel(client, channel, imageUrl) {
  const embed = buildEmbed({
    type: 'primary',
    title: `أهلاً وسهلاً بك في نظام التذاكر لسيرفر ${channel.guild.name}`,
    description: 'يمكنك إختيار التذكرة الذي تود فتحها من خلال لوحة الإختيار بالأسفل',
    fields: [
      { name: '● الدعم الفني', value: 'للتواصل مع الدعم الفني.', inline: true },
      { name: '● شكوى على عضو', value: 'لفتح تذكرة شكوى على عضو بالسيرفر.', inline: true },
      { name: '● شكوى على إداري', value: 'لفتح تذكرة شكوى على إداري بالسيرفر.', inline: true },
      { name: '● الإدارة العليا', value: 'لفتح تذكرة تواصل مع الإدارة العليا.', inline: true },
      { name: '● بعض الملاحظات', value: '1 ● يُمنع إزعاج الإداره مُنْعًا باتًا .\n2 ● يُمنع نشر المحتوى في التذكرة وعقوبته الباند .\n3 ● يُمنع ترك التذكرة وعدم الرد عليها .', inline: false }
    ],
    image: imageUrl || null,
    timestamp: true
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket:select')
    .setPlaceholder('اختر خيار التذكرة | Choose Ticket Category')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('الدعم الفني | Technical Support').setValue('Technical').setEmoji('🔧'),
      new StringSelectMenuOptionBuilder().setLabel('شكوى على عضو | Member Complaint').setValue('Member Complaint').setEmoji('👤'),
      new StringSelectMenuOptionBuilder().setLabel('شكوى على إداري | Admin Complaint').setValue('Admin Complaint').setEmoji('🛡️'),
      new StringSelectMenuOptionBuilder().setLabel('الإدارة العليا | Management').setValue('Management').setEmoji('👑'),
    );

  const row = new ActionRowBuilder().addComponents(select);
  return channel.send({ embeds: [embed], components: [row] });
}

/**
 * Handles Select Menu interaction for the ticket panel
 */
export async function handleSelectMenu(client, interaction, args) {
  const category = interaction.values[0];
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket:setlang:dummy:${category}|ar`).setLabel('🇸🇦 Arabic / عربى').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`ticket:setlang:dummy:${category}|en`).setLabel('🇬🇧 English').setStyle(ButtonStyle.Secondary),
  );

  return interaction.reply({
    embeds: [buildEmbed({ 
      type: 'info', 
      title: 'Select Language | اختر لغتك', 
      description: `Please select the language for your **${category}** ticket.\nيرجى اختيار لغة تذكرة **${category}**.` 
    })],
    components: [row],
    ephemeral: true
  });
}
