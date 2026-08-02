// ================================================================
//  AURA BOT v2.0 — Auto-Responder Slash Command
//  CRUD for the existing AutoResponder model + Redis cache invalidation
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import safeRegex from 'safe-regex';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import { Op } from 'sequelize';

const CACHE_KEY = (guildId) => `autoresponder:${guildId}`;

export const autoresponder = {
  data: new SlashCommandBuilder()
    .setName('autoresponder')
    .setDescription('Manage automatic replies when specific phrases are detected in messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s
      .setName('add')
      .setDescription('Create a new auto-responder')
      .addStringOption(o => o.setName('trigger').setDescription('The phrase to listen for').setRequired(true).setMaxLength(200))
      .addStringOption(o => o.setName('trigger_type').setDescription('How to match the trigger')
        .setRequired(true)
        .addChoices(
          { name: 'Exact match',    value: 'exact' },
          { name: 'Contains',       value: 'contains' },
          { name: 'Starts with',    value: 'startsWith' },
          { name: 'Regex pattern',  value: 'regex' },
        ))
      .addStringOption(o => o.setName('response').setDescription('The reply. Use {user} for the author mention.').setRequired(true).setMaxLength(1000))
      .addIntegerOption(o => o.setName('cooldown').setDescription('Cooldown in seconds between triggers in the same channel').setMinValue(0).setMaxValue(3600).setRequired(false))
      .addBooleanOption(o => o.setName('use_ai').setDescription('Let the AI generate a contextual response instead of the static one').setRequired(false))
    )
    .addSubcommand(s => s
      .setName('remove')
      .setDescription('Delete an auto-responder')
      .addIntegerOption(o => o.setName('id').setDescription('The auto-responder ID').setRequired(true).setMinValue(1))
    )
    .addSubcommand(s => s
      .setName('list')
      .setDescription('List all auto-responders in this server')
    )
    .addSubcommand(s => s
      .setName('toggle')
      .setDescription('Enable or disable an auto-responder')
      .addIntegerOption(o => o.setName('id').setDescription('The auto-responder ID').setRequired(true).setMinValue(1))
    )
    .addSubcommand(s => s
      .setName('edit')
      .setDescription('Edit an existing auto-responder')
      .addIntegerOption(o => o.setName('id').setDescription('The auto-responder ID').setRequired(true).setMinValue(1))
      .addStringOption(o => o.setName('trigger').setDescription('New trigger phrase').setRequired(false).setMaxLength(200))
      .addStringOption(o => o.setName('response').setDescription('New response').setRequired(false).setMaxLength(1000))
      .addIntegerOption(o => o.setName('cooldown').setDescription('New cooldown in seconds').setMinValue(0).setMaxValue(3600).setRequired(false))
    ),

  guildOnly: true,
  cooldown: 3000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    try {
      const { AutoResponder } = client.db.models;
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guildId;

      if (sub === 'add') {
        const trigger      = interaction.options.getString('trigger').trim();
        const triggerType  = interaction.options.getString('trigger_type');
        const response     = interaction.options.getString('response').trim();
        const cooldown     = interaction.options.getInteger('cooldown') ?? 0;
        const useAI        = interaction.options.getBoolean('use_ai') ?? false;

        // Validate regex
        if (triggerType === 'regex') {
          try { new RegExp(trigger); }
          catch (e) {
            return interaction.editReply({
              embeds: [buildEmbed({ type: 'error', description: `❌ Invalid regex pattern: ${e.message}` })],
            });
          }
          if (!safeRegex(trigger, { limit: 25 })) {
            return interaction.editReply({
              embeds: [buildEmbed({ type: 'error', description: '❌ Regex pattern rejected: too complex / nested quantifiers (ReDoS guard).' })],
            });
          }
        }

        // Enforce free-tier limit (3 autoresponders). Behavior-preserving:
        // The original `client.i18n?.t ? 3 : 3` was a no-op ternary that always
        // returned 3; we collapse it to a single constant.
        const limit = 3; // Free-tier autoresponder cap
        const count = await AutoResponder.count({ where: { guildId } });
        if (count >= limit) {
          return interaction.editReply({
            embeds: [buildEmbed({
              type: 'warning',
              title: '⛔ Free-tier limit reached',
              description: `You have **${count}/${limit}** auto-responders. Remove one with \`/autoresponder remove\` to add more. Upgrade to Aura Pro for unlimited.`,
            })],
          });
        }

        const row = await AutoResponder.create({ guildId, trigger, triggerType, response, cooldown, useAI });
        await client.redis.del(CACHE_KEY(guildId));

        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'success',
            title: '✅ Auto-Responder Created',
            fields: [
              { name: '🆔 ID',          value: `\`${row.id}\``, inline: true },
              { name: '🎯 Trigger',     value: `\`${trigger.replace(/`/g, '\\`')}\``, inline: true },
              { name: '🔧 Type',        value: triggerType, inline: true },
              { name: '💬 Response',    value: response.slice(0, 200) + (response.length > 200 ? '…' : ''), inline: false },
              { name: '⏱️ Cooldown',    value: cooldown ? `${cooldown}s` : 'none', inline: true },
              { name: '🤖 AI Mode',     value: useAI ? 'Enabled' : 'Disabled', inline: true },
            ],
          })],
        });
      }

      if (sub === 'remove') {
        const id = interaction.options.getInteger('id');
        const deleted = await AutoResponder.destroy({ where: { id, guildId } });
        if (!deleted) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'error', description: `❌ No auto-responder with ID \`${id}\` in this server.` })],
          });
        }
        await client.redis.del(CACHE_KEY(guildId));
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'success', description: `✅ Auto-responder \`${id}\` removed.` })],
        });
      }

      if (sub === 'list') {
        const rows = await AutoResponder.findAll({ where: { guildId }, order: [['id', 'ASC']], limit: 25 });
        if (rows.length === 0) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'info', description: '📭 No auto-responders configured. Use `/autoresponder add` to create one.' })],
          });
        }
        const list = rows.map(r => {
          const trig = String(r.trigger).replace(/`/g, '\\`').slice(0, 40);
          const resp = String(r.response).replace(/\n/g, ' ').slice(0, 60);
          return `**#${r.id}** ${r.enabled ? '🟢' : '🔴'} \`${trig}\` → ${resp}${resp.length >= 60 ? '…' : ''}`;
        }).join('\n');
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'info',
            title: `📋 Auto-Responders (${rows.length})`,
            description: list,
            footer: '🟢 = enabled, 🔴 = disabled',
          })],
        });
      }

      if (sub === 'toggle') {
        const id = interaction.options.getInteger('id');
        const row = await AutoResponder.findOne({ where: { id, guildId } });
        if (!row) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'error', description: `❌ No auto-responder with ID \`${id}\` in this server.` })],
          });
        }
        await row.update({ enabled: !row.enabled });
        await client.redis.del(CACHE_KEY(guildId));
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'success', description: `✅ Auto-responder \`${id}\` is now **${row.enabled ? 'ENABLED' : 'DISABLED'}**.` })],
        });
      }

      if (sub === 'edit') {
        const id = interaction.options.getInteger('id');
        const updates = {};
        const newTrigger   = interaction.options.getString('trigger');
        const newResponse  = interaction.options.getString('response');
        const newCooldown  = interaction.options.getInteger('cooldown');
        if (newTrigger)  updates.trigger  = newTrigger.trim();
        if (newResponse) updates.response = newResponse.trim();
        if (newCooldown !== null) updates.cooldown = newCooldown;

        if (Object.keys(updates).length === 0) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'warning', description: '⚠️ Provide at least one field to update.' })],
          });
        }
        const [affected] = await AutoResponder.update(updates, { where: { id, guildId } });
        if (!affected) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'error', description: `❌ No auto-responder with ID \`${id}\` in this server.` })],
          });
        }
        await client.redis.del(CACHE_KEY(guildId));
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'success', description: `✅ Auto-responder \`${id}\` updated.` })],
        });
      }
    } catch (err) {
      client.logger?.error?.('[AutoResponder] command failed:', err);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: '❌ Failed to process this command.' })],
      }).catch(() => {});
    }
  },
};

export default autoresponder;
