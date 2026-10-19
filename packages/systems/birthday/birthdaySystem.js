// ================================================================
//  AURA BOT v2.0 — Birthday System
// ================================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { buildEmbed }          from '../../utils/embedBuilder.js';
import config                  from '../../config/index.js';
import logger                  from '../../utils/logger.js';

// ─── /birthday commands ──────────────────────────────────────
export const birthday = {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Birthday management')
    .addSubcommand(s => s
      .setName('set')
      .setDescription('Set your birthday')
      .addIntegerOption(o => o.setName('day').setDescription('Day (1-31)').setRequired(true).setMinValue(1).setMaxValue(31))
      .addIntegerOption(o => o.setName('month').setDescription('Month (1-12)').setRequired(true).setMinValue(1).setMaxValue(12))
      .addIntegerOption(o => o.setName('year').setDescription('Year (optional, for age display)').setMinValue(1900).setMaxValue(new Date().getFullYear() - 1))
    )
    .addSubcommand(s => s
      .setName('remove')
      .setDescription('Remove your birthday')
    )
    .addSubcommand(s => s
      .setName('check')
      .setDescription('Check someone\'s birthday')
      .addUserOption(o => o.setName('user').setDescription('User to check'))
    )
    .addSubcommand(s => s
      .setName('upcoming')
      .setDescription('View upcoming birthdays')
    )
    .addSubcommand(s => s
      .setName('configure')
      .setDescription('[Admin] Configure birthday announcements')
      .addChannelOption(o => o.setName('channel').setDescription('Announcement channel'))
      .addRoleOption(o => o.setName('role').setDescription('Birthday role to assign'))
      .addStringOption(o => o.setName('message').setDescription('Custom message ({user} = mention, {age} = age)'))
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable/disable'))
    ),

  botPermissions: [PermissionFlagsBits.SendMessages],
  guildOnly: true,
  cooldown:  3000,

  async execute(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const sub  = interaction.options.getSubcommand();
    const lang = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const { Birthday, GuildSettings } = client.db.models;

    if (sub === 'set') {
      const day   = interaction.options.getInteger('day');
      const month = interaction.options.getInteger('month');
      const year  = interaction.options.getInteger('year');

      // Validate date
      const test = new Date(year || 2000, month - 1, day);
      if (test.getDate() !== day) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Invalid date.' })] });
      }

      await Birthday.upsert({ userId: interaction.user.id, guildId: interaction.guildId, day, month, year: year || null });

      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `🎂 Birthday set to **${monthNames[month-1]} ${day}${year ? `, ${year}` : ''}**!` })] });
    }

    if (sub === 'remove') {
      await Birthday.destroy({ where: { userId: interaction.user.id, guildId: interaction.guildId } });
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: '✅ Birthday removed.' })] });
    }

    if (sub === 'check') {
      const target = interaction.options.getUser('user') || interaction.user;
      const bday   = await Birthday.findOne({ where: { userId: target.id, guildId: interaction.guildId } });

      if (!bday) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: `📭 **${target.username}** hasn't set their birthday.` })] });

      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const today      = new Date();
      const nextBday   = new Date(today.getFullYear(), bday.month - 1, bday.day);
      if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
      const daysUntil  = Math.ceil((nextBday - today) / (1000 * 60 * 60 * 24));

      let age = null;
      if (bday.year) age = today.getFullYear() - bday.year - (today < new Date(today.getFullYear(), bday.month - 1, bday.day) ? 1 : 0);

      return interaction.editReply({ embeds: [buildEmbed({
        type:   'info',
        title:  `🎂 Birthday — ${target.username}`,
        thumbnail: target.displayAvatarURL({ size: 128 }),
        fields: [
          { name: '📅 Date',       value: `${monthNames[bday.month - 1]} ${bday.day}${bday.year ? `, ${bday.year}` : ''}`, inline: true },
          { name: '⏳ Next In',    value: daysUntil === 0 ? '🎉 **TODAY!**' : `${daysUntil} days`, inline: true },
          ...(age ? [{ name: '🎈 Age',  value: `${age} years old`, inline: true }] : []),
        ],
      })] });
    }

    if (sub === 'upcoming') {
      const today  = new Date();
      const all    = await Birthday.findAll({ where: { guildId: interaction.guildId } });

      const sorted = all.map(b => {
        let next = new Date(today.getFullYear(), b.month - 1, b.day);
        if (next < today) next.setFullYear(today.getFullYear() + 1);
        return { ...b.toJSON(), next, daysUntil: Math.ceil((next - today) / 86400000) };
      }).sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 10);

      if (!sorted.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: '📭 No birthdays registered.' })] });

      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const fields = sorted.map(b => ({
        name:  `<@${b.userId}>`,
        value: `**${monthNames[b.month-1]} ${b.day}** — ${b.daysUntil === 0 ? '🎉 Today!' : `in ${b.daysUntil} days`}`,
        inline: true,
      }));

      return interaction.editReply({ embeds: [buildEmbed({ type: 'info', title: '🎂 Upcoming Birthdays', fields, timestamp: true })] });
    }

    if (sub === 'configure') {
      if (!interaction.member.permissions.has('ManageGuild')) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ No permission.' })] });
      }

      const channel = interaction.options.getChannel('channel');
      const role    = interaction.options.getRole('role');
      const message = interaction.options.getString('message');
      const enabled = interaction.options.getBoolean('enabled');

      const [settings] = await GuildSettings.findOrCreate({ where: { guildId: interaction.guildId }, defaults: {} });
      const updates     = {};

      if (channel !== null) updates.birthdayChannelId = channel.id;
      if (role    !== null) updates.birthdayRoleId    = role.id;
      if (message !== null) updates.birthdayMessage   = message;
      if (enabled !== null) updates.birthdayEnabled   = enabled;

      await settings.update(updates);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: '✅ Birthday settings updated.' })] });
    }
  },
};

