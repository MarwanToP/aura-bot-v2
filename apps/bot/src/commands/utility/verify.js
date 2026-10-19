// ================================================================
//  AURA BOT v2.0 — Verification / Captcha Gate
//  Slash command + button handler for new-member verification
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
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

  botPermissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});

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

/**
 * Handle clicks on the verification panel button.
 * The customId is the bare `verify_button` (no prefix token), so the component
 * router registers it under that exact id and args arrives here as ''.
 * Registered via events/interactionCreate → COMPONENT_REGISTRY.
 * Single-ack contract: deferUpdate() first, then an ephemeral followUp for
 * every outcome (success / already verified / not configured / failure).
 */
export async function handleButton(client, interaction, args) {
  // Ack before any DB/role work — those can exceed Discord's 3s deadline.
  await interaction.deferUpdate().catch(() => {});

  const fail = (description) => interaction.followUp({
    embeds: [buildEmbed({ type: 'error', description })],
    flags: MessageFlags.Ephemeral,
  }).catch(() => {});

  try {
    if (!interaction.guild) {
      return fail('❌ Could not verify you — please click the button from inside this server.');
    }

    // interaction.member can be null or a raw API member (no role manager) —
    // safe-deny, then fall back to fetching the full GuildMember.
    let member = interaction.member;
    if (!member || typeof member.roles?.add !== 'function') {
      member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    }
    if (!member) {
      return fail('❌ Could not resolve your member record — please try again from inside this server.');
    }

    const { GuildSettings } = client.db?.models || {};
    const settings = await GuildSettings?.findOne({ where: { guildId: interaction.guildId } }).catch(() => null);

    if (!settings?.verificationEnabled || !settings.verificationRoleId) {
      return fail('❌ Verification is not configured on this server. Please contact an administrator.');
    }

    const role = interaction.guild.roles.cache.get(settings.verificationRoleId)
      || await interaction.guild.roles.fetch(settings.verificationRoleId).catch(() => null);
    if (!role) {
      client.logger?.warn?.(`[Verify] Configured role ${settings.verificationRoleId} no longer exists (guild ${interaction.guildId})`);
      return fail('❌ The configured verification role no longer exists. Please contact an administrator.');
    }

    if (member.roles.cache.has(role.id)) {
      return interaction.followUp({
        embeds: [buildEmbed({ type: 'info', description: 'ℹ️ You are already verified — you already have the required role.' })],
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }

    try {
      await member.roles.add(role, 'Verification gate: member clicked Verify');
    } catch (err) {
      client.logger?.warn?.(`[Verify] Failed to grant role ${role.id} to ${interaction.user.id} (guild ${interaction.guildId}): ${err.message}`);
      return fail('❌ I could not assign the verification role — check my role hierarchy and permissions.');
    }

    return interaction.followUp({
      embeds: [buildEmbed({ type: 'success', description: `✅ You are verified! Welcome to **${interaction.guild.name}**.` })],
      flags: MessageFlags.Ephemeral,
    }).catch(() => {});
  } catch (err) {
    client.logger?.warn?.('[Verify] handleButton failed:', err);
    return fail('❌ Something went wrong while verifying you. Please try again.');
  }
}
