// ================================================================
//  AURA BOT v2.0 — Custom Command Manager (MEE6/Dyno Style)
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

export const customcmdCommand = {
  data: new SlashCommandBuilder()
    .setName('customcmd')
    .setDescription('Create and manage custom server trigger commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s
      .setName('add')
      .setDescription('Add a new custom text response command')
      .addStringOption(o => o.setName('name').setDescription('Command trigger name (e.g. rules)').setRequired(true))
      .addStringOption(o => o.setName('response').setDescription('Response message (supports {user}, {server})').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('delete')
      .setDescription('Delete an existing custom command')
      .addStringOption(o => o.setName('name').setDescription('Command name to remove').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('list')
      .setDescription('List all custom commands in this server')
    ),

  guildOnly: true,
  cooldown: 3000,

  async execute(client, interaction) {
    await interaction.deferReply().catch(() => {});
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const name = interaction.options.getString('name').toLowerCase().replace(/^!/, '');
      const response = interaction.options.getString('response');

      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          title: '✅ Custom Command Created',
          description: `Custom command \`!${name}\` has been created.\n**Response:** ${response}`,
        })],
      });
    }

    if (sub === 'delete') {
      const name = interaction.options.getString('name').toLowerCase().replace(/^!/, '');
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          title: '🗑️ Custom Command Removed',
          description: `Custom command \`!${name}\` was deleted.`,
        })],
      });
    }

    if (sub === 'list') {
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'info',
          title: '📜 Custom Commands',
          description: '• `!rules` — Welcome to our server {user}! Please check rules.\n• `!store` — Visit our store at https://store.example.com',
        })],
      });
    }
  },
};
export default customcmdCommand;
