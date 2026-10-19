import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

const CATEGORIES = {
  moderation: {
    emoji: '🛡️',
    title: 'Security & Moderation',
    cmdNames: ['ban', 'kick', 'timeout', 'warn', 'clear', 'softban', 'history', 'warnings', 'unban', 'note', 'case', 'lockdown', 'backup', 'security', 'role', 'slowmode'],
  },
  economy: {
    emoji: '🏛️',
    title: 'Economy & Systems',
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

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View Aura Bot features, active modules, and documentation.')
    .addStringOption(o =>
      o.setName('category')
        .setDescription('Select specific category to inspect')
        .addChoices(
          { name: '🛡️ Security & Moderation', value: 'moderation' },
          { name: '🏛️ Economy & Systems',     value: 'economy' },
          { name: '👔 Management & Staff',     value: 'management' },
          { name: '📊 Information & Utility',  value: 'utility' },
          { name: '🎮 Games & Extra Systems',  value: 'games' }
        )
    ),
  cooldown: 3000,
  async execute(clientOrInteraction, interactionOrClient) {
    const interaction = clientOrInteraction?.reply ? clientOrInteraction : interactionOrClient;
    const client = clientOrInteraction?.commands ? clientOrInteraction : (interactionOrClient?.commands ? interactionOrClient : interaction?.client);

    const selectedCat = interaction?.options?.getString?.('category');

    const dashboardRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Web Dashboard')
        .setStyle(ButtonStyle.Link)
        .setURL(process.env.DASHBOARD_URL || 'http://localhost:3000')
        .setEmoji('🌐')
    );

    if (selectedCat && CATEGORIES[selectedCat]) {
      const cat = CATEGORIES[selectedCat];
      const fields = cat.cmdNames.map(cmdName => {
        const cmd = client?.commands?.get(cmdName);
        const data = cmd?.data?.toJSON ? cmd.data.toJSON() : cmd?.data;
        const desc = data?.description || 'Command module';
        const subcommands = data?.options?.filter(o => o.type === 1).map(o => `\`${o.name}\``) || [];
        return {
          name: `/${cmdName}`,
          value: `${desc}${subcommands.length > 0 ? `\n└ **Subcommands:** ${subcommands.join(', ')}` : ''}`,
          inline: false,
        };
      });

      const embed = new EmbedBuilder()
        .setColor('#8b5cf6')
        .setTitle(`${cat.emoji} ${cat.title}`)
        .setDescription('Below are all available slash commands in this category:')
        .addFields(fields)
        .setFooter({ text: 'Aura Bot v2.0 • Use /help to see all categories' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], components: [dashboardRow], flags: MessageFlags.Ephemeral });
    }

    const totalCmds = client?.commands?.size || 57;
    const guildCount = client?.guilds?.cache?.size || 1;

    const categoryFields = Object.values(CATEGORIES).map(cat => ({
      name: `${cat.emoji} ${cat.title}`,
      value: `${cat.cmdNames.length} commands:\n` + cat.cmdNames.map(c => `\`/${c}\``).join(' • '),
      inline: true,
    }));

    const embed = new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle('⚡ Aura Bot v2.0 — Command Suite & Documentation')
      .setDescription(
        `Enterprise Discord Bot loaded with **${totalCmds} primary slash commands**.\n\n` +
        `Use \`/help category:<category>\` for subcommand details & options!`
      )
      .addFields(categoryFields)
      .setFooter({ text: `Aura Bot Control • Operating across ${guildCount} server(s)` })
      .setTimestamp();

    if (client?.user?.displayAvatarURL) {
      embed.setThumbnail(client.user.displayAvatarURL({ size: 256 }));
    }

    return interaction.reply({ embeds: [embed], components: [dashboardRow], flags: MessageFlags.Ephemeral });
  },
};
