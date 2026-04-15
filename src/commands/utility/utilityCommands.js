// ================================================================
//  Commands: /settings /ticket /rank /leaderboard /help /lockdown
//            /invites /search
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed }  from '../../utils/embedBuilder.js';
import { levelFromXp, getLeaderboard, getUserRank, generateRankCard } from '../../systems/leveling/levelingSystem.js';
import { activateLockdown, liftLockdown, isInLockdown } from '../../systems/antinuke/antiRaid.js';
import config          from '../../../config/config.js';

// ─── /settings ────────────────────────────────────────────────
export const settings = {
  data: new SlashCommandBuilder()
    .setName('settings').setDescription('Configure Aura Bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName('view').setDescription('View current settings'))
    .addSubcommand(s => s
      .setName('language').setDescription('Set server language')
      .addStringOption(o => o.setName('lang').setDescription('Language').setRequired(true).addChoices({ name: '🇬🇧 English', value: 'en' }, { name: '🇸🇦 Arabic', value: 'ar' }))
    )
    .addSubcommand(s => s
      .setName('welcome').setDescription('Configure welcome system')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable'))
      .addChannelOption(o => o.setName('channel').setDescription('Welcome channel'))
      .addBooleanOption(o => o.setName('card').setDescription('Show welcome card'))
    )
    .addSubcommand(s => s
      .setName('modlog').setDescription('Set mod log channel')
      .addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('auditlog').setDescription('Set audit log channel')
      .addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('leveling').setDescription('Configure leveling')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable'))
      .addChannelOption(o => o.setName('channel').setDescription('Level-up channel'))
      .addNumberOption(o => o.setName('multiplier').setDescription('XP multiplier (0.1–5.0)').setMinValue(0.1).setMaxValue(5.0))
    )
    .addSubcommand(s => s
      .setName('antinuke').setDescription('Anti-nuke protection [Premium]')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('aimod').setDescription('AI Auto-Moderation')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('aichat').setDescription('AI Chat Channel')
      .addChannelOption(o => o.setName('channel').setDescription('Channel where AI responds'))
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable'))
    )
    .addSubcommand(s => s
      .setName('autorole').setDescription('Set auto-role on join')
      .addRoleOption(o => o.setName('role').setDescription('Role to assign').setRequired(true))
      .addIntegerOption(o => o.setName('delay').setDescription('Delay in seconds').setMinValue(0).setMaxValue(86400))
    )
    .addSubcommand(s => s
      .setName('tickets').setDescription('Configure ticket system')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable'))
      .addChannelOption(o => o.setName('log_channel').setDescription('Ticket log channel'))
    )
    .addSubcommand(s => s
      .setName('invitetrack').setDescription('Enable invite tracking')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable').setRequired(true))
    ),
  userPermissions: [PermissionFlagsBits.ManageGuild], guildOnly: true, cooldown: 3000,
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub  = interaction.options.getSubcommand();
    const lang = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const { GuildSettings } = client.db.models;
    const [settings] = await GuildSettings.findOrCreate({ where: { guildId: interaction.guildId }, defaults: {} });

    if (sub === 'view') {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'primary', title: '⚙️ Aura Settings',
        fields: [
          { name: '🌐 Language',    value: settings.language === 'ar' ? '🇸🇦 Arabic' : '🇬🇧 English', inline: true },
          { name: '⭐ Premium',     value: `Tier ${settings.premiumTier}`,                             inline: true },
          { name: '📥 Welcome',     value: settings.welcomeEnabled ? `✅ <#${settings.welcomeChannelId}>` : '❌', inline: true },
          { name: '📈 Leveling',    value: settings.levelingEnabled ? '✅' : '❌',                     inline: true },
          { name: '🛡️ Anti-Nuke',  value: settings.antiNukeEnabled ? '✅' : '❌',                     inline: true },
          { name: '🎫 Tickets',     value: settings.ticketEnabled   ? '✅' : '❌',                     inline: true },
          { name: '🤖 AI AutoMod',  value: settings.aiModEnabled    ? '✅' : '❌',                     inline: true },
          { name: '💬 AI Chat',     value: settings.aiChatChannelId ? `✅ <#${settings.aiChatChannelId}>` : '❌', inline: true },
          { name: '📋 Mod Log',     value: settings.modLogChannelId ? `<#${settings.modLogChannelId}>` : 'Not set', inline: true },
          { name: '📋 Audit Log',   value: settings.auditLogChannelId ? `<#${settings.auditLogChannelId}>` : 'Not set', inline: true },
          { name: '🎭 Auto Role',   value: settings.autoRoleId ? `<@&${settings.autoRoleId}>` : 'Not set', inline: true },
          { name: '📨 Inv. Track',  value: settings.inviteTrackEnabled ? '✅' : '❌', inline: true },
        ], footer: `Guild: ${interaction.guildId}`, timestamp: true,
      })] });
    }

    const updates = {};
    if (sub === 'language')    { updates.language = interaction.options.getString('lang'); await client.redis.del(`guild:lang:${interaction.guildId}`); }
    if (sub === 'welcome')     { const ch = interaction.options.getChannel('channel'), en = interaction.options.getBoolean('enabled'), card = interaction.options.getBoolean('card'); if (ch !== null) updates.welcomeChannelId = ch.id; if (en !== null) updates.welcomeEnabled = en; if (card !== null) updates.welcomeCard = card; }
    if (sub === 'modlog')      { updates.modLogChannelId   = interaction.options.getChannel('channel').id; await client.redis.del(`logchan:${interaction.guildId}`); }
    if (sub === 'auditlog')    { updates.auditLogChannelId = interaction.options.getChannel('channel').id; await client.redis.del(`logchan:${interaction.guildId}`); }
    if (sub === 'leveling')    { const en = interaction.options.getBoolean('enabled'), ch = interaction.options.getChannel('channel'), mul = interaction.options.getNumber('multiplier'); if (en !== null) updates.levelingEnabled = en; if (ch !== null) updates.levelUpChannelId = ch.id; if (mul !== null) updates.xpMultiplier = mul; }
    if (sub === 'antinuke')    { updates.antiNukeEnabled = interaction.options.getBoolean('enabled'); await client.redis.del(`antinuke:config:${interaction.guildId}`); }
    if (sub === 'aimod')       { updates.aiModEnabled = interaction.options.getBoolean('enabled'); await client.redis.del(`settings:aimod:${interaction.guildId}`); }
    if (sub === 'aichat')      { const ch = interaction.options.getChannel('channel'), en = interaction.options.getBoolean('enabled'); if (ch !== null) updates.aiChatChannelId = ch.id; if (en !== null) updates.aiChatEnabled = en; }
    if (sub === 'autorole')    { updates.autoRoleId = interaction.options.getRole('role').id; updates.autoRoleDelay = interaction.options.getInteger('delay') ?? 0; }
    if (sub === 'tickets')     { const en = interaction.options.getBoolean('enabled'), ch = interaction.options.getChannel('log_channel'); if (en !== null) updates.ticketEnabled = en; if (ch !== null) updates.ticketLogChannelId = ch.id; }
    if (sub === 'invitetrack') { updates.inviteTrackEnabled = interaction.options.getBoolean('enabled'); }

    await settings.update(updates);
    return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Settings updated successfully.` })] });
  },
};

// ─── /rank ────────────────────────────────────────────────────
export const rank = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your rank card')
    .addUserOption(o => o.setName('user').setDescription('User to check')),
  guildOnly: true, cooldown: 8000,
  async execute(client, interaction) {
    await interaction.deferReply();
    const target  = interaction.options.getUser('user') || interaction.user;
    const lang    = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const { UserProfile } = client.db.models;
    const profile = await UserProfile.findOne({ where: { userId: target.id, guildId: interaction.guildId } });
    if (!profile) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: client.i18n.t('leveling.noData', {}, lang) })] });

    const rankPos = await getUserRank(client, interaction.guildId, target.id);
    const member  = await interaction.guild.members.fetch(target.id).catch(() => null);
    const card    = member ? await generateRankCard(member, profile, rankPos) : null;

    if (card) return interaction.editReply({ files: [card] });

    const { level, currentXp, nextLevelXp } = levelFromXp(Number(profile.xp));
    const progress = Math.floor((currentXp / nextLevelXp) * 100);
    const bar      = '█'.repeat(Math.floor(progress/5)) + '░'.repeat(20 - Math.floor(progress/5));
    return interaction.editReply({ embeds: [buildEmbed({ type: 'primary', title: `📊 ${target.username}`, thumbnail: target.displayAvatarURL({ size: 256 }), fields: [
      { name: '🏆 Rank',    value: `#${rankPos}`,                  inline: true },
      { name: '📈 Level',   value: `${level}`,                     inline: true },
      { name: '⭐ Total XP',value: Number(profile.xp).toLocaleString(), inline: true },
      { name: '📊 Progress',value: `${bar}\n${currentXp}/${nextLevelXp} XP (${progress}%)`, inline: false },
    ], timestamp: true })] });
  },
};

