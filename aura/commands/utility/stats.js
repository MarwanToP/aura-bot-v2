// ================================================================
//  AURA BOT v2.0 — Server Stats Counter Channels
//  Exposes the existing updateStatsChannels background task via slash
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import { updateStatsChannels } from '../../../shared/systems/backgroundTasks.js';

export const stats = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Configure live server stats counter channels (👥 Members, 🟢 Online, 🤖 Bots)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s
      .setName('enable')
      .setDescription('Enable stats counter channels for this server')
    )
    .addSubcommand(s => s
      .setName('disable')
      .setDescription('Disable stats counter channels (keeps channel assignments)')
    )
    .addSubcommand(s => s
      .setName('set')
      .setDescription('Set the counter channels')
      .addChannelOption(o => o.setName('members').setDescription('Channel that will display member count').addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice))
      .addChannelOption(o => o.setName('online').setDescription('Channel that will display online count').addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice))
      .addChannelOption(o => o.setName('bots').setDescription('Channel that will display bot count').addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice))
    )
    .addSubcommand(s => s
      .setName('view')
      .setDescription('View current stats configuration and live counts')
    )
    .addSubcommand(s => s
      .setName('refresh')
      .setDescription('Manually trigger a stats update (useful after setup)')
    ),

  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    await interaction.deferReply().catch(() => {});

    try {
      const { GuildSettings } = client.db.models;
      const sub = interaction.options.getSubcommand();

      if (sub === 'enable') {
        const settings = await GuildSettings.findOne({ where: { guildId: interaction.guildId } });
        if (!settings?.statsMemberChannelId && !settings?.statsOnlineChannelId && !settings?.statsBotChannelId) {
          return interaction.editReply({
            embeds: [buildEmbed({
              type: 'warning',
              title: '⚠️ No channels configured',
              description: 'Use `/stats set` first to choose which voice channels will display the counters, then run `/stats enable` again.',
            })],
          });
        }
        await GuildSettings.update({ statsEnabled: true }, { where: { guildId: interaction.guildId } });
        // Run immediately so the user sees results
        await updateStatsChannels(client).catch(() => {});
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'success',
            title: '✅ Stats Enabled',
            description: 'Counter channels will refresh every 10 minutes. You can force a refresh with `/stats refresh`.',
          })],
        });
      }

      if (sub === 'disable') {
        await GuildSettings.update({ statsEnabled: false }, { where: { guildId: interaction.guildId } });
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'info',
            title: '🛑 Stats Disabled',
            description: 'Counter channels are no longer being updated. Your channel assignments are preserved — run `/stats enable` to turn them back on.',
          })],
        });
      }

      if (sub === 'set') {
        const membersCh = interaction.options.getChannel('members');
        const onlineCh  = interaction.options.getChannel('online');
        const botsCh    = interaction.options.getChannel('bots');

        if (!membersCh && !onlineCh && !botsCh) {
          return interaction.editReply({
            embeds: [buildEmbed({
              type: 'warning',
              description: '⚠️ Provide at least one channel option.',
            })],
          });
        }

        const updates = {};
        if (membersCh) updates.statsMemberChannelId = membersCh.id;
        if (onlineCh)  updates.statsOnlineChannelId  = onlineCh.id;
        if (botsCh)    updates.statsBotChannelId    = botsCh.id;

        await GuildSettings.update(updates, { where: { guildId: interaction.guildId } });

        const setFields = [];
        if (membersCh) setFields.push({ name: '👥 Members', value: `<#${membersCh.id}>`, inline: true });
        if (onlineCh)  setFields.push({ name: '🟢 Online',  value: `<#${onlineCh.id}>`,  inline: true });
        if (botsCh)    setFields.push({ name: '🤖 Bots',    value: `<#${botsCh.id}>`,    inline: true });

        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'success',
            title: '✅ Counter Channels Set',
            description: 'Tip: Create empty voice channels in the category of your choice, then use those here. Run `/stats enable` to start updating them.',
            fields: setFields,
          })],
        });
      }

      if (sub === 'view') {
        const settings = await GuildSettings.findOne({ where: { guildId: interaction.guildId } });
        const guild    = interaction.guild;
        const members  = guild?.memberCount ?? 0;
        const online   = guild?.members?.cache?.filter(m => m.presence?.status && m.presence.status !== 'offline' && !m.user.bot).size ?? 0;
        const bots     = guild?.members?.cache?.filter(m => m.user.bot).size ?? 0;

        const fields = [
          { name: '📊 Status',   value: settings?.statsEnabled ? '✅ Enabled' : '🛑 Disabled', inline: true },
          { name: '👥 Members',  value: `${members.toLocaleString()} live`, inline: true },
          { name: '🟢 Online',   value: `${online.toLocaleString()} humans online`, inline: true },
          { name: '🤖 Bots',     value: `${bots.toLocaleString()} bots`, inline: true },
          { name: '🔗 Channels', value: [
              settings?.statsMemberChannelId ? `Members → <#${settings.statsMemberChannelId}>` : 'Members → not set',
              settings?.statsOnlineChannelId  ? `Online → <#${settings.statsOnlineChannelId}>`   : 'Online → not set',
              settings?.statsBotChannelId     ? `Bots → <#${settings.statsBotChannelId}>`        : 'Bots → not set',
            ].join('\n'), inline: false },
        ];

        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'info',
            title: '📊 Server Stats Configuration',
            fields,
          })],
        });
      }

      if (sub === 'refresh') {
        const settings = await GuildSettings.findOne({ where: { guildId: interaction.guildId } });
        if (!settings?.statsEnabled) {
          // Temporarily enable for the run, but do NOT persist
          await GuildSettings.update({ statsEnabled: true }, { where: { guildId: interaction.guildId } });
        }
        await updateStatsChannels(client).catch(() => {});
        if (!settings?.statsEnabled) {
          await GuildSettings.update({ statsEnabled: false }, { where: { guildId: interaction.guildId } });
        }
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'success',
            description: '🔄 Stats refreshed. Check the configured counter channels.',
          })],
        });
      }
    } catch (err) {
      client.logger?.error?.('[Stats] command failed:', err);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: '❌ Failed to process the stats command.' })],
      }).catch(() => {});
    }
  },
};

export default stats;
