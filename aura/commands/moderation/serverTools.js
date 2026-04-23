// ================================================================
//  Server Tools — /role  /slowmode
//  Administrative role management and channel slowmode control.
//  Pattern matches modCommands.js & utilityCommands.js exactly.
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

// ─── /role ───────────────────────────────────────────────────────
/**
 * /role add <user> <role>     — Give a role to a user
 * /role remove <user> <role>  — Remove a role from a user
 * /role all <role>            — Assign a role to ALL members  [Admin]
 * /role bots <role>           — Assign a role to ALL bots     [Admin]
 * /role info <role>           — Alias for /roleinfo inline
 */
export const role = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Role management utilities')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)

    .addSubcommand(s => s
      .setName('add')
      .setDescription('Add a role to a member')
      .addUserOption(o => o.setName('user').setDescription('Target member').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Role to add').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setMaxLength(256))
    )
    .addSubcommand(s => s
      .setName('remove')
      .setDescription('Remove a role from a member')
      .addUserOption(o => o.setName('user').setDescription('Target member').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Role to remove').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setMaxLength(256))
    )
    .addSubcommand(s => s
      .setName('all')
      .setDescription('[Admin] Assign a role to ALL human members (slow operation)')
      .addRoleOption(o => o.setName('role').setDescription('Role to assign').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('bots')
      .setDescription('[Admin] Assign a role to ALL bot accounts in this server')
      .addRoleOption(o => o.setName('role').setDescription('Role to assign to bots').setRequired(true))
    ),

  userPermissions: [PermissionFlagsBits.ManageRoles],
  botPermissions:  [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown:  3000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub    = interaction.options.getSubcommand();
    const lang   = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const botMe  = interaction.guild.members.me;

    // ── add / remove ──────────────────────────────────────────
    if (sub === 'add' || sub === 'remove') {
      const target = interaction.options.getMember('user');
      const role   = interaction.options.getRole('role');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (!target) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.invalidUser', {}, lang) })],
        });
      }

      // Bot role hierarchy check
      if (role.position >= botMe.roles.highest.position) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: '❌ I cannot manage that role — it is equal to or higher than my highest role.' })],
        });
      }
      // Invoker hierarchy check
      if (role.position >= interaction.member.roles.highest.position) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.higherRole', {}, lang) })],
        });
      }
      // Managed (integration) roles
      if (role.managed) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: '❌ That role is managed by an integration and cannot be assigned manually.' })],
        });
      }

      if (sub === 'add') {
        if (target.roles.cache.has(role.id)) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'warning', description: `⚠️ **${target.user.tag}** already has <@&${role.id}>.` })],
          });
        }
        await target.roles.add(role.id, `[Aura] ${interaction.user.tag}: ${reason}`);
        return interaction.editReply({
          embeds: [buildEmbed({
            type:        'success',
            description: `✅ Added <@&${role.id}> to **${target.user.tag}**.`,
            footer:      reason,
            timestamp:   true,
          })],
        });
      }

      // remove
      if (!target.roles.cache.has(role.id)) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'warning', description: `⚠️ **${target.user.tag}** does not have <@&${role.id}>.` })],
        });
      }
      await target.roles.remove(role.id, `[Aura] ${interaction.user.tag}: ${reason}`);
      return interaction.editReply({
        embeds: [buildEmbed({
          type:        'success',
          description: `✅ Removed <@&${role.id}> from **${target.user.tag}**.`,
          footer:      reason,
          timestamp:   true,
        })],
      });
    }

    // ── all / bots ────────────────────────────────────────────
    if (sub === 'all' || sub === 'bots') {
      // Require ManageGuild for mass operations
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: '❌ Mass role assignment requires **Manage Server** permission.' })],
        });
      }

      const role = interaction.options.getRole('role');

      if (role.position >= botMe.roles.highest.position) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: '❌ I cannot manage that role — it is above my highest role.' })],
        });
      }
      if (role.managed) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: '❌ That role is managed by an integration.' })],
        });
      }

      // Fetch all members
      const all     = await interaction.guild.members.fetch();
      const targets = sub === 'bots'
        ? all.filter(m => m.user.bot && !m.roles.cache.has(role.id))
        : all.filter(m => !m.user.bot && !m.roles.cache.has(role.id));

      if (!targets.size) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'info', description: `ℹ️ All ${sub === 'bots' ? 'bot' : 'human'} members already have <@&${role.id}>.` })],
        });
      }

      // Acknowledge immediately then process
      await interaction.editReply({
        embeds: [buildEmbed({
          type:        'info',
          description: `⏳ Assigning <@&${role.id}> to **${targets.size}** ${sub === 'bots' ? 'bot(s)' : 'member(s)'}…`,
          footer:      'This may take a moment.',
        })],
      });

      let success = 0;
      let failed  = 0;
      for (const [, member] of targets) {
        await member.roles.add(role.id, `[Aura Mass Role] by ${interaction.user.tag}`).then(() => success++).catch(() => failed++);
        // Throttle: ~30 req/s is safe
        await new Promise(r => setTimeout(r, 35));
      }

      return interaction.editReply({
        embeds: [buildEmbed({
          type:        failed === 0 ? 'success' : 'warning',
          title:       '✅ Mass Role Complete',
          description: `Assigned <@&${role.id}> to **${success}** member(s).${failed ? ` (${failed} failed)` : ''}`,
          timestamp:   true,
        })],
      });
    }
  },
};

