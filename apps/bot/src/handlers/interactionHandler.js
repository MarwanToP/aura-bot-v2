import { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { hasPermissions, checkCooldown } from './security.js';
import { checkCommandPermissions } from '../../shared/utils/permissions.js';

export async function handleInteraction(client, interaction) {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    // 0. Pre-execute gates. The whole section is guarded so that no gate error
    //    (e.g. a null `interaction.member` in DMs) can escape the handler.
    let lang = 'en';
    try {
      // 1. Permission checks declared via `permissions` / `default_member_permissions`
      if (command.permissions) {
        // Member-dependent gate: without a member (DM context / partial cache)
        // it cannot be evaluated, so deny safely instead of throwing.
        if (!interaction.member || !hasPermissions(interaction.member, command.permissions)) {
          return interaction.reply({ content: '❌ You do not have permission to execute this command.', flags: MessageFlags.Ephemeral });
        }
      }

      const requiredPerms = command.data?.default_member_permissions;
      if (requiredPerms != null && interaction.inGuild()) {
        const memberPerms = interaction.memberPermissions;
        const required = new PermissionsBitField(BigInt(requiredPerms));
        if (!memberPerms || !memberPerms.has(required)) {
          return interaction.reply({ content: '❌ You do not have permission to execute this command.', flags: MessageFlags.Ephemeral });
        }
      }

      // 1b. userPermissions / botPermissions metadata (parity with events/interactionCreate.js)
      const cp = checkCommandPermissions(command, { member: interaction.member, guild: interaction.guild, channel: interaction.channel });
      if (!cp.ok) {
        const message = cp.kind === 'bot'
          ? '❌ I am missing required permissions to run this command in this channel.'
          : '❌ You do not have permission to execute this command.';
        return interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
      }

      // 1c. Guild-only enforcement
      if (command.guildOnly && !interaction.guildId) {
        return interaction.reply({ content: '❌ This command can only be used within a server.', flags: MessageFlags.Ephemeral });
      }

      // 2. Cooldown enforcement — `command.cooldown` is declared in MILLISECONDS
      //    (e.g. 3000 = 3s), so it is normalized to whole seconds here because the
      //    Redis gate (security.checkCooldown) stores the key with `EX <seconds>`.
      //    Non-fatal on Redis outages so commands still run (fail-open for a missing cache).
      if (client.redis) {
        try {
          const cooldownMs = Number(command.cooldown) || 3000;
          const cooldownSeconds = Math.max(1, Math.ceil(cooldownMs / 1000));
          const cooldown = await checkCooldown(client.redis, interaction.user.id, command.data.name, cooldownSeconds);
          if (cooldown.limited) {
            return interaction.reply({ content: `⏳ Please wait ${cooldown.retryAfter}s before using \`/${command.data.name}\` again.`, flags: MessageFlags.Ephemeral });
          }
        } catch (e) {
          client.logger?.warn?.('Cooldown check failed:', e?.message);
        }
      }

      // 2b. Command settings (enabled flag + role allowlist) from the DB when available
      if (interaction.guildId && client.db?.models?.CommandSettings) {
        try {
          const settings = await client.db.models.CommandSettings.findOne({
            where: { guildId: interaction.guildId, commandName: interaction.commandName },
          });
          if (settings) {
            if (settings.enabled === false) {
              return interaction.reply({ content: '❌ This command has been disabled by administrators.', flags: MessageFlags.Ephemeral });
            }
            if (Array.isArray(settings.allowedRoles) && settings.allowedRoles.length > 0) {
              const memberRoles = interaction.member?.roles?.cache?.map(r => r.id) || [];
              const hasAllowed = settings.allowedRoles.some(rid => memberRoles.includes(rid));
              if (!hasAllowed) {
                return interaction.reply({ content: '❌ You do not have the required role to use this command.', flags: MessageFlags.Ephemeral });
              }
            }
          }
        } catch (e) {
          client.logger?.warn?.('CommandSettings read failed:', e?.message);
        }
      }

      // 2c. Premium-tier gate
      if (command.premiumTier > 0 && interaction.guildId) {
        try {
          const tier = await Promise.race([
            getGuildPremiumTier(client, interaction.guildId),
            new Promise(resolve => setTimeout(() => resolve(0), 400)),
          ]);
          if (tier < command.premiumTier) {
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setLabel('Unlock Premium').setStyle(ButtonStyle.Link).setURL('https://discord.gg/aura').setEmoji('⭐')
            );
            const embed = new EmbedBuilder().setColor('#8b5cf6').setDescription(`⭐ Requires **Premium Tier ${command.premiumTier}**.\n\nBoost your server with Aura's elite features!`).setFooter({ text: 'Support aura development.' });
            return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
          }
        } catch {}
      }

      // 2d. Resolve UI language once (commands may read interaction.locale, but lang is passed for parity with events router)
      try {
        if (client.i18n?.resolveLanguage) {
          lang = (await Promise.race([
            client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId),
            new Promise(resolve => setTimeout(() => resolve('en'), 400)),
          ])) || 'en';
        }
      } catch { lang = 'en'; }
    } catch (error) {
      // Deny safely: a gate must never take the process down (null member in DMs,
      // unexpected module/DB/Redis shape, failed acknowledgement, ...).
      console.error(`❌ Pre-execute gate error for /${interaction.commandName}:`, error);
      await safeEphemeralReply(interaction, '❌ An internal error occurred while executing this command.');
      return;
    }

    // 3. Command Execution
    try {
      await command.execute(client, interaction, lang);
    } catch (error) {
      console.error(`❌ Error executing /${interaction.commandName}:`, error);
      const content = '❌ An internal error occurred while executing this command.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      }
    }
    return;
  }

  // Component & other interactions (buttons, modals, select menus, context
  // menus, autocomplete) are routed by the full interaction router. It is
  // lazily imported so the command hot path stays cheap.
  if (
    interaction.isButton() ||
    interaction.isAnySelectMenu() ||
    interaction.isModalSubmit() ||
    interaction.isContextMenuCommand() ||
    interaction.isAutocomplete()
  ) {
    try {
      const router = await getComponentRouter();
      await router.execute(client, interaction);
    } catch (error) {
      console.error('❌ Error handling interaction:', error);
      if (interaction.isAutocomplete()) {
        await interaction.respond([]).catch(() => {});
        return;
      }
      if (!interaction.isRepliable()) return;
      const content = '❌ Something went wrong while handling this interaction.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, flags: MessageFlags.Ephemeral }).catch(() => {});
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    }
  }
}

