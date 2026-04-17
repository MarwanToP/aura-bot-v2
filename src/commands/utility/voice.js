// ================================================================
//  AURA BOT v2.0 — TempVoice Management (Phase 2)
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';
import logger from '../../utils/logger.js';

export const voice = {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Manage temporary voice channels')
    .addSubcommand(s => s
      .setName('setup')
      .setDescription('[Admin] Initialize TempVoice system')
      .addChannelOption(o => o.setName('creator_channel').setDescription('The "Join to Create" channel').setRequired(true).addChannelTypes(ChannelType.GuildVoice))
      .addChannelOption(o => o.setName('category').setDescription('Category for new rooms').addChannelTypes(ChannelType.GuildCategory))
    )
    .addSubcommand(s => s
      .setName('lock')
      .setDescription('Lock your current room')
    )
    .addSubcommand(s => s
      .setName('unlock')
      .setDescription('Unlock your current room')
    )
    .addSubcommand(s => s
      .setName('name')
      .setDescription('Rename your room')
      .addStringOption(o => o.setName('name').setDescription('New name').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('limit')
      .setDescription('Set user limit')
      .addIntegerOption(o => o.setName('limit').setDescription('Max users (0 = unlimited)').setMinValue(0).setMaxValue(99).setRequired(true))
    ),

  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const { GuildSettings, TempChannel } = client.db.models;

    // ─── setup (Admin) ──────────────────────────────────────────
    if (sub === 'setup') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Permission Denied.' })] });
      }

      const creatorChannel = interaction.options.getChannel('creator_channel');
      const category       = interaction.options.getChannel('category');

      await GuildSettings.upsert({
        guildId: interaction.guildId,
        tempVoiceEnabled: true,
        tempVoiceCreatorId: creatorChannel.id,
        tempVoiceCategoryId: category?.id,
      });

      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          title: '🔊 TempVoice Initialized',
          description: `The system is now active!\n**Creator Channel:** <#${creatorChannel.id}>\n**Category:** ${category ? `<#${category.id}>` : 'None'}`,
          footer: 'Users joining the creator channel will get a private room automatically.',
        })],
      });
    }

    // ─── Room Management (Users) ─────────────────────────────────
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: '❌ You must be in a voice channel first.' })] });

    const isTemp = await TempChannel.findOne({ where: { channelId: voiceChannel.id, guildId: interaction.guildId } });
    if (!isTemp) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ This is not a temporary channel.' })] });
    
    if (isTemp.ownerId !== interaction.user.id) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Only the room owner can manage it.' })] });
    }

    if (sub === 'lock') {
      await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: false });
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: '🔒 Your room is now **Locked**.' })] });
    }

    if (sub === 'unlock') {
      await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: true });
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: '🔓 Your room is now **Unlocked**.' })] });
    }

    if (sub === 'name') {
      const name = interaction.options.getString('name');
      await voiceChannel.setName(name);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `🏷️ Room renamed to **${name}**.` })] });
    }

    if (sub === 'limit') {
      const limit = interaction.options.getInteger('limit');
      await voiceChannel.setUserLimit(limit);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `👥 User limit set to **${limit === 0 ? 'Unlimited' : limit}**.` })] });
    }
  },
};

export default voice;
