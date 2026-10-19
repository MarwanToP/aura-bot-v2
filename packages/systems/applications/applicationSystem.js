import {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
  ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags
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

// Discord modals allow a maximum of 5 inputs
export const MAX_QUESTIONS = 5;

// Dashboard stores style as 'short' | 'paragraph'; legacy rows use discord.js enums
const resolveStyle = (style) =>
  typeof style === 'number' ? style : style === 'short' ? TextInputStyle.Short : TextInputStyle.Paragraph;

/**
 * Normalize a form's question list to safe Discord limits.
 * Used by both the modal builder and the submission collector so ids always match.
 */
function normalizeQuestions(form) {
  const raw = Array.isArray(form.questions) ? form.questions.filter(q => q && typeof q === 'object') : [];
  const source = raw.length > 0 ? raw : standardQuestions;
  const usedIds = new Set();
  return source.slice(0, MAX_QUESTIONS).map((q, i) => {
    const base = String(q.id || `q${i + 1}`).slice(0, 86);
    let id = base;
    let n = 2;
    while (usedIds.has(id)) id = `${base}_${n++}`.slice(0, 90);
    usedIds.add(id);
    return {
      id,
      label:       String(q.label || `Question ${i + 1}`).slice(0, 45),
      placeholder: String(q.placeholder || '').slice(0, 100),
      style:       resolveStyle(q.style),
      required:    q.required !== false,
    };
  });
}

/** Resolve the interaction member with roles cache (falls back to fetch). */
async function getMember(interaction) {
  if (interaction.member?.roles?.cache) return interaction.member;
  return interaction.guild.members.fetch(interaction.user.id).catch(() => null);
}

/**
 * Find the form to use: by id, by (case-insensitive) name, or the first enabled form.
 */
export async function resolveForm(client, guildId, formRef = null) {
  const { ApplicationForm } = client.db.models;

  if (formRef) {
    const byId = await ApplicationForm.findOne({ where: { guildId, id: formRef } }).catch(() => null);
    if (byId) return byId;

    try {
      const { Op } = client.db;
      return await ApplicationForm.findOne({ where: { guildId, name: { [Op.iLike]: formRef } } });
    } catch {
      return ApplicationForm.findOne({ where: { guildId, name: formRef } });
    }
  }

  return ApplicationForm.findOne({ where: { guildId, enabled: true }, order: [['createdAt', 'ASC']] });
}

/**
 * Show the application modal to a user.
 * NOTE: must be called as the FIRST response to the interaction (no defer before).
 */
export async function showApplicationModal(interaction, formRef = null) {
  const form = await resolveForm(interaction.client, interaction.guildId, formRef)
    .catch(err => { logger.error(`[Apply] Form lookup failed: ${err.message}`); return null; });

  if (!form) {
    return interaction.reply({
      embeds: [buildEmbed({ type: 'error', description: '❌ Applications are currently closed for this server.' })],
      ephemeral: true,
    });
  }

  if (!form.enabled) {
    return interaction.reply({
      embeds: [buildEmbed({ type: 'error', description: `❌ The **${form.name || 'requested'}** form is currently closed.` })],
      ephemeral: true,
    });
  }

  // Required-role gate (e.g. must be a Member before applying for staff)
  if (form.requiredRoleId) {
    const member = await getMember(interaction);
    if (!member?.roles?.cache?.has(form.requiredRoleId)) {
      return interaction.reply({
        embeds: [buildEmbed({ type: 'error', description: `❌ You need the <@&${form.requiredRoleId}> role to apply for this position.` })],
        ephemeral: true,
      });
    }
  }

  const modal = new ModalBuilder()
    .setCustomId(`apply:submit:${form.id}`)
    .setTitle(String(form.name || 'Application').slice(0, 45));

  const rows = normalizeQuestions(form).map(q =>
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId(q.id)
        .setLabel(q.label)
        .setPlaceholder(q.placeholder)
        .setStyle(q.style)
        .setRequired(q.required)
    )
  );

  modal.addComponents(...rows);
  await interaction.showModal(modal);
}

/**
 * Handle modal submission
 */
