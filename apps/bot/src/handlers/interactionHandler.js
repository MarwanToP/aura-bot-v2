import { hasPermissions, checkCooldown } from './security.js';

export async function handleInteraction(client, interaction) {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    // 1. Permission Check
    const requiredPermissions = command.permissions || command.userPermissions || [];
    if (requiredPermissions.length && !hasPermissions(interaction.member, requiredPermissions)) {
      return interaction.reply({
        content: '❌ You do not have permission to execute this command.',
        ephemeral: true,
      });
    }

    // 2. Cooldown Enforcement
    if (client.redis) {
      const commandName = command?.data?.name || interaction.commandName;
      const rawCooldown = command.cooldown ?? 3000;
      const cooldownSeconds = rawCooldown > 100 ? Math.ceil(rawCooldown / 1000) : rawCooldown;
      const cooldown = await checkCooldown(client.redis, interaction.user.id, commandName, cooldownSeconds);
      if (cooldown.limited) {
        return interaction.reply({
          content: `⏳ Please wait ${cooldown.retryAfter}s before using \`/${commandName}\` again.`,
          ephemeral: true,
        });
      }
    }

    // 3. Command Execution
    try {
      await command.execute(client, interaction);
    } catch (error) {
      console.error(`❌ Error executing /${interaction.commandName}:`, error);
      const content = '❌ An internal error occurred while executing this command.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  }
}
