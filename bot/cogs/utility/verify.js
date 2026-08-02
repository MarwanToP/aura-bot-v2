// ================================================================
//  AURA BOT v2.0 — Verification / Captcha Gate
//  Slash command + button handler for new-member verification
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

export const verify = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Set up a verification gate so new members must prove they are human before gaining access')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s
      .setName('setup')
      .setDescription('Configure the verification role and target channel')
      .addRoleOption(o => o.setName('role').setDescription('Role to give members after they verify').setRequired(true))
      .addChannelOption(o => o.setName('channel').setDescription('Channel to post the verify panel in (defaults to current)').setRequired(false))
    )
    .addSubcommand(s => s
      .setName('panel')
      .setDescription('Send (or resend) the verify panel in the configured channel')
    )
    .addSubcommand(s => s
      .setName('disable')
      .setDescription('Turn verification off (keeps the role/channel settings)')
    )
    .addSubcommand(s => s
      .setName('view')
      .setDescription('Show current verification configuration')
    ),

  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    try {
      const { GuildSettings } = client.db.models;
      const sub = interaction.options.getSubcommand();

      if (sub === 'setup') {
        const role    = interaction.options.getRole('role');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        await GuildSettings.update({
          verificationEnabled:   true,
          verificationRoleId:    role.id,
          verificationChannelId: channel.id,
        }, { where: { guildId: interaction.guildId } });

        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'success',
            title: '✅ Verification Configured',
            fields: [
              { name: '🎭 Verified Role', value: `<@&${role.id}>`, inline: true },
              { name: '📢 Panel Channel', value: `<#${channel.id}>`, inline: true },
            ],
            description: 'Now run `/verify panel` to post the verify button in that channel.',
          })],
        });
      }

      if (sub === 'panel') {
        const settings = await GuildSettings.findOne({ where: { guildId: interaction.guildId } });
        if (!settings?.verificationEnabled || !settings?.verificationRoleId) {
          return interaction.editReply({
            embeds: [buildEmbed({
              type: 'warning',
              description: '⚠️ Run `/verify setup` first to choose the role and channel.',
            })],
          });
        }
        const targetChannel = interaction.guild.channels.cache.get(settings.verificationChannelId);
        if (!targetChannel?.isTextBased()) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'error', description: '❌ The configured channel no longer exists or is not text-based.' })],
          });
        }
        const embed = buildEmbed({
          type: 'primary',
          title: '🛡️ Verification Required',
          description: 'Welcome! To gain access to the rest of the server, please click the button below and solve a quick math challenge.',
          footer: 'Aura Bot v2.0 • Verification Gate',
        });
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('verify_button').setLabel('Verify').setStyle(ButtonStyle.Success).setEmoji('✅'),
        );
        const msg = await targetChannel.send({ embeds: [embed], components: [row] });
        await GuildSettings.update({ verificationMessageId: msg.id }, { where: { guildId: interaction.guildId } });
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'success', description: `✅ Verify panel posted in <#${targetChannel.id}>.` })],
        });
      }

      if (sub === 'disable') {
        await GuildSettings.update({ verificationEnabled: false }, { where: { guildId: interaction.guildId } });
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'info', description: '🛑 Verification turned off. Members can use the server immediately.' })],
        });
      }

      if (sub === 'view') {
        const settings = await GuildSettings.findOne({ where: { guildId: interaction.guildId } });
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'info',
            title: '🛡️ Verification Configuration',
            fields: [
              { name: 'Status',       value: settings?.verificationEnabled ? '✅ Enabled' : '🛑 Disabled', inline: true },
              { name: 'Verified Role', value: settings?.verificationRoleId ? `<@&${settings.verificationRoleId}>` : 'Not set', inline: true },
              { name: 'Panel Channel', value: settings?.verificationChannelId ? `<#${settings.verificationChannelId}>` : 'Not set', inline: true },
            ],
          })],
        });
      }
    } catch (err) {
      client.logger?.error?.('[Verify] command failed:', err);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: '❌ Failed to process this verify command.' })],
      }).catch(() => {});
    }
  },
};

export default verify;
