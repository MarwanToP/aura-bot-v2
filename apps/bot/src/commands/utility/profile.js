// ================================================================
//  AURA BOT v2.0 — Member Profile Card  (/profile)
//
//  A rich, fully data-backed profile card for a guild member:
//  XP / level progression, activity, economy, moderation history and
//  the Discord account metadata.
//
//  Design notes
//  ------------
//  • The TEXT embed is always the primary reply. The visual card is a
//    bonus that is attached on top of it.
//  • The renderer is imported LAZILY, inside the handler, so a missing
//    or broken native canvas module can never break this command file
//    (a static import would abort the whole module graph). If the
//    import, the render or the avatar fetch fails, the command still
//    answers with the text card.
//  • Every value is read from the real data layer; a missing row is
//    rendered as "—" / 0 instead of being invented.
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../../../../packages/utils/embedBuilder.js';
import config from '../../../../../packages/config/index.js';

// ─── Level / XP helpers ───────────────────────────────────────────
// The XP curve lives in the shared config, so the numbers rendered
// here always match the ones the leveling system actually awards.
const MAX_TRACKED_LEVEL = 10_000;

let cumulativeTable = null;

/** table[level] = total XP required to reach `level`. */
function getCumulativeTable() {
  if (cumulativeTable) return cumulativeTable;
  const table = [0];
  for (let i = 0; i < MAX_TRACKED_LEVEL; i++) {
    const step = Number(config.leveling.levelFormula(i));
    table.push(table[i] + (Number.isFinite(step) ? step : 0));
  }
  cumulativeTable = table;
  return table;
}

/**
 * Derive the level of a member from their total XP.
 * A binary search is used instead of a linear scan: the XP column is a
 * BIGINT and a tampered/overflowing value must not be able to stall
 * the command with an O(level) loop.
 */
function levelFromXp(xp) {
  const total = Math.max(0, Number(xp) || 0);
  const table = getCumulativeTable();

  let lo = 0;
  let hi = table.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (table[mid] <= total) lo = mid;
    else hi = mid - 1;
  }

  const level = lo;
  const currentXp = Math.max(0, total - table[level]);
  const rawNext = Number(config.leveling.levelFormula(level));
  const nextLevelXp = Math.max(1, Number.isFinite(rawNext) ? rawNext : 1);
  const progress = Math.max(0, Math.min(100, Math.floor((currentXp / nextLevelXp) * 100)));
  return { level, currentXp, nextLevelXp, progress };
}

/** 20-cell progress bar. */
function progressBar(percent) {
  const filled = Math.max(0, Math.min(20, Math.floor(percent / 5)));
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
}

/** Discord timestamp markup, or an em dash when the date is unknown. */
function timestamp(value, style = 'D') {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  return `<t:${Math.floor(ms / 1000)}:${style}>`;
}

/** Only pass a colour to the embed builder when it is a valid hex value. */
function safeColor(value) {
  return typeof value === 'string' && /^#?[0-9a-fA-F]{6}$/.test(value.trim())
    ? value.trim().startsWith('#') ? value.trim() : `#${value.trim()}`
    : undefined;
}

/** Read a number that may arrive as a string (BIGINT columns). */
function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Run a read that must never take the command down: a failing query
 * degrades to `fallback` and is reported through the warn channel.
 */
async function readSafely(client, label, fn, fallback = null) {
  try {
    const result = await fn();
    return result === undefined || result === null ? fallback : result;
  } catch (err) {
    client.logger?.warn?.(`[Profile] ${label} lookup failed: ${err?.message || err}`);
    return fallback;
  }
}

// ─── Moderation visibility ─────────────────────────────────────────
//
// The moderation case / warning counters are staff-facing data (the same
// numbers /case, /warnings and the mod log show). They are only rendered
// for the member themselves or for a caller that moderates the server —
// otherwise any member could enumerate the moderation history of every
// other member through a public embed.
const MODERATION_PERMISSIONS = [
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.ManageGuild,
];

/** The caller's permission bitfield (guild interaction → member permissions). */
function callerPermissions(interaction) {
  return interaction?.memberPermissions ?? interaction?.member?.permissions ?? null;
}

/** True when the caller may see moderation data for other members. */
function canViewModeration(interaction) {
  const perms = callerPermissions(interaction);
  if (!perms || typeof perms.has !== 'function') return false;
  return MODERATION_PERMISSIONS.some(bit => perms.has(bit));
}

// ─── Card rendering ────────────────────────────────────────────────
//
// A stuck native renderer must never leave /profile deferred forever, so
// the render is bounded (same guard as the economy card) and the command
// falls back to the text embed.
const CARD_RENDER_TIMEOUT_MS = 4_000;

