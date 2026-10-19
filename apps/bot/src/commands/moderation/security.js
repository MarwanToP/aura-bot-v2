// ================================================================
//  AURA BOT v2.0 — Emergency Lockdown (/lockdown)
//  Manual entry point for the SHARED anti-raid lockdown state
//  (same redis key + channel/invite pass as /security lockdown and
//  the automatic raid detector), so manual and automatic lockdowns
//  can no longer stomp each other's channel state.
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import { activateLockdown, liftLockdown, isInLockdown } from '../../../shared/systems/antinuke/antiRaid.js';

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
    )
    .addBooleanOption(option =>
      option.setName('force')
        .setDescription('Force the unlock even if the lockdown tracker reports no active lockdown')
        .setRequired(false)
    ),

  botPermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});

      const isLocking = interaction.options.getString('action') === 'lock';
      const force = interaction.options.getBoolean('force') ?? false;

      if (isLocking) {
        if (await isInLockdown(client, interaction.guildId)) {
          return interaction.editReply({
            embeds: [buildEmbed({
              type: 'info',
              title: '🔒 Lockdown Already Active',
              description: 'This server is already under lockdown — manual and automatic raid lockdowns share the same state.\nUse `/lockdown` with the unlock action to lift it.',
            })],
          });
        }

        await activateLockdown(client, interaction.guild, `Manual by ${interaction.user.tag}`);
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'error',
            title: '🚨 EMERGENCY SERVER LOCKDOWN ENABLED',
            description: 'All text channels have been locked, invites revoked and `@everyone` message permissions revoked.\nUse `/lockdown` with the unlock action to lift the lockdown.',
          })],
        });
      }

      const active = await isInLockdown(client, interaction.guildId);

      if (!active && !force) {
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'info',
            title: '🔓 No Active Lockdown',
            description: 'The server is not currently in lockdown — nothing to lift.',
          })],
        });
      }

      await liftLockdown(client, interaction.guild, interaction.user);
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          title: active ? '🔓 Server Lockdown Lifted' : '🔓 Server Lockdown Lifted (Forced)',
          description: active
            ? 'Channel permissions have been restored to their normal state and the shared lockdown flag cleared.'
            : 'The lockdown tracker had no active lockdown recorded, but a forced lift was requested.\nChannel permissions have been restored to their normal state and the shared lockdown flag cleared.',
        })],
      });
    } catch {
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'error',
          title: '🚨 Lockdown Error',
          description: 'Something went wrong while processing that lockdown action. Please try again.',
        })],
      }).catch(() => {});
    }
  },
};