export async function handleModal(client, interaction, data) {
  const { ApplicationForm, StaffApplication, GuildSettings } = client.db.models;
  const guildId = interaction.guildId;
  const userId  = interaction.user.id;

  // customId is apply:submit:<formId>; interactionCreate passes "submit:<formId>"
  const formId = (data || '').split(':')[1] || null;

  await interaction.deferReply({ ephemeral: true });

  const form = formId
    ? await ApplicationForm.findOne({ where: { id: formId, guildId } }).catch(() => null)
    : await ApplicationForm.findOne({ where: { guildId, enabled: true } }).catch(() => null);
  if (!form) return interaction.editReply('❌ Configuration error.');

  // Re-validate on submit — the form may have changed while the modal was open
  if (!form.enabled) {
    return interaction.editReply({
      embeds: [buildEmbed({ type: 'error', description: '❌ This application form was closed before your submission went through.' })],
    });
  }
  if (form.requiredRoleId) {
    const submitter = await getMember(interaction);
    if (!submitter?.roles?.cache?.has(form.requiredRoleId)) {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: `❌ You no longer have the <@&${form.requiredRoleId}> role required to apply.` })],
      });
    }
  }

  // Check cooldown & pending (scoped to this form)
  const lastApp = await StaffApplication.findOne({
    where: { guildId, userId, formId: form.id },
    order: [['createdAt', 'DESC']],
  });

  if (lastApp) {
    if (lastApp.status === 'pending') {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'warning', description: '⏳ You already have a pending application for this form!' })],
      });
    }

    const cooldownMs = (Number(form.cooldown) || 0) * 1000;
    const elapsed = Date.now() - new Date(lastApp.createdAt).getTime();
    if (cooldownMs > 0 && elapsed < cooldownMs) {
      const remainingHours = ((cooldownMs - elapsed) / 3600000).toFixed(1);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'warning', description: `⏳ You are on cooldown! Please wait **${remainingHours}** hours before applying again.` })],
      });
    }
  }

  // Collect answers
  const answers = {};
  normalizeQuestions(form).forEach(q => {
    try {
      answers[q.id] = {
        question: q.label,
        answer: interaction.fields.getTextInputValue(q.id),
      };
    } catch {
      answers[q.id] = { question: q.label, answer: 'N/A' };
    }
  });

  const app = await StaffApplication.create({ guildId, userId, formId: form.id, answers });

  // Send to log channel
  const settings = form.logChannelId ? null : await GuildSettings?.findOne({ where: { guildId } }).catch(() => null);
  const logChId = form.logChannelId || settings?.modLogChannelId;
  const logCh = logChId ? await client.channels.fetch(logChId).catch(() => null) : null;

  if (logCh) {
    const embed = buildEmbed({
      type: 'info',
      title: `📝 New Application — ${form.name || 'Staff'}`,
      description: `**User:** <@${userId}> (${interaction.user.tag})\n**ID:** \`${app.id}\``,
      timestamp: true,
    });

    Object.values(answers).forEach(a => {
      embed.addFields({ name: a.question.slice(0, 256), value: (a.answer || 'N/A').slice(0, 1024), inline: false });
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`apply:approve:${app.id}`).setLabel('Approve').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`apply:reject:${app.id}`).setLabel('Reject').setStyle(ButtonStyle.Danger),
    );

    const payload = { embeds: [embed], components: [row] };
    if (form.pingRoleId) {
      payload.content = `<@&${form.pingRoleId}>`;
      payload.allowedMentions = { roles: [form.pingRoleId] };
    }

    const perms = logCh.permissionsFor(interaction.guild.members.me);
    if (perms?.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
      const sent = await logCh.send(payload).catch(err => {
        logger.error(`[Apply] Send failed: ${err.message}`);
        return null;
      });
      if (sent?.id) {
        await app.update({ logChannelId: logCh.id, logMessageId: sent.id }).catch(() => {});
      }
    } else {
      logger.warn(`[Apply] Missing permissions in log channel ${logCh.id} for guild ${guildId}`);
    }
  }

  return interaction.editReply({
    embeds: [buildEmbed({ type: 'success', description: '✅ Your application has been submitted and will be reviewed shortly!' })],
  });
}

/**
 * Handle moderator actions (Approve/Reject)
 */