// ─── /leaderboard ─────────────────────────────────────────────
export const leaderboard = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Server XP leaderboard')
    .addIntegerOption(o => o.setName('page').setDescription('Page').setMinValue(1)),
  guildOnly: true, cooldown: 10000,
  async execute(client, interaction) {
    await interaction.deferReply();
    const lang    = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const page    = (interaction.options.getInteger('page') || 1) - 1;
    const entries = await getLeaderboard(client, interaction.guildId, 10, page * 10);
    if (!entries.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: 'No leaderboard data yet.' })] });
    const medals = ['🥇','🥈','🥉'];
    const fields = entries.map((e, i) => { const pos = page*10+i+1; const { level } = levelFromXp(Number(e.xp)); return { name: `${medals[pos-1]||`**${pos}.**`} <@${e.userId}>`, value: `Level ${level} • ${Number(e.xp).toLocaleString()} XP`, inline: false }; });
    return interaction.editReply({ embeds: [buildEmbed({ type: 'primary', title: client.i18n.t('leveling.leaderboardTitle', { guild: interaction.guild.name }, lang), fields, footer: `Page ${page+1}`, timestamp: true })] });
  },
};

// ─── /lockdown ────────────────────────────────────────────────
export const lockdown = {
  data: new SlashCommandBuilder()
    .setName('lockdown').setDescription('[Premium] Server lockdown')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName('activate').setDescription('Lock server').addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)))
    .addSubcommand(s => s.setName('lift').setDescription('Unlock server')),
  userPermissions: [PermissionFlagsBits.ManageGuild], premiumTier: 1, guildOnly: true, cooldown: 10000,
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub  = interaction.options.getSubcommand();
    const lang = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    if (sub === 'activate') {
      const reason = interaction.options.getString('reason');
      if (await isInLockdown(client, interaction.guildId)) return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: '⚠️ Server is already in lockdown.' })] });
      await activateLockdown(client, interaction.guild, reason);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', title: '🔒 Lockdown Activated', description: client.i18n.t('security.lockdown.activated', { user: interaction.user.tag, reason }, lang) })] });
    }
    await liftLockdown(client, interaction.guild, interaction.user);
    return interaction.editReply({ embeds: [buildEmbed({ type: 'success', title: '🔓 Lockdown Lifted', description: client.i18n.t('security.lockdown.lifted', { user: interaction.user.tag }, lang) })] });
  },
};