async function renderCardSafely(generate, user, data) {
  let timer;
  try {
    return await Promise.race([
      generate(user, data),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('card render timed out')), CARD_RENDER_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// ─── /profile ────────────────────────────────────────────────────
export const profile = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Show a rich member profile card: level, XP, economy and moderation stats')
    .addUserOption(o =>
      o.setName('user')
        .setDescription('Member to inspect (defaults to you)')
    ),

  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    await interaction.deferReply().catch(() => {});

    try {
      const target = interaction.options.getUser('user') || interaction.user;
      const guildId = interaction.guildId;
      const models = client.db?.models ?? {};

      // Moderation counters are only read AND shown for the member itself
      // or for a caller that moderates the server.
      const isSelf = target?.id === interaction.user?.id;
      const showModeration = isSelf || canViewModeration(interaction);

      // ── Data layer (Sequelize) ────────────────────────────────
      const [profileRow, economyRow, modCases, warnings] = await Promise.all([
        models.UserProfile
          ? readSafely(client, 'user profile', () =>
              models.UserProfile.findOne({ where: { userId: target.id, guildId } }))
          : null,
        models.Economy
          ? readSafely(client, 'economy', () =>
              models.Economy.findOne({ where: { userId: target.id, guildId } }))
          : null,
        showModeration && models.ModerationCase
          ? readSafely(client, 'moderation cases', () =>
              models.ModerationCase.count({ where: { guildId, userId: target.id } }), 0)
          : 0,
        showModeration && models.Warning
          ? readSafely(client, 'warnings', () =>
              models.Warning.count({ where: { guildId, userId: target.id } }), 0)
          : 0,
      ]);

      // ── Discord member metadata ───────────────────────────────
      const member = interaction.guild?.members
        ? await readSafely(client, 'guild member', () =>
            interaction.guild.members.fetch(target.id), null)
        : null;

      const roles = member?.roles?.cache
        ? [...member.roles.cache.values()]
            .filter(r => r && r.id !== guildId && !r.managed)
            .sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
        : [];

      // ── Derived numbers ───────────────────────────────────────
      const xp = toNumber(profileRow?.xp);
      const { level, currentXp, nextLevelXp, progress } = levelFromXp(xp);
      const messages = toNumber(profileRow?.totalMessages);
      const voiceMinutes = toNumber(profileRow?.voiceMinutes);
      const reputation = toNumber(profileRow?.reputation);
      const balance = toNumber(economyRow?.balance);
      const bank = toNumber(economyRow?.bank);
      const streak = toNumber(economyRow?.dailyStreak);
      const bio = typeof profileRow?.bio === 'string' ? profileRow.bio.trim() : '';
      const cardBackground = typeof profileRow?.cardBackground === 'string' ? profileRow.cardBackground.trim() : '';

      // ── Optional visual card ──────────────────────────────────
      // Imported inside the handler on purpose: the native canvas
      // module is optional and must never break this command file.
      // The render itself is bounded — a stuck renderer must not leave
      // the interaction deferred forever.
      let card = null;
      try {
        const { generateAuraCard } = await import('../../../../../packages/utils/cardGenerator.js')
          .catch(() => ({}));
        if (typeof generateAuraCard === 'function') {
          card = await renderCardSafely(generateAuraCard, target, { balance, streak, reputation });
        }
      } catch (err) {
        client.logger?.warn?.(`[Profile] card render failed: ${err?.message || err}`);
        card = null;
      }

      const topRoles = roles.length
        ? roles.slice(0, 5).map(r => `<@&${r.id}>`).join(', ')
        : '—';

      const fields = [
        { name: '⭐ Level', value: `Level **${level}**`, inline: true },
        { name: '✨ Total XP', value: xp.toLocaleString('en-US'), inline: true },
        { name: '💬 Messages', value: messages.toLocaleString('en-US'), inline: true },
        { name: '🎙️ Voice time', value: `${voiceMinutes.toLocaleString('en-US')} min`, inline: true },
        { name: '🌟 Reputation', value: reputation.toLocaleString('en-US'), inline: true },
        { name: '💰 Balance', value: `${balance.toLocaleString('en-US')} coins`, inline: true },
        { name: '🏦 Vault', value: `${bank.toLocaleString('en-US')} coins`, inline: true },
        { name: '🔥 Daily streak', value: `${streak} day${streak === 1 ? '' : 's'}`, inline: true },
        // The moderation line is omitted for anyone who may not see it —
        // without a hint that it was omitted.
        ...(showModeration ? [{
          name: '🛡️ Moderation',
          value: `${toNumber(modCases)} case(s) • ${toNumber(warnings)} warning(s)`,
          inline: true,
        }] : []),
        {
          name: '📈 XP progress',
          value: `${progressBar(progress)}\n${currentXp.toLocaleString('en-US')}/${nextLevelXp.toLocaleString('en-US')} XP (${progress}%)`,
          inline: false,
        },
        { name: '📅 Account created', value: timestamp(target?.createdTimestamp), inline: true },
        { name: '📥 Joined server', value: timestamp(member?.joinedTimestamp), inline: true },
        { name: '👑 Top roles', value: topRoles, inline: false },
      ];

      if (bio) fields.push({ name: '📝 Bio', value: bio.slice(0, 1024), inline: false });
      if (cardBackground) {
        fields.push({ name: '🎨 Card background', value: cardBackground.slice(0, 1024), inline: true });
      }

      let avatarUrl = null;
      try {
        avatarUrl = typeof target?.displayAvatarURL === 'function'
          ? target.displayAvatarURL({ size: 256 })
          : null;
      } catch {
        avatarUrl = null;
      }

      const embed = buildEmbed({
        type: 'primary',
        title: `Profile — ${target?.username ?? 'Member'}`,
        description: 'Activity, progression, economy and moderation overview for this member.',
        color: safeColor(profileRow?.cardColor),
        thumbnail: avatarUrl || undefined,
        image: card ? `attachment://${card.name || 'aura-profile.png'}` : undefined,
        fields,
        footer: `Member ID: ${target?.id ?? '—'}`,
        timestamp: true,
      });

      return interaction.editReply({
        embeds: [embed],
        files: card ? [card] : [],
      });
    } catch (err) {
      client.logger?.warn?.(`[Profile] command failed: ${err?.message || err}`);
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'error',
          title: 'Profile Unavailable',
          description: '❌ The profile could not be rendered. Please try again in a moment.',
        })],
      }).catch(() => {});
    }
  },
};

export default profile;
