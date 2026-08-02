// ================================================================
//  AURA BOT v2.0 — Verify Button Event
//  Handles the /verify captcha flow when a user clicks the verify button
// ================================================================
import { buildEmbed } from '../../shared/utils/embedBuilder.js';

function makeCaptcha() {
  const a = Math.floor(Math.random() * 9) + 2; // 2..10 (avoid 0/1)
  const b = Math.floor(Math.random() * 9) + 2;
  return { question: `${a} + ${b}`, answer: a + b };
}

export default {
  name: 'interactionCreate',
  async execute(client, interaction) {
    if (!interaction.isButton() || interaction.customId !== 'verify_button') return;

    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    try {
      const { GuildSettings } = client.db.models;
      const settings = await GuildSettings.findOne({ where: { guildId: interaction.guildId } });
      if (!settings?.verificationEnabled || !settings?.verificationRoleId) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: '❌ Verification is not set up in this server.' })],
        });
      }

      // Rate-limit per user (1 attempt per 10 seconds)
      const coolKey = `verify:cool:${interaction.user.id}`;
      const cooled  = await client.redis.get(coolKey);
      if (cooled) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'warning', description: '⏳ Please wait a few seconds before trying again.' })],
        });
      }
      await client.redis.setex(coolKey, 10, '1');

      // Already verified?
      const member = interaction.member;
      if (member?.roles?.cache?.has(settings.verificationRoleId)) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'success', description: '✅ You are already verified.' })],
        });
      }

      // Generate captcha and stash answer in Redis (60s TTL)
      const { question, answer } = makeCaptcha();
      const captchaKey = `verify:captcha:${interaction.user.id}:${interaction.guildId}`;
      await client.redis.setex(captchaKey, 60, String(answer));

      const prompt = await interaction.editReply({
        embeds: [buildEmbed({
          type: 'primary',
          title: '🧮 Human Verification',
          description: `To verify, please send the answer to this math problem in this channel within 60 seconds:\n\n## \`${question} = ?\``,
          footer: 'Type the number as your next message. Example: "12"',
        })],
      }).catch(() => null);

      // Wait for the user's next message in this channel
      const filter = (m) => m.author.id === interaction.user.id && m.channel.id === interaction.channelId;
      const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60_000, errors: ['time'] })
        .catch(() => null);

      if (!collected || collected.size === 0) {
        await client.redis.del(captchaKey);
        return interaction.followUp({
          embeds: [buildEmbed({ type: 'error', description: '⏰ Verification timed out. Click the verify button again to retry.' })],
          ephemeral: true,
        }).catch(() => {});
      }

      const userMsg = collected.first();
      const guess   = parseInt(userMsg.content.trim(), 10);
      const stored  = parseInt(await client.redis.get(captchaKey) || 'NaN', 10);
      await client.redis.del(captchaKey);

      if (Number.isNaN(guess) || guess !== stored) {
        // Try to delete the user's wrong-answer message for cleanliness
        await userMsg.delete().catch(() => {});
        return interaction.followUp({
          embeds: [buildEmbed({ type: 'error', description: `❌ Wrong answer. Click the verify button to try again.` })],
          ephemeral: true,
        }).catch(() => {});
      }

      // Correct! Add the role.
      try {
        await userMsg.delete().catch(() => {});
        const role = interaction.guild.roles.cache.get(settings.verificationRoleId)
          || await interaction.guild.roles.fetch(settings.verificationRoleId).catch(() => null);
        if (role) {
          await member.roles.add(role, '[Aura] Verified');
        } else {
          throw new Error('Verification role not found on the server.');
        }
        return interaction.followUp({
          embeds: [buildEmbed({
            type: 'success',
            title: '✅ Verified!',
            description: `You now have the <@&${settings.verificationRoleId}> role. Welcome to the server!`,
          })],
          ephemeral: true,
        }).catch(() => {});
      } catch (e) {
        client.logger?.error?.('[Verify] role add failed:', e);
        return interaction.followUp({
          embeds: [buildEmbed({ type: 'error', description: '❌ Could not assign the verified role. Check the bot role hierarchy.' })],
          ephemeral: true,
        }).catch(() => {});
      }
    } catch (err) {
      client.logger?.error?.('[Verify] button handler failed:', err);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: '❌ Verification failed. Please try again.' })],
      }).catch(() => {});
    }
  },
};