// ─── Background Birthday Checker (called from backgroundTasks) ──

/**
 * Wall-clock parts of `date` in the given IANA timezone.
 * Falls back to UTC when the timezone is missing or unknown to the runtime.
 */
export function zonedNow(timezone, date = new Date()) {
  const tz = typeof timezone === 'string' && timezone.trim() ? timezone.trim() : 'UTC';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(date);
    const out = {};
    for (const p of parts) out[p.type] = p.value;
    let hour = Number(out.hour);
    if (hour === 24) hour = 0; // some ICU builds report midnight as "24"
    return {
      year:  Number(out.year),
      month: Number(out.month),
      day:   Number(out.day),
      hour,
      minute: Number(out.minute),
    };
  } catch {
    return {
      year:  date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day:   date.getUTCDate(),
      hour:  date.getUTCHours(),
      minute: date.getUTCMinutes(),
    };
  }
}

/**
 * The cron fires every 15 minutes; a guild only announces while its LOCAL
 * hour equals `config.birthday.checkHour` — the announcement day is the
 * guild's local day too, so a UTC+14 guild is not a day behind.
 */
export async function checkBirthdays(client) {
  try {
    const { Birthday, GuildSettings } = client.db.models;
    const checkHour = Number.isInteger(config.birthday?.checkHour) ? config.birthday.checkHour : 9;

    const settingsRows = await GuildSettings.findAll({ where: { birthdayEnabled: true } });
    if (!settingsRows.length) return;

    // Group the guilds by their local date → one birthday query per date.
    const byLocalDate = new Map();

    for (const settings of settingsRows) {
      if (!settings?.birthdayChannelId) continue;
      if (!client.guilds?.cache?.has(settings.guildId)) continue;

      const local = zonedNow(settings.timezone);
      if (local.hour !== checkHour) continue;

      const key = `${local.year}-${local.month}-${local.day}`;
      if (!byLocalDate.has(key)) {
        byLocalDate.set(key, { day: local.day, month: local.month, year: local.year, guildIds: new Set() });
      }
      byLocalDate.get(key).guildIds.add(settings.guildId);
    }

    if (!byLocalDate.size) return;

    for (const { day, month, year, guildIds } of byLocalDate.values()) {
      const birthdays = await Birthday.findAll({ where: { day, month } });
      if (!birthdays.length) continue;

      for (const bday of birthdays) {
        if (!guildIds.has(bday.guildId)) continue;
        try {
          const settings = await GuildSettings.findOne({ where: { guildId: bday.guildId } });
          if (!settings?.birthdayEnabled || !settings?.birthdayChannelId) continue;

          // Only announce once per day (per guild-local day)
          const announcedKey = `bday:announced:${bday.guildId}:${bday.userId}:${year}-${month}-${day}`;
          if (await client.redis.get(announcedKey)) continue;

          const guild   = client.guilds.cache.get(bday.guildId);
          if (!guild) continue;

          const member  = await guild.members.fetch(bday.userId).catch(() => null);
          if (!member)  continue;

          const channel = await client.channels.fetch(settings.birthdayChannelId).catch(() => null);
          if (!channel?.isTextBased()) continue;

          // Build message — the age is counted in the guild's local year
          let age       = null;
          if (bday.year) age = year - bday.year;

          let message = (settings.birthdayMessage || config.birthday.defaultMessage)
            .replace('{user}', `<@${member.id}>`)
            .replace('{age}',  age ? `${age}` : '');

          // Optional: AI-generate personalized message
          if (client.ai.isAvailable() && Math.random() < 0.3) {
            try {
              const lang = settings.language || 'en';
              const aiMsg = await client.ai.generateWelcomeMessage(member.user.username, guild.name, lang);
              if (aiMsg) message = `🎂 ${aiMsg}`;
            } catch {}
          }

          await channel.send({
            content: `<@${member.id}>`,
            embeds:  [buildEmbed({
              type:        'premium',
              title:       `🎂 Happy Birthday, ${member.user.username}! 🎉`,
              description: message + (age ? `\nTurning **${age}** today! 🎈` : ''),
              thumbnail:   member.user.displayAvatarURL({ size: 256 }),
              timestamp:   true,
            })],
          });

          // Award birthday role
          if (settings.birthdayRoleId) {
            const role = guild.roles.cache.get(settings.birthdayRoleId);
            if (role) {
              await member.roles.add(role, '[Aura] Birthday').catch(() => {});
              // Remove after 24 hours — unref()ed so the pending 24h handle never
              // keeps the event loop alive (it would also double-fire next to
              // the cron jobs).
              const roleTimer = setTimeout(async () => {
                await member.roles.remove(role, '[Aura] Birthday ended').catch(() => {});
              }, 86400000);
              roleTimer.unref?.();
            }
          }

          // Mark as announced
          await client.redis.setex(announcedKey, 86400, '1');
          logger.info(`[Birthday] Announced for ${member.user.tag} in ${guild.name}`);

        } catch (err) {
          logger.warn('[Birthday] Error for entry:', err.message);
        }
      }
    }
  } catch (err) {
    logger.error('[Birthday] checkBirthdays error:', err);
  }
}

export default birthday;