// ─── /help ────────────────────────────────────────────────────
export const help = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all commands')
    .addStringOption(o => o.setName('category').setDescription('Category')
      .addChoices(
        { name: '🤖 AI',          value: 'ai' },
        { name: '🛡️ Moderation', value: 'moderation' },
        { name: '📈 Leveling',    value: 'leveling' },
        { name: '💰 Economy',     value: 'economy' },
        { name: '🎫 Tickets',     value: 'tickets' },
        { name: '⚙️ Settings',   value: 'settings' },
        { name: '⭐ Premium',     value: 'premium' },
      )
    ),
  cooldown: 5000,
  async execute(client, interaction) {
    const category = interaction.options.getString('category');
    const cats = {
      ai:         { emoji: '🤖', title: 'AI Commands',         cmds: ['/ask','/chat','/imagine','/translate','/summarize','/aimod'] },
      moderation: { emoji: '🛡️', title: 'Moderation',         cmds: ['/ban','/kick','/timeout','/warn','/clear','/softban','/history','/warnings'] },
      leveling:   { emoji: '📈', title: 'Leveling & XP',       cmds: ['/rank','/leaderboard','/xp','/levelreward'] },
      economy:    { emoji: '💰', title: 'Economy',             cmds: ['/balance','/daily','/work','/gamble','/shop','/transfer','/richlist'] },
      tickets:    { emoji: '🎫', title: 'Tickets',             cmds: ['/ticket open','/ticket close','/ticket claim','/ticket add','/ticket list'] },
      settings:   { emoji: '⚙️', title: 'Settings',           cmds: ['/settings view','/settings language','/settings welcome','/settings leveling','/settings antinuke','/settings aimod','/settings aichat'] },
      premium:    { emoji: '⭐', title: 'Premium Features',    cmds: ['/giveaway start','/social add','/customcmd add','/reactionrole add','/timedmsg add','/tempchannel create','/automation create','/lockdown','/poll ai'] },
    };
    if (category) {
      const cat = cats[category];
      return interaction.reply({ embeds: [buildEmbed({ type: 'primary', title: `${cat.emoji} ${cat.title}`, description: cat.cmds.map(c => `\`${c}\``).join(' • '), footer: 'Aura Bot v2.0 • /help for overview' })], ephemeral: true });
    }
    return interaction.reply({ embeds: [buildEmbed({ type: 'primary', title: '✨ Aura Bot v2.0 — Help', description: 'Enterprise Discord Bot with AI • Bilingual AR/EN\n\nUse `/help category:` for details.', thumbnail: client.user.displayAvatarURL({ size: 256 }), fields: Object.values(cats).map(c => ({ name: c.emoji+' '+c.title, value: `${c.cmds.length} commands`, inline: true })), footer: `Aura v${config.version} • ${client.guilds.cache.size} servers`, timestamp: true })], ephemeral: true });
  },
};

