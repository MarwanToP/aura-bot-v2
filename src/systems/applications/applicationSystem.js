import { 
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, 
  ButtonBuilder, ButtonStyle, EmbedBuilder 
} from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';
import logger from '../../utils/logger.js';

export const standardQuestions = [
  { id: 'age', label: 'What is your age?', placeholder: 'e.g. 18', style: TextInputStyle.Short, required: true },
  { id: 'motivation', label: 'Why do you want to join our team?', placeholder: 'Tell us your motivation...', style: TextInputStyle.Paragraph, required: true },
  { id: 'experience', label: 'Previous experience?', placeholder: 'List servers or roles you have held...', style: TextInputStyle.Paragraph, required: true },
  { id: 'commitment', label: 'Weekly commitment?', placeholder: 'e.g. 10-15 hours', style: TextInputStyle.Short, required: true },
  { id: 'why_you', label: 'Why should we choose you?', placeholder: 'What makes you unique?', style: TextInputStyle.Paragraph, required: true },
];

/**
 * Show the application modal to a user
 */
export async function showApplicationModal(interaction) {
  const { ApplicationForm } = interaction.client.db.models;
  const form = await ApplicationForm.findOne({ where: { guildId: interaction.guildId } });

  if (!form || !form.enabled) {
    return interaction.reply({ 
      embeds: [buildEmbed({ type: 'error', description: '❌ Staff applications are currently closed for this server.' })], 
      ephemeral: true 
    });
  }

  const modal = new ModalBuilder()
    .setCustomId(`apply:submit:${interaction.guildId}`)
    .setTitle('Staff Application');

  const questions = form.questions?.length > 0 ? form.questions : standardQuestions;

  // Discord allows max 5 components/ActionRows in a modal
  const rows = questions.slice(0, 5).map(q => {
    return new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId(q.id)
        .setLabel(q.label)
        .setPlaceholder(q.placeholder || '')
        .setStyle(q.style || TextInputStyle.Paragraph)
        .setRequired(q.required ?? true)
    );
  });

  modal.addComponents(...rows);
  await interaction.showModal(modal);
}

/**
 * Handle modal submission
 */
export async function handleModal(client, interaction, data) {
  const { ApplicationForm, StaffApplication } = client.db.models;
  const guildId = interaction.guildId;
  const userId  = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  const form = await ApplicationForm.findOne({ where: { guildId } });
  if (!form) return interaction.editReply('❌ Configuration error.');

  // Check pending
  const existing = await StaffApplication.findOne({ 
    where: { guildId, userId, status: 'pending' } 
  });
  if (existing) {
    return interaction.editReply({ 
      embeds: [buildEmbed({ type: 'warning', description: '⏳ You already have a pending application!' })] 
    });
  }

  // Collect answers
  const answers = {};
  const questions = form.questions?.length > 0 ? form.questions : standardQuestions;
  questions.forEach(q => {
    try {
      answers[q.id] = {
        question: q.label,
        answer: interaction.fields.getTextInputValue(q.id)
      };
    } catch (e) {
      answers[q.id] = { question: q.label, answer: 'N/A' };
    }
  });

  const app = await StaffApplication.create({ guildId, userId, answers });

  // Send to log channel
  const logChId = form.logChannelId || (await client.db.models.GuildSettings.findOne({ where: { guildId } }))?.modLogChannelId;
  const logCh = logChId ? await client.channels.fetch(logChId).catch(() => null) : null;

  if (logCh) {
    const embed = buildEmbed({
      type: 'info',
      title: '📝 New Staff Application',
      description: `**User:** <@${userId}> (${interaction.user.tag})\n**ID:** \`${app.id}\``,
      timestamp: true,
    });

    Object.values(answers).forEach(a => {
      embed.addFields({ name: a.question.slice(0, 256), value: a.answer.slice(0, 1024), inline: false });
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`apply:approve:${app.id}`).setLabel('Approve').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`apply:reject:${app.id}`).setLabel('Reject').setStyle(ButtonStyle.Danger),
    );

    await logCh.send({ embeds: [embed], components: [row] });
  }

  return interaction.editReply({ 
    embeds: [buildEmbed({ type: 'success', description: '✅ Your application has been submitted and will be reviewed shortly!' })] 
  });
}

/**
 * Handle moderator actions (Approve/Reject)
 */
export async function handleButton(client, interaction, data) {
  const [action, appId] = data.split(':');
  const { StaffApplication, ApplicationForm } = client.db.models;

  const app = await StaffApplication.findByPk(appId);
  if (!app) return interaction.reply({ content: '❌ Application not found.', ephemeral: true });
  if (app.status !== 'pending') return interaction.reply({ content: `❌ This application has already been **${app.status}**.`, ephemeral: true });

  const form = await ApplicationForm.findOne({ where: { guildId: interaction.guildId } });
  
  if (action === 'approve') {
    await app.update({ status: 'approved', moderatorId: interaction.user.id });
    
    // Role reward
    if (form?.roleRewardId) {
      const member = await interaction.guild.members.fetch(app.userId).catch(() => null);
      if (member) await member.roles.add(form.roleRewardId).catch(err => logger.debug(`[Apply] Role add failed: ${err.message}`));
    }

    // Notify User
    const user = await client.users.fetch(app.userId).catch(() => null);
    if (user) {
      await user.send({ 
        embeds: [buildEmbed({ type: 'success', title: '🎉 Application Approved!', description: `Congratulations! Your staff application in **${interaction.guild.name}** has been approved.` })] 
      }).catch(() => {});
    }

    await interaction.update({ 
      embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setColor(0x00FF7F).setTitle(`✅ Approved by ${interaction.user.tag}`)],
      components: [] 
    });
  }

  if (action === 'reject') {
    await app.update({ status: 'rejected', moderatorId: interaction.user.id });

    // Notify User
    const user = await client.users.fetch(app.userId).catch(() => null);
    if (user) {
      await user.send({ 
        embeds: [buildEmbed({ type: 'error', title: '❌ Application Rejected', description: `We regret to inform you that your staff application in **${interaction.guild.name}** was rejected.` })] 
      }).catch(() => {});
    }

    await interaction.update({ 
      embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setColor(0xFF4C4C).setTitle(`❌ Rejected by ${interaction.user.tag}`)],
      components: [] 
    });
  }
}
