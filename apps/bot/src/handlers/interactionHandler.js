import { hasPermissions, checkCooldown } from './security.js';

export async function handleInteraction(client, interaction) {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    // 1. Permission Check
    if (command.permissions && !hasPermissions(interaction.member, command.permissions)) {
      return interaction.reply({
        content: '❌ You do not have permission to execute this command.',
        ephemeral: true,
      });
    }

    // 2. Cooldown Enforcement
    if (client.redis) {
      const cooldown = await checkCooldown(client.redis, interaction.user.id, command.name, command.cooldown || 3);
      if (cooldown.limited) {
        return interaction.reply({
          content: `⏳ Please wait ${cooldown.retryAfter}s before using \`/${command.name}\` again.`,
          ephemeral: true,
        });
      }
    }

    // 3. Command Execution
    try {
      await command.execute(interaction, client);
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