// ─── /search ──────────────────────────────────────────────────
export const search = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search anything with AI summary')
    .addStringOption(o => o.setName('query').setDescription('What to search for').setRequired(true)),
  cooldown: 10000,
  async execute(client, interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString('query');
    const lang  = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);

    if (!client.ai.isAvailable()) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI not configured.' })] });

    try {
      const langNote = lang === 'ar' ? 'Respond in Arabic.' : '';
      const result   = await client.ai.prompt(
        `Provide a comprehensive, accurate answer to this search query: "${query}"\n\nInclude key facts, current information if relevant, and any important context. ${langNote}\nKeep response under 800 characters.`,
        { maxTokens: 500 }
      );
      return interaction.editReply({ embeds: [buildEmbed({ type: 'ai', title: `🔍 ${query}`, description: result.content, footer: `Powered by Gemini 2.5 Flash`, timestamp: true })] });
    } catch (err) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Search failed.' })] });
    }
  },
};

// ─── /ticket ──────────────────────────────────────────────────
export const ticket = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Support ticket system')
    .addSubcommand(s => s
      .setName('open').setDescription('Open a ticket')
      .addStringOption(o => o.setName('category').setDescription('Category').setRequired(true).addChoices(
        { name: '🔧 Technical', value: 'Technical' }, { name: '💳 Billing', value: 'Billing' },
        { name: '🚨 Report', value: 'Report' }, { name: '🤝 Partnership', value: 'Partnership' }, { name: '❓ Other', value: 'Other' }
      ))
      .addStringOption(o => o.setName('subject').setDescription('Brief subject').setMaxLength(100))
      .addStringOption(o => o.setName('priority').setDescription('Priority').addChoices(
        { name: '🟢 Low', value: 'Low' }, { name: '🟡 Medium', value: 'Medium' }, { name: '🟠 High', value: 'High' }, { name: '🔴 Critical', value: 'Critical' }
      ))
    )
    .addSubcommand(s => s.setName('close').setDescription('Close this ticket'))
    .addSubcommand(s => s.setName('claim').setDescription('Claim this ticket'))
    .addSubcommand(s => s.setName('add').setDescription('Add user').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove user').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('List open tickets').addUserOption(o => o.setName('user').setDescription('Filter by user'))),
  guildOnly: true, cooldown: 5000,
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub  = interaction.options.getSubcommand();
    const lang = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);

    if (sub === 'open') {
      const { createTicket } = await import('../../systems/tickets/ticketSystem.js');
      const result = await createTicket(client, interaction.guild, interaction.user, {
        category: interaction.options.getString('category'),
        subject:  interaction.options.getString('subject') || '',
        priority: interaction.options.getString('priority') || 'Medium',
      });
      if (result.error) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: result.error })] });
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: client.i18n.t('tickets.created', { channel: `<#${result.channel.id}>` }, lang) })] });
    }

    if (sub === 'close') {
      const { Ticket } = client.db.models;
      const t = await Ticket.findOne({ where: { channelId: interaction.channel.id, guildId: interaction.guildId } });
      if (!t) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('tickets.notTicket', {}, lang) })] });
      const { closeTicket } = await import('../../systems/tickets/ticketSystem.js');
      const result = await closeTicket(client, t.ticketId, interaction.guildId, interaction.user);
      return interaction.editReply({ embeds: [buildEmbed({ type: result.error ? 'error' : 'success', description: result.error || client.i18n.t('tickets.closed', { id: t.ticketId }, lang) })] });
    }

    if (sub === 'add') {
      const user = interaction.options.getMember('user');
      await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true });
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Added <@${user.id}> to ticket.` })] });
    }

    if (sub === 'remove') {
      const user = interaction.options.getMember('user');
      await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: false });
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Removed <@${user.id}> from ticket.` })] });
    }

    if (sub === 'list') {
      const { Ticket } = client.db.models;
      const filterUser = interaction.options.getUser('user');
      const where = { guildId: interaction.guildId, status: ['open', 'claimed'] };
      if (filterUser) where.userId = filterUser.id;
      const tickets = await Ticket.findAll({ where, order: [['createdAt', 'DESC']], limit: 15 });
      if (!tickets.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: '📭 No open tickets.' })] });
      const fields = tickets.map(t => ({ name: `${t.ticketId} — ${t.category}`, value: `<@${t.userId}> • ${t.priority} • ${t.status} • <#${t.channelId}>`, inline: false }));
      return interaction.editReply({ embeds: [buildEmbed({ type: 'primary', title: '🎫 Open Tickets', fields })] });
    }
  },
};

export default settings;
