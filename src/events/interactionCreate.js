// ================================================================
//  Event: interactionCreate — Full Command + Component Router
// ================================================================
import { InteractionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { buildEmbed }      from '../utils/embedBuilder.js';
import config              from '../../config/config.js';
import logger              from '../utils/logger.js';

export default {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      if (interaction.isChatInputCommand())      return handleSlash(client, interaction);
      if (interaction.isButton())                return handleButton(client, interaction);
      if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) return handleSelect(client, interaction);
      if (interaction.type === InteractionType.ModalSubmit) return handleModal(client, interaction);
      if (interaction.isContextMenuCommand())    return handleContextMenu(client, interaction);
      if (interaction.isAutocomplete())          return handleAutocomplete(client, interaction);
    } catch (err) {
      logger.error('[InteractionCreate]', err);
    }
  },
};

// ── Slash Commands ────────────────────────────────────────────
async function handleSlash(client, interaction) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // Cooldown
  const coolKey = `cd:${interaction.user.id}:${interaction.commandName}`;
  const onCool  = await client.redis.get(coolKey);
  if (onCool) {
    const remaining = await client.redis.pttl(coolKey);
    const lang = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const secs = (remaining / 1000).toFixed(1);
    return interaction.reply({ embeds: [buildEmbed({ type: 'warning', description: client.i18n.t('common.onCooldown', { time: `${secs}s` }, lang) })], ephemeral: true });
  }

  // Guild only
  if (command.guildOnly && !interaction.guildId) {
    return interaction.reply({ embeds: [buildEmbed({ type: 'error', description: '❌ Server only.' })], ephemeral: true });
  }

  // User permissions
  if (command.userPermissions?.length && interaction.member) {
    const miss = command.userPermissions.filter(p => !interaction.member.permissions.has(p));
    if (miss.length) {
      const lang = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
      return interaction.reply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.noPermission', {}, lang) })], ephemeral: true });
    }
  }

  // Bot permissions
  if (command.botPermissions?.length && interaction.guild?.members.me) {
    const miss = command.botPermissions.filter(p => !interaction.guild.members.me.permissions.has(p));
    if (miss.length) return interaction.reply({ embeds: [buildEmbed({ type: 'error', description: '❌ I\'m missing required permissions.' })], ephemeral: true });
  }

  // Premium check
  if (command.premiumTier > 0 && interaction.guildId) {
    try {
      const { GuildSettings } = client.db.models;
      const s = await GuildSettings.findOne({ where: { guildId: interaction.guildId } });
      if ((s?.premiumTier || 0) < command.premiumTier) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel('Unlock Premium').setStyle(ButtonStyle.Link).setURL(config.links?.premium || 'https://example.com/premium').setEmoji('⭐')
        );
        return interaction.reply({ 
          embeds: [buildEmbed({ type: 'premium', description: `⭐ This feature requires **Aura Premium Tier ${command.premiumTier}**.\n\nUnlock unlimited potential for your server by upgrading today!`, footer: 'Support the continued development of Aura.' })], 
          components: [row],
          ephemeral: true 
        });
      }
    } catch {}
  }

  // Execute
  try {
    await command.execute(client, interaction);
    if (command.cooldown > 0) {
      await client.redis.setex(coolKey, Math.ceil(command.cooldown / 1000), '1');
    }
  } catch (err) {
    logger.error(`[/${interaction.commandName}]`, err);
    const reply = { embeds: [buildEmbed({ type: 'error', description: '❌ An error occurred.' })], ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(reply).catch(() => {});
    else await interaction.reply(reply).catch(() => {});
  }
}

// ── Buttons ───────────────────────────────────────────────────
async function handleButton(client, interaction) {
  const [prefix, ...rest] = interaction.customId.split(':');
  const handlers = {
    ticket:   '../systems/tickets/ticketSystem.js',
    giveaway: '../systems/giveaway/giveawaySystem.js',
    poll:     '../systems/polls/pollSystem.js',
  };

  const modulePath = handlers[prefix];
  if (!modulePath) return;

  try {
    const mod = await import(modulePath);
    if (mod.handleButton) await mod.handleButton(client, interaction, rest.join(':'));
  } catch (err) {
    logger.warn(`[Button] ${interaction.customId}: ${err.message}`);
  }
}

// ── Select Menus ──────────────────────────────────────────────
async function handleSelect(client, interaction) {
  const [prefix, ...rest] = interaction.customId.split(':');
  try {
    const mod = await import(`../systems/interactions/${prefix}.js`).catch(() => null);
    if (mod?.handleSelectMenu) await mod.handleSelectMenu(client, interaction, rest.join(':'));
  } catch {}
}

// ── Modals ────────────────────────────────────────────────────
async function handleModal(client, interaction) {
  const [prefix, ...rest] = interaction.customId.split(':');
  try {
    const mod = await import(`../systems/interactions/${prefix}.js`).catch(() => null);
    if (mod?.handleModal) await mod.handleModal(client, interaction, rest.join(':'));
  } catch {}
}

// ── Context Menus ─────────────────────────────────────────────
async function handleContextMenu(client, interaction) {
  const cmd = client.commands.get(interaction.commandName);
  if (cmd?.execute) await cmd.execute(client, interaction).catch(err => logger.error('[ContextMenu]', err));
}

// ── Autocomplete ──────────────────────────────────────────────
async function handleAutocomplete(client, interaction) {
  const cmd = client.commands.get(interaction.commandName);
  if (cmd?.autocomplete) await cmd.autocomplete(client, interaction).catch(() => {});
}