let componentRouter = null;

/**
 * Best-effort ephemeral reply used by the pre-execute error path.
 * Never throws: acknowledges nothing if the interaction is not repliable.
 */
async function safeEphemeralReply(interaction, content) {
  try {
    if (typeof interaction.isRepliable === 'function' && !interaction.isRepliable()) return;
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
  } catch {}
}

async function getComponentRouter() {
  if (componentRouter) return componentRouter;
  componentRouter = (await import('../events/interactionCreate.js')).default;
  return componentRouter;
}

/**
 * Best-effort premium-tier lookup (cache hit preferred, DB fallback).
 * Mirror of the helper in events/interactionCreate.js.
 */
async function getGuildPremiumTier(client, guildId) {
  if (!client.redis || client.redis.status !== 'ready') {
    try {
      const s = await client.db?.models?.GuildSettings?.findOne({ where: { guildId }, attributes: ['premiumTier'] });
      return s?.premiumTier || 0;
    } catch { return 0; }
  }

  const cacheKey = `guild:premium:${guildId}`;
  try {
    const cached = await client.redis.get(cacheKey);
    if (cached !== null) return parseInt(cached, 10) || 0;
  } catch {}

  try {
    const s = await client.db?.models?.GuildSettings?.findOne({ where: { guildId }, attributes: ['premiumTier'] });
    const tier = s?.premiumTier || 0;
    if (client.redis?.status === 'ready') await client.redis.setex(cacheKey, 600, tier.toString()).catch(() => {});
    return tier;
  } catch { return 0; }
}
