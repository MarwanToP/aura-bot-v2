// ================================================================
//  AURA BOT v2.0 — Custom Commands System (500 Premium)
// ================================================================

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';
import config         from '../../../config/config.js';

// ─── /customcmd ──────────────────────────────────────────────
export const customcmd = {
  data: new SlashCommandBuilder()
    .setName('customcmd')
    .setNameLocalizations({ ar: 'أمر_مخصص' })
    .setDescription('Manage custom commands')
    .setDescriptionLocalizations({ ar: 'إدارة الأوامر المخصصة' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s
      .setName('add')
      .setDescription('Add a custom command')
      .addStringOption(o => o.setName('name').setDescription('Command name (no spaces)').setRequired(true).setMaxLength(32))
      .addStringOption(o => o.setName('response').setDescription('Bot response (use {user}, {guild}, {count})').setRequired(true))
      .addStringOption(o => o.setName('description').setDescription('Command description'))
      .addBooleanOption(o => o.setName('ai_powered').setDescription('Let AI dynamically generate response (Premium)'))
      .addIntegerOption(o => o.setName('cooldown').setDescription('Cooldown in seconds').setMinValue(0).setMaxValue(86400))
    )
    .addSubcommand(s => s
      .setName('edit')
      .setDescription('Edit a custom command')
      .addStringOption(o => o.setName('name').setDescription('Command name').setRequired(true))
      .addStringOption(o => o.setName('response').setDescription('New response'))
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable'))
    )
    .addSubcommand(s => s
      .setName('delete')
      .setDescription('Delete a custom command')
      .addStringOption(o => o.setName('name').setDescription('Command name').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('list')
      .setDescription('List all custom commands')
      .addIntegerOption(o => o.setName('page').setDescription('Page').setMinValue(1))
    )
    .addSubcommand(s => s
      .setName('info')
      .setDescription('View command details')
      .addStringOption(o => o.setName('name').setDescription('Command name').setRequired(true))
    ),

  userPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly:       true,
  cooldown:        3000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const { CustomCommand } = client.db.models;

    const isPremium = await checkPremium(client, interaction.guildId);
    const limit     = isPremium ? config.limits.premium.customCommands : config.limits.free.customCommands;

    if (sub === 'add') {
      const name     = interaction.options.getString('name').toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const response = interaction.options.getString('response');
      const desc     = interaction.options.getString('description');
      const aiPowered= interaction.options.getBoolean('ai_powered') ?? false;
      const cooldown = interaction.options.getInteger('cooldown') ?? 0;

      if (!name) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Invalid command name. Use only letters, numbers, _, -' })] });

      const count = await CustomCommand.count({ where: { guildId: interaction.guildId } });
      if (count >= limit) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: `⚠️ Custom command limit reached (${limit}). ${!isPremium ? 'Upgrade to Premium for up to 500 commands!' : ''}` })] });
      }

      const existing = await CustomCommand.findOne({ where: { guildId: interaction.guildId, name } });
      if (existing) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ Command \`${name}\` already exists.` })] });

      if (aiPowered && !isPremium) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: '⚠️ AI-powered commands require Premium.' })] });
      }

      await CustomCommand.create({ guildId: interaction.guildId, name, response, description: desc, useAI: aiPowered, cooldown });
      await client.redis.del(`customcmds:${interaction.guildId}`);

      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Custom command \`!${name}\` created!\n**Response:** ${response.slice(0, 200)}\n**AI Powered:** ${aiPowered ? 'Yes ✨' : 'No'}` })] });
    }

    if (sub === 'edit') {
      const name    = interaction.options.getString('name').toLowerCase();
      const cmd     = await CustomCommand.findOne({ where: { guildId: interaction.guildId, name } });
      if (!cmd) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ Command \`${name}\` not found.` })] });

      const updates = {};
      const response = interaction.options.getString('response');
      const enabled  = interaction.options.getBoolean('enabled');
      if (response !== null) updates.response = response;
      if (enabled  !== null) updates.enabled  = enabled;

      await cmd.update(updates);
      await client.redis.del(`customcmds:${interaction.guildId}`);

      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Command \`!${name}\` updated.` })] });
    }

    if (sub === 'delete') {
      const name = interaction.options.getString('name').toLowerCase();
      const del  = await CustomCommand.destroy({ where: { guildId: interaction.guildId, name } });
      await client.redis.del(`customcmds:${interaction.guildId}`);
      return interaction.editReply({ embeds: [buildEmbed({ type: del ? 'success' : 'error', description: del ? `✅ Command \`!${name}\` deleted.` : `❌ Command not found.` })] });
    }

    if (sub === 'list') {
      const page   = (interaction.options.getInteger('page') || 1) - 1;
      const cmds   = await CustomCommand.findAll({
        where:  { guildId: interaction.guildId },
        order:  [['name', 'ASC']],
        limit:  15, offset: page * 15,
      });
      const total = await CustomCommand.count({ where: { guildId: interaction.guildId } });

      if (!cmds.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: '📭 No custom commands.' })] });

      const fields = cmds.map(c => ({
        name:  `!${c.name} ${c.useAI ? '🤖' : ''}${!c.enabled ? '❌' : ''}`,
        value: `${c.description || c.response.slice(0, 80)} • Used: ${c.usageCount}x`,
        inline: false,
      }));

      return interaction.editReply({ embeds: [buildEmbed({ type: 'primary', title: `⚙️ Custom Commands (${total}/${limit})`, fields, footer: `Page ${page + 1} of ${Math.ceil(total / 15)}` })] });
    }

    if (sub === 'info') {
      const name = interaction.options.getString('name').toLowerCase();
      const cmd  = await CustomCommand.findOne({ where: { guildId: interaction.guildId, name } });
      if (!cmd) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ Not found.` })] });

      return interaction.editReply({ embeds: [buildEmbed({
        type:  'primary',
        title: `!${cmd.name}`,
        fields: [
          { name: '📝 Response',    value: cmd.response.slice(0, 500), inline: false },
          { name: '🤖 AI Powered',  value: cmd.useAI ? 'Yes' : 'No',  inline: true },
          { name: '✅ Enabled',     value: cmd.enabled ? 'Yes' : 'No', inline: true },
          { name: '⏱️ Cooldown',   value: `${cmd.cooldown}s`,          inline: true },
          { name: '📊 Usage Count', value: `${cmd.usageCount}x`,       inline: true },
        ],
      })] });
    }
  },
};

// ─── Handle Custom Command Trigger (in messageCreate) ────────
export async function handleCustomCommand(client, message) {
  if (!message.content.startsWith('!') || message.author.bot) return;

  const commandName = message.content.slice(1).split(' ')[0].toLowerCase();
  if (!commandName) return;

  try {
    let cmds = await client.redis.getJSON(`customcmds:${message.guild.id}`);
    if (!cmds) {
      const { CustomCommand } = client.db.models;
      const records = await CustomCommand.findAll({ where: { guildId: message.guild.id, enabled: true } });
      cmds = records.map(r => r.toJSON());
      await client.redis.setJSON(`customcmds:${message.guild.id}`, cmds, 300);
    }

    const cmd = cmds.find(c => c.name === commandName);
    if (!cmd) return;

    // Channel/role checks
    if (cmd.allowedChannels?.length && !cmd.allowedChannels.includes(message.channel.id)) return;
    if (cmd.requiredRoles?.length) {
      const hasRole = cmd.requiredRoles.some(r => message.member.roles.cache.has(r));
      if (!hasRole) return;
    }

    // Cooldown
    if (cmd.cooldown > 0) {
      const coolKey = `cc:cool:${message.guild.id}:${cmd.id}:${message.author.id}`;
      if (await client.redis.get(coolKey)) return;
      await client.redis.setex(coolKey, cmd.cooldown, '1');
    }

    let response = cmd.response
      .replace(/{user}/g,   `<@${message.author.id}>`)
      .replace(/{username}/g, message.author.username)
      .replace(/{guild}/g,  message.guild.name)
      .replace(/{count}/g,  message.guild.memberCount);

    // AI-powered response
    if (cmd.useAI && client.ai.isAvailable()) {
      try {
        const result = await client.ai.generateCommandResponse(message.content, `Custom command: ${cmd.name}. Template: ${cmd.response}`);
        response = result.content;
      } catch {}
    }

    await message.channel.send(response);

    // Increment usage
    const { CustomCommand } = client.db.models;
    await CustomCommand.increment('usageCount', { where: { id: cmd.id } });

  } catch (err) {
    client.logger.debug('[CustomCmd] Error:', err.message);
  }
}

async function checkPremium(client, guildId) {
  try {
    const { GuildSettings } = client.db.models;
    const s = await GuildSettings.findOne({ where: { guildId } });
    return (s?.premiumTier || 0) > 0;
  } catch { return false; }
}

export default customcmd;
