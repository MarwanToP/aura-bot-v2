// ================================================================
//  Commands: /settings /ticket /rank /leaderboard /help /lockdown
//            /invites /search
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildEmbed }  from '../../../shared/utils/embedBuilder.js';
import { levelFromXp, getLeaderboard, getUserRank, generateRankCard, applyXpDecay } from '../../../shared/systems/leveling/levelingSystem.js';
import { activateLockdown, liftLockdown, isInLockdown } from '../../../shared/systems/antinuke/antiRaid.js';
import config          from '../../../shared/config/config.js';

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
      .setName('farewell').setDescription('Configure farewell system')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable'))
      .addChannelOption(o => o.setName('channel').setDescription('Farewell channel'))
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
      .addChannelOption(o => o.setName('category').setDescription('Category for new tickets').addChannelTypes(ChannelType.GuildCategory))
      .addRoleOption(o => o.setName('support_role').setDescription('Support role for tickets'))
      .addChannelOption(o => o.setName('log_channel').setDescription('Ticket log channel'))
    )
    .addSubcommand(s => s
      .setName('invitetrack').setDescription('Enable invite tracking')
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('stafflog').setDescription('Set staff activity log channel')
      .addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('voicelog').setDescription('Set voice AI session log channel')
      .addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true))
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
          { name: '📤 Farewell',    value: settings.farewellEnabled ? `✅ <#${settings.farewellChannelId}>` : '❌', inline: true },
          { name: '📈 Leveling',    value: settings.levelingEnabled ? '✅' : '❌',                     inline: true },
          { name: '🛡️ Anti-Nuke',  value: settings.antiNukeEnabled ? '✅' : '❌',                     inline: true },
          { name: '🎫 Tickets',     value: settings.ticketEnabled   ? `✅ Cat: ${settings.ticketCategoryId ? `<#${settings.ticketCategoryId}>` : '❌'}` : '❌', inline: true },
          { name: '🤖 AI AutoMod',  value: settings.aiModEnabled    ? '✅' : '❌',                     inline: true },
          { name: '💬 AI Chat',     value: settings.aiChatChannelId ? `✅ <#${settings.aiChatChannelId}>` : '❌', inline: true },
          { name: '📋 Mod Log',     value: settings.modLogChannelId ? `<#${settings.modLogChannelId}>` : 'Not set', inline: true },
          { name: '📋 Audit Log',   value: settings.auditLogChannelId ? `<#${settings.auditLogChannelId}>` : 'Not set', inline: true },
          { name: '📋 Staff Log',   value: settings.staffLogChannelId ? `<#${settings.staffLogChannelId}>` : 'Not set', inline: true },
          { name: '📋 Voice Log',   value: settings.voiceLogChannelId ? `<#${settings.voiceLogChannelId}>` : 'Not set', inline: true },
          { name: '🎭 Auto Role',   value: settings.autoRoleId ? `<@&${settings.autoRoleId}>` : 'Not set', inline: true },
          { name: '📨 Inv. Track',  value: settings.inviteTrackEnabled ? '✅' : '❌', inline: true },
          { name: '🔧 Tkt Support', value: (settings.ticketSupportRoles || []).length ? (settings.ticketSupportRoles || []).map(r => `<@&${r}>`).join(', ') : 'Not set', inline: false },
        ], footer: `Guild: ${interaction.guildId}`, timestamp: true,
      })] });
    }

    const updates = {};
    if (sub === 'language')    { updates.language = interaction.options.getString('lang'); await client.redis.del(`guild:lang:${interaction.guildId}`); }
    if (sub === 'welcome')     { const ch = interaction.options.getChannel('channel'), en = interaction.options.getBoolean('enabled'), card = interaction.options.getBoolean('card'); if (ch !== null) updates.welcomeChannelId = ch.id; if (en !== null) updates.welcomeEnabled = en; if (card !== null) updates.welcomeCard = card; }
    if (sub === 'farewell')    { const ch = interaction.options.getChannel('channel'), en = interaction.options.getBoolean('enabled'); if (ch !== null) updates.farewellChannelId = ch.id; if (en !== null) updates.farewellEnabled = en; }
    if (sub === 'modlog')      { updates.modLogChannelId   = interaction.options.getChannel('channel').id; await client.redis.del(`logchan:${interaction.guildId}`); }
    if (sub === 'auditlog')    { updates.auditLogChannelId = interaction.options.getChannel('channel').id; await client.redis.del(`logchan:${interaction.guildId}`); }
    if (sub === 'leveling')    { const en = interaction.options.getBoolean('enabled'), ch = interaction.options.getChannel('channel'), mul = interaction.options.getNumber('multiplier'); if (en !== null) updates.levelingEnabled = en; if (ch !== null) updates.levelUpChannelId = ch.id; if (mul !== null) updates.xpMultiplier = mul; }
    if (sub === 'antinuke')    { updates.antiNukeEnabled = interaction.options.getBoolean('enabled'); await client.redis.del(`antinuke:config:${interaction.guildId}`); }
    if (sub === 'aimod')       { updates.aiModEnabled = interaction.options.getBoolean('enabled'); await client.redis.del(`settings:aimod:${interaction.guildId}`); }
    if (sub === 'aichat')      { const ch = interaction.options.getChannel('channel'), en = interaction.options.getBoolean('enabled'); if (ch !== null) updates.aiChatChannelId = ch.id; if (en !== null) updates.aiChatEnabled = en; }
    if (sub === 'autorole')    { updates.autoRoleId = interaction.options.getRole('role').id; updates.autoRoleDelay = interaction.options.getInteger('delay') ?? 0; }
    if (sub === 'tickets')     { 
      const en = interaction.options.getBoolean('enabled'), 
            ch = interaction.options.getChannel('log_channel'),
            cat = interaction.options.getChannel('category'),
            role = interaction.options.getRole('support_role');
      if (en !== null) updates.ticketEnabled = en; 
      if (ch !== null) updates.ticketLogChannelId = ch.id; 
      if (cat !== null) updates.ticketCategoryId = cat.id;
      if (role !== null) {
        let current = settings.ticketSupportRoles || [];
        if (!current.includes(role.id)) {
          updates.ticketSupportRoles = [...current, role.id];
        }
      }
    }
    if (sub === 'invitetrack') { updates.inviteTrackEnabled = interaction.options.getBoolean('enabled'); }
    if (sub === 'stafflog')    { updates.staffLogChannelId = interaction.options.getChannel('channel').id; }
    if (sub === 'voicelog')    { updates.voiceLogChannelId = interaction.options.getChannel('channel').id; }

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

