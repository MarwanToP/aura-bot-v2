import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Emergency server lockdown — lock or unlock all text channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Lockdown state')
        .setRequired(true)
        .addChoices(
          { name: '🔒 Enable Lockdown (Lock All Channels)', value: 'lock' },
          { name: '🔓 Disable Lockdown (Unlock All Channels)', value: 'unlock' }
        )
    ),

  async execute(interaction) {
    const action = interaction.options.getString('action');
    const { guild } = interaction;

    await interaction.deferReply();

    const isLocking = action === 'lock';
    let count = 0;

    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);

    for (const [_, channel] of channels) {
      try {
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: isLocking ? false : null
        });
        count++;
      } catch (e) {
        // Skip uneditable channels
      }
    }

    const embed = new EmbedBuilder()
      .setColor(isLocking ? 0xef5252 : 0x32c86d)
      .setTitle(isLocking ? '🚨 Server Lockdown Enabled' : '🔓 Server Lockdown Disabled')
      .setDescription(
        isLocking
          ? `**${count}** text channels have been locked! Members cannot send messages until lockdown is lifted.`
          : `**${count}** text channels have been restored to normal permissions.`
      )
      .setFooter({ text: 'Security Shield • Aura Bot v2.0', iconURL: guild.iconURL() })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