// ─── /slowmode ───────────────────────────────────────────────────
/**
 * /slowmode <seconds>   — Set slowmode (0 = off, max 21600 = 6h)
 * /slowmode off         — Convenience subcommand to disable
 */
export const slowmode = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set or remove slowmode in the current channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(s => s
      .setName('set')
      .setDescription('Set a slowmode delay')
      .addIntegerOption(o =>
        o.setName('seconds')
          .setDescription('Delay in seconds (0–21600, 0 = disable)')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(21600)
      )
      .addStringOption(o => o.setName('reason').setDescription('Reason').setMaxLength(256))
    )
    .addSubcommand(s => s
      .setName('off')
      .setDescription('Disable slowmode in this channel')
    ),

  userPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions:  [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  cooldown:  4000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    if (!interaction.channel?.isTextBased() || interaction.channel.isDMBased()) {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: '❌ This command can only be used in text channels.' })],
      });
    }

    const botPerms = interaction.channel.permissionsFor(interaction.guild.members.me);
    if (!botPerms?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: '❌ I need **Manage Channel** permission in this channel.' })],
      });
    }

    if (sub === 'off') {
      await interaction.channel.setRateLimitPerUser(0, `[Aura] Slowmode disabled by ${interaction.user.tag}`);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'success', description: '✅ Slowmode disabled in this channel.' })],
      });
    }

    // sub === 'set'
    const seconds = interaction.options.getInteger('seconds');
    const reason  = interaction.options.getString('reason') || 'No reason provided';

    await interaction.channel.setRateLimitPerUser(seconds, `[Aura] ${interaction.user.tag}: ${reason}`);

    const current = interaction.channel.rateLimitPerUser;
    if (current === 0) {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'success', description: '✅ Slowmode has been **disabled**.' })],
      });
    }

    // Human-readable duration
    const fmt = current < 60
      ? `${current}s`
      : current < 3600
        ? `${Math.floor(current / 60)}m ${current % 60}s`
        : `${Math.floor(current / 3600)}h ${Math.floor((current % 3600) / 60)}m`;

    return interaction.editReply({
      embeds: [buildEmbed({
        type:        'success',
        title:       '⏱️ Slowmode Updated',
        description: `Slowmode set to **${fmt}** in ${interaction.channel}.`,
        fields: [
          { name: '📝 Reason', value: reason, inline: false },
        ],
        footer:    `Set by ${interaction.user.tag}`,
        timestamp: true,
      })],
    });
  },
};

export default role;
