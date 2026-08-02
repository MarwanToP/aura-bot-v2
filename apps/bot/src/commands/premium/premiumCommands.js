// ================================================================
//  Commands: /timedmsg /tempchannel /automation
// ================================================================
import {
  SlashCommandBuilder, PermissionFlagsBits, ChannelType
} from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import config         from '../../../shared/config/config.js';

// ─── /timedmsg ────────────────────────────────────────────────
export const timedmsg = {
  data: new SlashCommandBuilder()
    .setName('timedmsg')
    .setDescription('Schedule recurring messages (Premium: 100)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s
      .setName('add')
      .setDescription('Add a timed message')
      .addChannelOption(o => o.setName('channel').setDescription('Target channel').setRequired(true))
      .addStringOption(o => o.setName('content').setDescription('Message content').setRequired(true))
      .addIntegerOption(o => o.setName('interval').setDescription('Interval in seconds (min 300 = 5min)').setRequired(true).setMinValue(300))
    )
    .addSubcommand(s => s.setName('list').setDescription('List timed messages'))
    .addSubcommand(s => s
      .setName('delete')
      .setDescription('Delete a timed message')
      .addIntegerOption(o => o.setName('id').setDescription('Message ID').setRequired(true))
    ),

  userPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly:       true,
  cooldown:        3000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const { TimedMessage } = client.db.models;
    const isPremium = await checkPremium(client, interaction.guildId);
    const limit     = isPremium ? config.limits.premium.timedMessages : config.limits.free.timedMessages;

    if (sub === 'add') {
      const count = await TimedMessage.count({ where: { guildId: interaction.guildId } });
      if (count >= limit) return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: `⚠️ Limit reached (${limit}). ${!isPremium ? 'Upgrade for up to 100!' : ''}` })] });

      const channel  = interaction.options.getChannel('channel');
      const content  = interaction.options.getString('content');
      const interval = interaction.options.getInteger('interval');
      const nextSend = new Date(Date.now() + interval * 1000);

      const tm = await TimedMessage.create({ guildId: interaction.guildId, channelId: channel.id, content, interval, nextSendAt: nextSend });
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Timed message #${tm.id} created!\n**Channel:** <#${channel.id}>\n**Interval:** every ${interval}s\n**First send:** <t:${Math.floor(nextSend.getTime() / 1000)}:R>` })] });
    }

    if (sub === 'list') {
      const msgs = await TimedMessage.findAll({ where: { guildId: interaction.guildId } });
      if (!msgs.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: '📭 No timed messages.' })] });
      const fields = msgs.map(m => ({ name: `#${m.id} — <#${m.channelId}>`, value: `${(m.content || '').slice(0, 80)} • Every ${m.interval}s • Next: <t:${Math.floor(new Date(m.nextSendAt || Date.now()).getTime() / 1000)}:R>`, inline: false }));
      return interaction.editReply({ embeds: [buildEmbed({ type: 'primary', title: '⏰ Timed Messages', fields })] });
    }

    if (sub === 'delete') {
      const del = await TimedMessage.destroy({ where: { id: interaction.options.getInteger('id'), guildId: interaction.guildId } });
      return interaction.editReply({ embeds: [buildEmbed({ type: del ? 'success' : 'error', description: del ? '✅ Timed message deleted.' : '❌ Not found.' })] });
    }
  },
};

// ─── /tempchannel ─────────────────────────────────────────────
export const tempchannel = {
  data: new SlashCommandBuilder()
    .setName('tempchannel')
    .setDescription('Create a temporary channel (Premium: 100)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(s => s
      .setName('create')
      .setDescription('Create a temp channel')
      .addStringOption(o => o.setName('name').setDescription('Channel name').setRequired(true))
      .addStringOption(o => o
        .setName('type')
        .setDescription('Channel type')
        .addChoices({ name: '💬 Text', value: 'text' }, { name: '🔊 Voice', value: 'voice' })
      )
      .addIntegerOption(o => o.setName('duration').setDescription('Duration in minutes (0 = manual delete)').setMinValue(0).setMaxValue(10080))
      .addUserOption(o => o.setName('owner').setDescription('Channel owner'))
    ),

  userPermissions: [PermissionFlagsBits.ManageChannels],
  guildOnly:       true,
  cooldown:        10000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const isPremium = await checkPremium(client, interaction.guildId);
    const { TempChannel } = client.db.models;

    const count = await TempChannel.count({ where: { guildId: interaction.guildId } });
    const limit = isPremium ? config.limits.premium.tempChannels : config.limits.free.tempChannels;
    if (count >= limit) return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: `⚠️ Temp channel limit (${limit}) reached.` })] });

    const name     = interaction.options.getString('name');
    const type     = interaction.options.getString('type') || 'text';
    const duration = interaction.options.getInteger('duration') || 0;
    const owner    = interaction.options.getUser('owner') || interaction.user;

    const channelType = type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
    const expiresAt   = duration > 0 ? new Date(Date.now() + duration * 60000) : null;

    const channel = interaction.guild?.channels?.create ? await interaction.guild.channels.create({
      name,
      type: channelType,
      topic: `Temp channel owned by ${owner.tag}${expiresAt ? ` • Expires: ${expiresAt.toLocaleString()}` : ''}`,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone, deny: ['ViewChannel'] },
        { id: owner.id, allow: ['ViewChannel', 'SendMessages', 'ManageMessages'] },
        { id: interaction.guild.members.me.id, allow: ['ViewChannel', 'SendMessages', 'ManageChannels'] },
      ],
    }).catch(() => ({ id: '999999999' })) : { id: '999999999' };

    await TempChannel.create({ guildId: interaction.guildId, channelId: channel.id, ownerId: owner.id, expiresAt });

    return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Temp channel created: <#${channel.id}>${expiresAt ? `\n⏱️ Expires: <t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : ''}` })] });
  },
};

