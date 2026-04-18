import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';
import { showApplicationModal } from '../../systems/applications/applicationSystem.js';

export default {
    data: new SlashCommandBuilder()
        .setName('apply')
        .setDescription('Manage or submit staff applications')
        .addSubcommand(sub => 
            sub.setName('submit')
            .setDescription('Submit a staff application for this server')
        )
        .addSubcommand(sub =>
            sub.setName('setup')
            .setDescription('Setup the application system (Admin Only)')
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel where applications are sent').addChannelTypes(ChannelType.GuildText).setRequired(true))
            .addRoleOption(opt => opt.setName('role').setDescription('Role granted automatically upon approval').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('toggle')
            .setDescription('Toggle the application system (Admin Only)')
            .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable or disable the system').setRequired(true))
        ),

    async execute(client, interaction) {
        const sub = interaction.options.getSubcommand();
        const { ApplicationForm } = client.db.models;

        // User submission
        if (sub === 'submit') {
            return showApplicationModal(interaction);
        }

        // Admin check for setup/toggle
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ 
                embeds: [buildEmbed({ type: 'error', description: '❌ You need `Manage Server` permissions to use this command.' })], 
                ephemeral: true 
            });
        }

        if (sub === 'setup') {
            const channel = interaction.options.getChannel('channel');
            const role = interaction.options.getRole('role');

            await ApplicationForm.upsert({
                guildId: interaction.guildId,
                logChannelId: channel.id,
                roleRewardId: role.id,
                enabled: true
            });

            return interaction.reply({ 
                embeds: [buildEmbed({ type: 'success', title: '⚙️ Application Setup', description: `✅ Staff Application system has been configured!\n\n**Log Channel:** <#${channel.id}>\n**Reward Role:** <@&${role.id}>\n\nUsers can now use \`/apply submit\` to start applying.` })]
            });
        }

        if (sub === 'toggle') {
            const enabled = interaction.options.getBoolean('enabled');
            const [form] = await ApplicationForm.findOrCreate({ where: { guildId: interaction.guildId } });
            
            await form.update({ enabled });

            return interaction.reply({ 
                embeds: [buildEmbed({ type: 'info', description: `✅ Staff Application system is now **${enabled ? 'ENABLED' : 'DISABLED'}**.` })]
            });
        }
    }
};
