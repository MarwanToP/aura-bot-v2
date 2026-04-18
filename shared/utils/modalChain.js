// ================================================================
//  AURA BOT v2.0 — Infinite Modal Utility
// ================================================================
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

/**
 * Chains multiple modals together for long forms (Discord max = 5 slots)
 */
export async function sendModalStep(interaction, { title, customId, questions, step = 0, totalSteps = 1 }) {
  const modal = new ModalBuilder()
    .setCustomId(`${customId}:${step}`)
    .setTitle(`${title} (${step + 1}/${totalSteps})`);

  // Max 5 questions per modal
  const stepSize = 5;
  const start    = step * stepSize;
  const end      = Math.min(start + stepSize, questions.length);
  const currentQ = questions.slice(start, end);

  const rows = currentQ.map((q, idx) => {
    const input = new TextInputBuilder()
      .setCustomId(`field_${start + idx}`)
      .setLabel(q.label || `Question ${start + idx + 1}`)
      .setStyle(q.multiline ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(q.required !== false)
      .setPlaceholder(q.placeholder || '');

    return new ActionRowBuilder().addComponents(input);
  });

  modal.addComponents(rows);
  await interaction.showModal(modal);
}

/**
 * Maps the modal submission to a state and decides if a next step is needed
 */
export function getModalResults(interaction) {
  const results = {};
  interaction.fields.fields.forEach((val, key) => {
    results[key] = val.value;
  });
  return results;
}
