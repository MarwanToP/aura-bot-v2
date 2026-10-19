// ================================================================
//  AURA BOT v2.0 — Ticket Tool Command Suite
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import { sendTicketPanel, closeTicket, claimTicket } from '../../../../../packages/systems/tickets/ticketSystem.js';
import discordTranscripts from 'discord-html-transcripts';

export const ticketsCommand = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Multi-panel support ticket system (TicketTool style)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(s => s
      .setName('panel')
      .setDescription('Create a ticket creation panel in a channel')
      .addChannelOption(o => o.setName('channel').setDescription('Channel to send panel to').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName('title').setDescription('Panel title').setRequired(false))
    )
    .addSubcommand(s => s
      .setName('close')
      .setDescription('Close the current ticket channel')
      .addStringOption(o => o.setName('reason').setDescription('Reason for closing ticket').setRequired(false))
    )
    .addSubcommand(s => s
      .setName('claim')
      .setDescription('Claim support ticket as a staff member')
    )
    .addSubcommand(s => s
      .setName('transcript')
      .setDescription('Generate HTML/Text transcript of current ticket')
    ),

  botPermissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  cooldown: 3000,

  async execute(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
    const sub = interaction.options.getSubcommand();

    if (sub === 'panel') {
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title') || '🎫 Open a Support Ticket';

      try {
        await sendTicketPanel(client, channel);
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'success',
            title: '✅ Ticket Panel Dispatched',
            description: `Ticket panel **"${title}"** posted successfully in ${channel}.`,
          })],
        });
      } catch (err) {
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'error',
            description: `❌ Failed to dispatch ticket panel: ${err.message}`,
          })],
        });
      }
    }

    if (sub === 'close') {
      const reason = interaction.options.getString('reason') || 'Issue resolved';
      const channelName = interaction.channel.name;

      if (!channelName.includes('tkt-') && !channelName.includes('ticket-')) {
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'warning',
            description: '⚠️ This command can only be run inside an active ticket channel.',
          })],
        });
      }

      try {
        const ticketId = channelName.split('-')[0].toUpperCase();
        const res = await closeTicket(client, ticketId, interaction.guildId, interaction.user);
        if (res.error) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'error', description: `❌ ${res.error}` })],
          });
        }

        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'warning',
            title: '🔒 Ticket Closing',
            description: `Ticket **${ticketId}** closed.\n**Reason:** ${reason}`,
          })],
        });
      } catch (err) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: `❌ ${err.message}` })],
        });
      }
    }

    if (sub === 'claim') {
      const channelName = interaction.channel.name;
      if (!channelName.includes('tkt-') && !channelName.includes('ticket-')) {
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'warning',
            description: '⚠️ This command can only be run inside an active ticket channel.',
          })],
        });
      }

      const ticketId = channelName.split('-')[0].toUpperCase();
      const res = await claimTicket(client, ticketId, interaction.guildId, interaction.user);

      if (res.error) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: `❌ ${res.error}` })],
        });
      }

      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          title: '🙋 Ticket Claimed',
          description: `Ticket **${ticketId}** claimed by ${interaction.user}. Staff member will assist shortly.`,
        })],
      });
    }

    if (sub === 'transcript') {
      try {
        const attachment = await discordTranscripts.createTranscript(interaction.channel, {
          limit: -1,
          fileName: `${interaction.channel.name}-transcript.html`,
          returnType: 'attachment',
          poweredBy: false,
        });

        await interaction.user.send({
          content: `📜 Transcript for ticket channel **#${interaction.channel.name}** in **${interaction.guild.name}**:`,
          files: [attachment],
        }).catch(() => {});

        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'success',
            title: '📜 Ticket Transcript Generated',
            description: `HTML transcript generated and sent to your Direct Messages.\nChannel: \`#${interaction.channel.name}\``,
          })],
        });
      } catch (err) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: `❌ Failed to generate transcript: ${err.message}` })],
        });
      }
    }
  },
};

export default ticketsCommand;