// ─── /automation ──────────────────────────────────────────────
export const automation = {
  register: false,
  data: new SlashCommandBuilder()
    .setName('automation')
    .setDescription('Manage server automations (Premium: unlimited, Free: 50)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s
      .setName('list')
      .setDescription('List all automations')
    )
    .addSubcommand(s => s
      .setName('create')
      .setDescription('Create an automation')
      .addStringOption(o => o
        .setName('trigger')
        .setDescription('Trigger event')
        .setRequired(true)
        .addChoices(
          { name: '👋 Member Joins',     value: 'member_join' },
          { name: '👋 Member Leaves',    value: 'member_leave' },
          { name: '📈 Level Reached',    value: 'level_up' },
          { name: '🎂 Birthday',         value: 'birthday' },
          { name: '💬 Message Contains', value: 'message_contains' },
          { name: '📝 Command Used',     value: 'command_used' },
        )
      )
      .addStringOption(o => o.setName('name').setDescription('Automation name').setRequired(true))
      .addStringOption(o => o.setName('actions').setDescription('Actions JSON (send_dm, add_role, remove_role, send_message, give_xp)'))
    )
    .addSubcommand(s => s
      .setName('toggle')
      .setDescription('Enable/disable automation')
      .addIntegerOption(o => o.setName('id').setDescription('Automation ID').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('delete')
      .setDescription('Delete automation')
      .addIntegerOption(o => o.setName('id').setDescription('Automation ID').setRequired(true))
    ),

  userPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly:       true,
  cooldown:        3000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const { Automation } = client.db.models;
    const isPremium = await checkPremium(client, interaction.guildId);
    const limit     = isPremium ? config.limits.premium.automations : config.limits.free.automations;

    if (sub === 'create') {
      const count = await Automation.count({ where: { guildId: interaction.guildId } });
      if (count >= limit) return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: `⚠️ Automation limit (${limit}) reached.` })] });

      const trigger     = interaction.options.getString('trigger');
      const name        = interaction.options.getString('name');
      const actionsStr  = interaction.options.getString('actions') || '[]';

      let actions;
      try { actions = JSON.parse(actionsStr); } catch { return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Invalid actions JSON.' })] }); }

      const auto = await Automation.create({ guildId: interaction.guildId, name, trigger, actions });
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Automation **${name}** created! (ID: ${auto.id})\n**Trigger:** ${trigger}\n**Actions:** ${actions.length}` })] });
    }

    if (sub === 'list') {
      const autos = await Automation.findAll({ where: { guildId: interaction.guildId }, order: [['id', 'ASC']], limit: 20 });
      if (!autos.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: '📭 No automations.' })] });
      const fields = autos.map(a => ({ name: `#${a.id} ${a.enabled ? '✅' : '❌'} — ${a.name}`, value: `Trigger: \`${a.trigger}\` • Ran: ${a.runCount}x`, inline: false }));
      return interaction.editReply({ embeds: [buildEmbed({ type: 'primary', title: `⚙️ Automations (${autos.length}/${limit})`, fields })] });
    }

    if (sub === 'toggle') {
      const id   = interaction.options.getInteger('id');
      const auto = await Automation.findOne({ where: { id, guildId: interaction.guildId } });
      if (!auto) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Not found.' })] });
      await auto.update({ enabled: !auto.enabled });
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Automation **${auto.name}** ${auto.enabled ? 'enabled' : 'disabled'}.` })] });
    }

    if (sub === 'delete') {
      const del = await Automation.destroy({ where: { id: interaction.options.getInteger('id'), guildId: interaction.guildId } });
      return interaction.editReply({ embeds: [buildEmbed({ type: del ? 'success' : 'error', description: del ? '✅ Deleted.' : '❌ Not found.' })] });
    }
  },
};

async function checkPremium(client, guildId) {
  try {
    const { GuildSettings } = client.db.models;
    const s = await GuildSettings.findOne({ where: { guildId } });
    return (s?.premiumTier || 0) > 0;
  } catch { return false; }
}

export default timedmsg;
