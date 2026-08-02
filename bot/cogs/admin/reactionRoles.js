// ================================================================
//  Admin Command — /reactionrole
//  Full management of the ReactionRole system.
//  Registered via commandHandler's loadDir scan of admin/.
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import {
  addReactionRole,
  removeReactionRole,
  listReactionRoles,
  clearMessageReactionRoles,
  syncReactions,
} from '../../../shared/systems/reactionroles/reactionRoleSystem.js';

const TYPE_DESCRIPTIONS = {
  toggle:      '↔️ Toggle — add on react, remove on un-react',
  add_only:    '➕ Add Only — only grants role, never removes',
  remove_only: '➖ Remove Only — only removes role on react',
  unique:      '🔘 Unique — only one role from this message at a time',
};

export const reactionrole = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Manage reaction role bindings for messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)

    // ── add ──────────────────────────────────────────────────────
    .addSubcommand(s => s
      .setName('add')
      .setDescription('Bind an emoji reaction to a role on a specific message')
      .addStringOption(o =>
        o.setName('message_id')
          .setDescription('The message ID to bind the reaction to')
          .setRequired(true)
      )
      .addStringOption(o =>
        o.setName('emoji')
          .setDescription('Emoji to use (e.g. ⭐ or <:custom:id>)')
          .setRequired(true)
      )
      .addRoleOption(o =>
        o.setName('role')
          .setDescription('Role to assign when this emoji is reacted')
          .setRequired(true)
      )
      .addChannelOption(o =>
        o.setName('channel')
          .setDescription('Channel the message lives in (defaults to current channel)')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      )
      .addStringOption(o =>
        o.setName('type')
          .setDescription('Behaviour type (default: toggle)')
          .addChoices(
            { name: '↔️ Toggle (add+remove)',   value: 'toggle' },
            { name: '➕ Add Only',              value: 'add_only' },
            { name: '➖ Remove Only',           value: 'remove_only' },
            { name: '🔘 Unique (one at a time)', value: 'unique' },
          )
      )
    )

    // ── remove ───────────────────────────────────────────────────
    .addSubcommand(s => s
      .setName('remove')
      .setDescription('Remove a specific emoji → role binding from a message')
      .addStringOption(o =>
        o.setName('message_id')
          .setDescription('The message ID')
          .setRequired(true)
      )
      .addStringOption(o =>
        o.setName('emoji')
          .setDescription('Emoji that was bound')
          .setRequired(true)
      )
      .addRoleOption(o =>
        o.setName('role')
          .setDescription('Role that was bound')
          .setRequired(true)
      )
    )

    // ── list ─────────────────────────────────────────────────────
    .addSubcommand(s => s
      .setName('list')
      .setDescription('List all reaction role bindings in this server')
      .addStringOption(o =>
        o.setName('message_id')
          .setDescription('Filter by a specific message ID (optional)')
      )
    )

    // ── clear ────────────────────────────────────────────────────
    .addSubcommand(s => s
      .setName('clear')
      .setDescription('Remove ALL reaction role bindings from a message')
      .addStringOption(o =>
        o.setName('message_id')
          .setDescription('The message ID to clear')
          .setRequired(true)
      )
    )

    // ── sync ─────────────────────────────────────────────────────
    .addSubcommand(s => s
      .setName('sync')
      .setDescription('Make the bot react to the message so users can see clickable reactions')
      .addStringOption(o =>
        o.setName('message_id')
          .setDescription('The message ID to sync reactions onto')
          .setRequired(true)
      )
    ),

  userPermissions: [PermissionFlagsBits.ManageRoles],
  botPermissions:  [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown:  3000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    // ─────────────────────────────────────────────────────────────
    // ADD
    // ─────────────────────────────────────────────────────────────
    if (sub === 'add') {
      const messageId = interaction.options.getString('message_id').trim();
      const emojiStr  = interaction.options.getString('emoji').trim();
      const role      = interaction.options.getRole('role');
      const channel   = interaction.options.getChannel('channel') || interaction.channel;
      const type      = interaction.options.getString('type') || 'toggle';

      // Validate message ID format
      if (!/^\d{17,20}$/.test(messageId)) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: '❌ Invalid message ID. Must be 17–20 digits.' })],
        });
      }

      // Validate the message actually exists in the channel
      const targetMsg = await channel.messages.fetch(messageId).catch(() => null);
      if (!targetMsg) {
        return interaction.editReply({
          embeds: [buildEmbed({
            type:        'error',
            description: `❌ Message \`${messageId}\` was not found in ${channel}.\nMake sure the message is in the correct channel.`,
          })],
        });
      }

      // Bot hierarchy check
      const botMe = interaction.guild.members.me;
      if (role.position >= botMe.roles.highest.position) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: '❌ I cannot assign that role — it is equal to or above my highest role.' })],
        });
      }
      if (role.managed) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: '❌ That role is managed by an integration and cannot be assigned via reaction roles.' })],
        });
      }

      const result = await addReactionRole(
        client,
        interaction.guildId,
        channel.id,
        messageId,
        emojiStr,
        role.id,
        type,
      );

      if (!result.ok) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: result.existing ? 'warning' : 'error', description: `❌ ${result.error}` })],
        });
      }

      // Auto-sync: react to the message immediately so users can see it
      await targetMsg.react(emojiStr).catch(() => {});

      return interaction.editReply({
        embeds: [buildEmbed({
          type:        'success',
          title:       '✅ Reaction Role Added',
          description: `Successfully bound ${emojiStr} → <@&${role.id}> on [this message](${targetMsg.url}).`,
          fields: [
            { name: '📋 Type',       value: TYPE_DESCRIPTIONS[type],       inline: false },
            { name: '📍 Channel',    value: `${channel}`,                  inline: true  },
            { name: '🆔 Message ID', value: `\`${messageId}\``,            inline: true  },
          ],
          footer:    'Bot has already reacted so users can click it',
          timestamp: true,
        })],
      });
    }

    // ─────────────────────────────────────────────────────────────
    // REMOVE
    // ─────────────────────────────────────────────────────────────
    if (sub === 'remove') {
      const messageId = interaction.options.getString('message_id').trim();
      const emojiStr  = interaction.options.getString('emoji').trim();
      const role      = interaction.options.getRole('role');

      const result = await removeReactionRole(client, interaction.guildId, messageId, emojiStr, role.id);

      if (!result.ok) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: result.found === false ? 'warning' : 'error', description: `❌ ${result.error}` })],
        });
      }

      return interaction.editReply({
        embeds: [buildEmbed({
          type:        'success',
          description: `✅ Removed binding ${emojiStr} → <@&${role.id}> from message \`${messageId}\`.`,
          footer:      'Note: existing bot reaction on the message was NOT removed automatically.',
          timestamp:   true,
        })],
      });
    }

    // ─────────────────────────────────────────────────────────────
    // LIST
    // ─────────────────────────────────────────────────────────────
    if (sub === 'list') {
      const filterMsgId = interaction.options.getString('message_id')?.trim() || null;
      const entries     = await listReactionRoles(client, interaction.guildId, filterMsgId);

      if (!entries.length) {
        return interaction.editReply({
          embeds: [buildEmbed({
            type:        'info',
            description: filterMsgId
              ? `📭 No reaction role bindings found for message \`${filterMsgId}\`.`
              : '📭 No reaction role bindings configured in this server yet.\nUse `/reactionrole add` to create one.',
          })],
        });
      }

      // Group by messageId for readability (max 25 entries shown)
      const grouped = entries.reduce((acc, e) => {
        if (!acc[e.messageId]) acc[e.messageId] = [];
        acc[e.messageId].push(e);
        return acc;
      }, {});

      const fields = [];
      for (const [msgId, bindings] of Object.entries(grouped)) {
        const firstChannel = bindings[0].channelId;
        const lines = bindings.map(b => `${b.emoji} → <@&${b.roleId}> \`[${b.type}]\``).join('\n');
        fields.push({
          name:  `📌 Msg \`${msgId}\` in <#${firstChannel}>`,
          value: lines,
          inline: false,
        });
        if (fields.length >= 10) break; // Discord embed limit safety
      }

      return interaction.editReply({
        embeds: [buildEmbed({
          type:      'primary',
          title:     '🎭 Reaction Role Bindings',
          fields,
          footer:    `${entries.length} total binding(s)${entries.length > 25 ? ' (showing first 25)' : ''}`,
          timestamp: true,
        })],
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CLEAR
    // ─────────────────────────────────────────────────────────────
    if (sub === 'clear') {
      const messageId = interaction.options.getString('message_id').trim();

      // Require ManageGuild for destructive bulk ops
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: '❌ Clearing all bindings on a message requires **Manage Server** permission.' })],
        });
      }

      const result = await clearMessageReactionRoles(client, interaction.guildId, messageId);

      if (!result.ok) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: `❌ ${result.error}` })],
        });
      }

      if (result.deleted === 0) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'warning', description: `⚠️ No bindings found on message \`${messageId}\`.` })],
        });
      }

      return interaction.editReply({
        embeds: [buildEmbed({
          type:        'success',
          description: `🗑️ Cleared **${result.deleted}** reaction role binding(s) from message \`${messageId}\`.`,
          footer:      'Existing bot reactions on the message were NOT removed.',
          timestamp:   true,
        })],
      });
    }

    // ─────────────────────────────────────────────────────────────
    // SYNC
    // ─────────────────────────────────────────────────────────────
    if (sub === 'sync') {
      const messageId = interaction.options.getString('message_id').trim();

      // Inform user before potentially slow operation
      await interaction.editReply({
        embeds: [buildEmbed({ type: 'info', description: `⏳ Syncing reactions to message \`${messageId}\`…` })],
      });

      const result = await syncReactions(client, interaction.guildId, messageId);

      if (!result.ok) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: `❌ Sync failed: ${result.error}` })],
        });
      }

      if (result.synced === 0) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'warning', description: `⚠️ No bindings found for message \`${messageId}\`. Nothing to sync.` })],
        });
      }

      return interaction.editReply({
        embeds: [buildEmbed({
          type:        'success',
          title:       '✅ Reactions Synced',
          description: `Added **${result.synced}** reaction(s) to the message so users can interact.`,
          timestamp:   true,
        })],
      });
    }
  },
};

export default reactionrole;