// ─── /help ────────────────────────────────────────────────────
export const help = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all commands & feature categories')
    .addStringOption(o => o.setName('category').setDescription('Select command category')
      .addChoices(
        { name: '🛡️ Security & Moderation', value: 'moderation' },
        { name: '🏛️ Economy & Systems',     value: 'economy' },
        { name: '👔 Management & Staff',     value: 'management' },
        { name: '📊 Information & Utility',  value: 'utility' },
        { name: '🎮 Games & Extra Systems',  value: 'games' },
      )
    ),
  cooldown: 3000,
  async execute(client, interaction) {
    const selectedCat = interaction.options.getString('category');

    const categoriesDef = {
      moderation: {
        emoji: '🛡️',
        title: 'Security & Moderation',
        cmdNames: ['ban', 'kick', 'timeout', 'warn', 'clear', 'softban', 'history', 'warnings', 'unban', 'note', 'case', 'lockdown', 'backup', 'security', 'role', 'slowmode'],
      },
      economy: {
        emoji: '🏛️',
        title: 'Economy & Economy Systems',
        cmdNames: ['credits', 'rep', 'daily', 'transfer', 'work', 'richlist', 'leaderboard', 'rank'],
      },
      management: {
        emoji: '👔',
        title: 'Management & Staff',
        cmdNames: ['staff', 'modstaff', 'ticket', 'tpanel', 'reactionrole', 'apply', 'suggest', 'verify', 'deliver'],
      },
      utility: {
        emoji: '📊',
        title: 'Information & Utility',
        cmdNames: ['userinfo', 'serverinfo', 'roleinfo', 'aura', 'stats', 'invites', 'settings', 'autoresponder', 'ping', 'help'],
      },
      games: {
        emoji: '🎮',
        title: 'Games & Extra Systems',
        cmdNames: ['avatar', 'customcmd', 'timedmsg', 'tempchannel', 'aesthetic', 'voice'],
      },
    };

    const getCmdDetails = (cmdName) => {
      const cmd = client.commands.get(cmdName);
      if (!cmd) return `\`/${cmdName}\``;
      const data = cmd.data?.toJSON ? cmd.data.toJSON() : cmd.data;
      const subcommands = data?.options?.filter(o => o.type === 1).map(o => o.name) || [];
      if (subcommands.length > 0) {
        return `\`/${cmdName}\` (*${subcommands.join(', ')}*)`;
      }
      return `\`/${cmdName}\``;
    };

    if (selectedCat) {
      const aliasMap = { ai: 'utility', clan: 'economy', automation: 'utility', birthday: 'games' };
      const catKey   = aliasMap[selectedCat.toLowerCase()] || selectedCat.toLowerCase();
      const cat      = categoriesDef[catKey];

      if (cat) {
        const formattedCmds = cat.cmdNames.map(getCmdDetails);
        const fields = cat.cmdNames.map(cmdName => {
          const cmd = client.commands.get(cmdName);
          const data = cmd?.data?.toJSON ? cmd.data.toJSON() : cmd?.data;
          const desc = data?.description || 'Command module';
          const subcommands = data?.options?.filter(o => o.type === 1).map(o => `\`${o.name}\``) || [];
          return {
            name: `/${cmdName}`,
            value: `${desc}${subcommands.length > 0 ? `\n└ **Subcommands:** ${subcommands.join(', ')}` : ''}`,
            inline: false,
          };
        });

        return interaction.reply({
          embeds: [buildEmbed({
            type: 'primary',
            title: `${cat.emoji} ${cat.title}`,
            description: `Below are all available slash commands in this category:`,
            fields,
            footer: 'Aura Bot v2.0 • Use /help to see all categories',
            timestamp: true,
          })],
          ephemeral: true,
        });
      }
    }

    const fields = Object.values(categoriesDef).map(cat => ({
      name: `${cat.emoji} ${cat.title}`,
      value: `${cat.cmdNames.length} commands:\n` + cat.cmdNames.map(c => `\`/${c}\``).join(' • '),
      inline: true,
    }));

    const totalCmds = client.commands.size;
    const guildCount = client.guilds?.cache?.size || 1;

    return interaction.reply({
      embeds: [buildEmbed({
        type: 'primary',
        title: '✨ Aura Bot v2.0 — Command Suite Overview',
        description: `Enterprise Discord Bot loaded with **${totalCmds} primary slash commands**.\n\nUse \`/help category:<category>\` for subcommand details & options!`,
        thumbnail: client.user?.displayAvatarURL?.({ size: 256 }),
        fields,
        footer: `Aura v${config.version} • Operating across ${guildCount} server(s)`,
        timestamp: true,
      })],
      ephemeral: true,
    });
  },
};

// ─── /search ──────────────────────────────────────────────────
export const search = {
  register: false,
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

// ─── /ping ────────────────────────────────────────────────────
export const ping = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and uptime'),
  cooldown: 5000,
  async execute(client, interaction) {
    const sent = await interaction.deferReply({ fetchReply: true });
    const delay = sent?.createdTimestamp ? (sent.createdTimestamp - interaction.createdTimestamp) : 0;
    
    return interaction.editReply({ 
      embeds: [buildEmbed({ 
        type: 'primary', 
        title: '🏓 Pong!', 
        fields: [
          { name: 'Bot Latency', value: `\`${delay}ms\``, inline: true },
          { name: 'API Latency', value: `\`${Math.round(client.ws.ping)}ms\``, inline: true },
          { name: 'Uptime', value: `<t:${Math.floor(client.readyTimestamp / 1000)}:R>`, inline: false }
        ],
        timestamp: true 
      })] 
    });
  },
};

export default settings;