export async function handleButton(client, interaction, data) {
  try {
    // Acknowledge the click before the slower work (DB lookups, role ops, DMs, message edit)
    await interaction.deferUpdate();

    const [action, appId] = (data || '').split(':');
    const { StaffApplication, ApplicationForm } = client.db.models;

    const app = await StaffApplication.findOne({ where: { id: appId, guildId: interaction.guildId } }).catch(() => null);
    if (!app) return interaction.followUp({ content: '❌ Application not found.', flags: MessageFlags.Ephemeral });
    if (app.status !== 'pending') return interaction.followUp({ content: `❌ This application has already been **${app.status}**.`, flags: MessageFlags.Ephemeral });

    // Guild-scoped form lookup — if it can't be resolved, only Manage Server may review and role automation is skipped.
    const form = app.formId
      ? await ApplicationForm.findOne({ where: { id: app.formId, guildId: interaction.guildId } }).catch(() => null)
      : null;

    // Reviewer gate — fail-closed: only the designated manager role (or Manage Server) may review
    const reviewer = await getMember(interaction);
    const isManager = !!form?.managerRoleId && reviewer?.roles?.cache?.has(form.managerRoleId);
    if (!isManager && !interaction.memberPermissions?.has('ManageGuild')) {
      return interaction.followUp({ content: '❌ Only designated reviewers (or Manage Server) can handle this application.', flags: MessageFlags.Ephemeral });
    }

    const member = await interaction.guild.members.fetch(app.userId).catch(() => null);
    const me = interaction.guild.members.me;
    const roleIssues = [];

    const canManageRole = (role) =>
      member && role && me?.permissions.has('ManageRoles') && me.roles.highest.position > role.position;

    const addRole = async (roleId, label) => {
      if (!roleId) return;
      if (!member) { roleIssues.push('applicant is no longer in the server'); return; }
      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) { roleIssues.push(`the ${label} role no longer exists`); return; }
      if (!canManageRole(role)) {
        logger.warn(`[Apply] Cannot add ${label} role ${role.name}: hierarchy or permission issue.`);
        roleIssues.push(`couldn't add ${role.name} (check my role position)`);
        return;
      }
      await member.roles.add(role).catch(err => {
        logger.warn(`[Apply] ${label} add failed: ${err.message}`);
        roleIssues.push(`couldn't add ${role.name}`);
      });
    };

    const removeRole = async (roleId, label) => {
      if (!roleId || !member) return;
      const role = interaction.guild.roles.cache.get(roleId);
      if (role) {
        await member.roles.remove(role).catch(err => {
          logger.warn(`[Apply] ${label} remove failed: ${err.message}`);
          roleIssues.push(`couldn't remove ${role.name}`);
        });
      }
    };

    // Atomic claim — only the first reviewer to click wins the race
    const claimReview = async (status) => {
      const [affected] = await StaffApplication.update(
        { status, moderatorId: interaction.user.id, reviewedAt: new Date() },
        { where: { id: app.id, guildId: interaction.guildId, status: 'pending' } },
      );
      return affected > 0;
    };

    const editReviewMessage = async (color, title) => {
      const base = interaction.message.embeds?.[0];
      const embed = base
        ? EmbedBuilder.from(base).setColor(color).setTitle(title)
        : buildEmbed({ type: color === 0x00FF7F ? 'success' : 'error', title });
      await interaction.editReply({ embeds: [embed], components: [] })
        .catch(err => logger.warn(`[Apply] Review message update failed: ${err.message}`));
    };

    const formName = form?.name || 'staff';
    const user = await client.users.fetch(app.userId).catch(() => null);

    if (action === 'approve') {
      if (!(await claimReview('approved'))) {
        return interaction.followUp({ content: '❌ This application was already reviewed by someone else.', flags: MessageFlags.Ephemeral });
      }

      await addRole(form?.roleRewardId, 'reward');
      await removeRole(form?.removeRoleId, 'applicant');

      if (user) {
        await user.send({
          embeds: [buildEmbed({ type: 'success', title: '🎉 Application Approved!', description: `Congratulations! Your application for **${formName}** in **${interaction.guild.name}** has been approved.` })],
        }).catch(() => {});
      }

      await editReviewMessage(0x00FF7F, `✅ Approved by ${interaction.user.tag}`);

      if (roleIssues.length > 0) {
        await interaction.followUp({ content: `⚠️ Approved, but: ${roleIssues.join(' · ')}`, flags: MessageFlags.Ephemeral }).catch(() => {});
      }
      return;
    }

    if (action === 'reject') {
      if (!(await claimReview('rejected'))) {
        return interaction.followUp({ content: '❌ This application was already reviewed by someone else.', flags: MessageFlags.Ephemeral });
      }

      await addRole(form?.denyRoleId, 'denial');

      if (user) {
        await user.send({
          embeds: [buildEmbed({ type: 'error', title: '❌ Application Rejected', description: `We regret to inform you that your application for **${formName}** in **${interaction.guild.name}** was rejected.` })],
        }).catch(() => {});
      }

      await editReviewMessage(0xFF4C4C, `❌ Rejected by ${interaction.user.tag}`);

      if (roleIssues.length > 0) {
        await interaction.followUp({ content: `⚠️ Rejected, but: ${roleIssues.join(' · ')}`, flags: MessageFlags.Ephemeral }).catch(() => {});
      }
      return;
    }

    return interaction.followUp({ content: '❌ Unrecognised review action.', flags: MessageFlags.Ephemeral });
  } catch (err) {
    logger.error('[Apply] Review button handler failed:', err);
    throw err; // let the interaction router emit its ephemeral fallback, as before
  }
}
