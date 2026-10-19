// ================================================================
//  AURA BOT v2.0 — Security Shield (Wicks / SecurityBot / Vetox Style)
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import { activateLockdown, liftLockdown, isInLockdown } from '../../../shared/systems/antinuke/antiRaid.js';
import config from '../../../../../packages/config/index.js';

const onOff = (v) => (v ? '🟢 ENABLED' : '🔴 DISABLED');
const windowLabel = (ms) => `${Math.round(ms / 60000)}m`;

export const securityCommand = {
  data: new SlashCommandBuilder()
    .setName('security')
    .setDescription('Advanced Anti-Nuke, Raid Shield & Verification (Wicks/Vetox style)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s
      .setName('status')
      .setDescription('Check server security shield protection status')
    )
    .addSubcommand(s => s
      .setName('lockdown')
      .setDescription('1-click emergency server lockdown (Lock all text channels)')
      .addStringOption(o => o.setName('action').setDescription('Lockdown state').setRequired(true).addChoices(
        { name: 'Enable Lockdown', value: 'on' },
        { name: 'Disable Lockdown', value: 'off' }
      ))
    )
    .addSubcommand(s => s
      .setName('whitelist')
      .setDescription('Add trusted user or role to Anti-Nuke whitelist')
      .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(false))
      .addRoleOption(o => o.setName('role').setDescription('Target role').setRequired(false))
    ),
  // NOTE: `/security backup` removed (hidden) until a real snapshot system ships.

  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
    const sub = interaction.options.getSubcommand();

    try {
      if (sub === 'status') {
        const { GuildSettings } = client.db.models;
        const settings = await GuildSettings.findOne({ where: { guildId: interaction.guildId } }).catch(() => null);
        const wl = settings?.antiNukeConfig || {};
        const wlUsers = Array.isArray(wl.whitelistUsers) ? wl.whitelistUsers.length : 0;
        const wlRoles = Array.isArray(wl.whitelistRoles) ? wl.whitelistRoles.length : 0;

        let lockedDown = null;
        try { lockedDown = await isInLockdown(client, interaction.guildId); } catch { lockedDown = null; }
        const lockdownText = lockedDown === null ? '❔ Unknown' : (lockedDown ? '🔴 ACTIVE' : '🟢 Inactive');

        const t = config.antiNuke;
        const verificationText = settings?.verificationEnabled
          ? (settings.verificationRoleId
            ? `🟢 ENABLED (role: <@&${settings.verificationRoleId}>)`
            : '🟢 ENABLED (⚠️ no verification role configured)')
          : '🔴 DISABLED';
        const whitelistText = (wlUsers === 0 && wlRoles === 0)
          ? 'Not configured'
          : `**${wlUsers}** user(s) • **${wlRoles}** role(s)`;

        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'info',
            title: '🛡️ Server Security Shield Status',
            description: [
              `• **Anti-Nuke Protection:** ${onOff(settings?.antiNukeEnabled)} (ban ${t.banThreshold.count}/${windowLabel(t.banThreshold.window)}, kick ${t.kickThreshold.count}/${windowLabel(t.kickThreshold.window)}, channel-delete ${t.channelDeleteThreshold.count}/${windowLabel(t.channelDeleteThreshold.window)}, role-delete ${t.roleDeleteThreshold.count}/${windowLabel(t.roleDeleteThreshold.window)}, webhook ${t.webhookCreateThreshold.count}/${windowLabel(t.webhookCreateThreshold.window)})`,
              `• **Anti-Raid Filter:** ${onOff(settings?.antiRaidEnabled)} (${t.joinRaidThreshold.count} joins/${Math.round(t.joinRaidThreshold.window / 1000)}s)`,
              `• **Verification:** ${verificationText}`,
              `• **Whitelist:** ${whitelistText}`,
              `• **Lockdown:** ${lockdownText}`,
            ].join('\n'),
          })],
        });
      }

      if (sub === 'lockdown') {
        const action = interaction.options.getString('action');

        if (action === 'on') {
          if (await isInLockdown(client, interaction.guildId)) {
            return interaction.editReply({
              embeds: [buildEmbed({
                type: 'info',
                title: '🔒 Lockdown Already Active',
                description: 'The server is already in lockdown. Use `/security lockdown action:off` to lift it.',
              })],
            });
          }

          await activateLockdown(client, interaction.guild, `Manual by ${interaction.user.tag}`);
          return interaction.editReply({
            embeds: [buildEmbed({
              type: 'error',
              title: '🚨 EMERGENCY SERVER LOCKDOWN ENABLED',
              description: 'All public text channels have been locked. Message send permissions revoked for @everyone.\nUse `/security lockdown action:off` to lift the lockdown.',
            })],
          });
        }

        if (!(await isInLockdown(client, interaction.guildId))) {
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
            title: '🔓 Server Lockdown Lifted',
            description: 'Public channel permissions restored to normal state.',
          })],
        });
      }

      if (sub === 'whitelist') {
        const targetUser = interaction.options.getUser('user');
        const targetRole = interaction.options.getRole('role');
        if (!targetUser && !targetRole) {
          return interaction.editReply({
            embeds: [buildEmbed({
              type: 'warning',
              title: '🛡️ Whitelist Not Updated',
              description: 'Provide at least one target: `user` or `role`.',
            })],
          });
        }

        const { GuildSettings } = client.db.models;
        const [settings] = await GuildSettings.findOrCreate({ where: { guildId: interaction.guildId }, defaults: {} });
        const wl = settings.antiNukeConfig || {};
        const users = Array.isArray(wl.whitelistUsers) ? [...wl.whitelistUsers] : [];
        const roles = Array.isArray(wl.whitelistRoles) ? [...wl.whitelistRoles] : [];

        const targetId = targetUser?.id ?? targetRole.id;
        const targetName = targetUser ? targetUser.username : targetRole.name;
        const bucket = targetUser ? users : roles;

        if (bucket.includes(targetId)) {
          return interaction.editReply({
            embeds: [buildEmbed({
              type: 'info',
              title: '🛡️ Already Whitelisted',
              description: `**${targetName}** is already on the Anti-Nuke whitelist.`,
            })],
          });
        }

        bucket.push(targetId);
        await settings.update({ antiNukeConfig: { ...wl, whitelistUsers: users, whitelistRoles: roles } });

        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'success',
            title: '🛡️ Whitelist Updated',
            description: `Added **${targetName}** to the Anti-Nuke trusted whitelist.\n• Whitelisted users: **${users.length}**\n• Whitelisted roles: **${roles.length}**`,
          })],
        });
      }
    } catch {
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'error',
          title: '🛡️ Security Shield Error',
          description: 'Something went wrong while processing that action. Please try again.',
        })],
      }).catch(() => {});
    }
  },
};

export default securityCommand;
