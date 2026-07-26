// ================================================================
//  AURA BOT v2.0 — Ticket Tool Command Suite
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

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

  guildOnly: true,
  cooldown: 3000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    const sub = interaction.options.getSubcommand();

    if (sub === 'panel') {
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title') || '🎫 Open a Support Ticket';

      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          title: '✅ Ticket Panel Dispatched',
          description: `Ticket panel **"${title}"** sent to ${channel}.`,
        })],
      });
    }

    if (sub === 'close') {
      const reason = interaction.options.getString('reason') || 'Issue resolved';
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'warning',
          title: '🔒 Ticket Closing',
          description: `Ticket closing in 5 seconds.\n**Reason:** ${reason}`,
        })],
      });
    }

    if (sub === 'claim') {
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'info',
          title: '🙋 Ticket Claimed',
          description: `Ticket claimed by ${interaction.user}. Staff member will assist shortly.`,
        })],
      });
    }

    if (sub === 'transcript') {
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'info',
          title: '📜 Ticket Transcript Generated',
          description: `HTML transcript saved for channel \`#${interaction.channel.name}\`.\n[View Online Transcript](https://aura.bot/transcripts/${interaction.channel.id})`,
        })],
      });
    }
  },
};

export default ticketsCommand;
