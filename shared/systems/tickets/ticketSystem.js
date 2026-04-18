// ================================================================
//  Ticket System v2 — Create, Close, Claim, Transcripts
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
export async function initializeTicketPanel(client, panelId) {
  const { TicketPanel } = client.db.models;
  const panel = await TicketPanel.findOne({ where: { panelId } });
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
  panel.categories.slice(0, 5).forEach(cat => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket:open:${cat.id}`)
        .setLabel(cat.label)
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

export async function createTicket(client, guild, user, { category = 'Other', subject = '', priority = 'Medium' } = {}) {
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

    const channel = await guild.channels.create({
      name:   chanName, type: ChannelType.GuildText, parent: settings.ticketCategoryId,
      permissionOverwrites: [
        { id: guild.roles.everyone,    deny:  [PermissionFlagsBits.ViewChannel] },
        { id: user.id,                 allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
        { id: guild.members.me.id,     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
        ...((settings.ticketSupportRoles||[]).map(r => ({ id: r, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }))),
      ],
    });

    await Ticket.create({ ticketId, guildId: guild.id, userId: user.id, channelId: channel.id, category, subject, priority, status: 'open' });

    const lang = await client.i18n.resolveLanguage(client, user.id, guild.id);
    const pEmoji = { Low: '🟢', Medium: '🟡', High: '🟠', Critical: '🔴' };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket:claim:${ticketId}`).setLabel('Claim').setStyle(ButtonStyle.Primary).setEmoji('🙋'),
      new ButtonBuilder().setCustomId(`ticket:close:${ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
    );

    await channel.send({ content: `<@${user.id}>`, embeds: [buildEmbed({ type: 'primary', title: `${config.emojis.ticket} ${ticketId} — ${category}`, description: `Welcome, <@${user.id}>!\n\nPlease describe your issue in detail.${subject ? `\n\n**Subject:** ${subject}` : ''}`, fields: [ { name: '📋 Category', value: category, inline: true }, { name: '⚡ Priority', value: `${pEmoji[priority]} ${priority}`, inline: true } ], footer: ticketId, timestamp: true })], components: [row] });

    if (settings.ticketLogChannelId) {
      const logCh = await client.channels.fetch(settings.ticketLogChannelId).catch(() => null);
      if (logCh?.isTextBased()) await logCh.send({ embeds: [buildEmbed({ type: 'info', title: `📨 New Ticket — ${ticketId}`, description: `**User:** <@${user.id}>\n**Category:** ${category}\n**Priority:** ${priority}\n**Channel:** <#${channel.id}>`, timestamp: true })] });
    }

    return { channel, ticketId };
  } catch (err) {
    logger.error('[Tickets] createTicket:', err);
    return { error: 'Failed to create ticket.' };
  }
}

export async function closeTicket(client, ticketId, guildId, closedBy) {
  try {
    const { Ticket, GuildSettings } = client.db.models;
    const ticket = await Ticket.findOne({ where: { ticketId, guildId } });
    if (!ticket || ticket.status === 'closed') return { error: 'Ticket not found or already closed.' };

    await ticket.update({ status: 'closed', closedBy: closedBy.id, closedAt: new Date() });

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
      new ButtonBuilder().setCustomId(`ticket:survey:${ticketId}`).setLabel('Rate Us').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
    );

    await channel.send({ embeds: [buildEmbed({ type: 'warning', title: '🔒 Ticket Closed', description: `Closed by <@${closedBy.id}>. Use buttons below.`, timestamp: true })], components: [row] });
    await channel.permissionOverwrites.edit(guildId, { SendMessages: false }).catch(() => {});
    return { success: true };
  } catch (err) {
    logger.error('[Tickets] closeTicket:', err);
    return { error: 'Failed to close ticket.' };
  }
}

export async function handleButton(client, interaction, args) {
  const [action, ticketId, extra] = args.split(':');
  const lang = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);

  if (action === 'claim') {
    const { Ticket } = client.db.models;
    const ticket = await Ticket.findOne({ where: { ticketId, guildId: interaction.guildId } });
    if (!ticket) return interaction.reply({ embeds: [buildEmbed({ type: 'error', description: '❌ Ticket not found.' })], ephemeral: true });
    await ticket.update({ claimedBy: interaction.user.id, status: 'claimed', firstResponseAt: new Date() });
    
    // Track Staff Activity
    await trackActivity(client, interaction.guildId, interaction.user.id, 'ticket');
    
    await interaction.channel?.send({ embeds: [buildEmbed({ type: 'success', description: `🙋 Claimed by <@${interaction.user.id}>.` })] });
    return interaction.reply({ embeds: [buildEmbed({ type: 'success', description: '✅ Ticket claimed.' })], ephemeral: true });
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
    const row = new ActionRowBuilder().addComponents([1,2,3,4,5].map(n => new ButtonBuilder().setCustomId(`ticket:rate:${ticketId}:${n}`).setLabel(`${n} ⭐`).setStyle(ButtonStyle.Secondary)));
    return interaction.reply({ embeds: [buildEmbed({ type: 'primary', description: client.i18n.t('tickets.survey', {}, lang) })], components: [row], ephemeral: true });
  }

  if (action === 'rate') {
    const { Ticket } = client.db.models;
    await Ticket.update({ satisfaction: parseInt(extra) }, { where: { ticketId, guildId: interaction.guildId } });
    return interaction.reply({ embeds: [buildEmbed({ type: 'success', description: `Thank you for your **${extra}⭐** rating!` })], ephemeral: true });
  }

  // Language Selection
  if (action === 'setlang') {
    const [category, language] = extra.split('|'); // e.g., "Technical|ar"
    await interaction.deferUpdate();
    const result = await createTicket(client, interaction.guild, interaction.user, { category });
    
    if (result.error) return interaction.followUp({ embeds: [buildEmbed({ type: 'error', description: result.error })], ephemeral: true });
    
    // Set ticket language context (optional, can be inferred from 'language' param)
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
