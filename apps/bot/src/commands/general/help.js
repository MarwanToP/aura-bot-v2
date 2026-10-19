// ================================================================
//  Aura Bot v2.0 — /help
//
//  Everything rendered here is derived from the LIVE command registry
//  (client.commands). The help page can therefore never advertise a
//  command that is not registered, nor hide one that is:
//    • the total is the real registered count (never a hardcoded number)
//    • a category only lists commands that actually exist right now
//    • every registered command lands in exactly one bucket, with a
//      catch-all for anything the category map does not claim
// ================================================================
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

const BRAND_COLOR = '#8b5cf6';
const CATEGORY_FOOTER = 'Aura Bot v2.0 • Use /help to see all categories';
const MAX_FIELDS_PER_EMBED = 25;
const MAX_EMBEDS_PER_MESSAGE = 10;

// ── Category map ────────────────────────────────────────────────
// `key` doubles as the /help `category` option value. The first five
// keys (moderation, economy, management, utility, games) are the
// original values and are intentionally kept stable so existing
// bookmarks and links keep working.
//
// `commands` is the preferred membership. A name that is not
// registered is skipped (it is never advertised), and a registered
// command that is not listed anywhere falls into the "more" catch-all
// bucket — so the rendered list is always complete.
const CATEGORIES = [
  {
    key: 'moderation',
    emoji: '🛡️',
    title: 'Security & Moderation',
    commands: [
      'ban', 'kick', 'timeout', 'warn', 'clear', 'softban', 'history', 'warnings',
      'unban', 'note', 'case', 'mod', 'lockdown', 'security', 'role', 'slowmode',
      'auditlog',
    ],
  },
  {
    key: 'economy',
    emoji: '🏛️',
    title: 'Economy & Systems',
    commands: [
      'credits', 'daily', 'work', 'rep', 'transfer', 'bank', 'shop', 'richlist',
      'leaderboard', 'rank',
    ],
  },
  {
    key: 'management',
    emoji: '👔',
    title: 'Management & Staff',
    commands: ['staff', 'modstaff', 'reactionrole', 'verify', 'deliver', 'apply', 'customcmd', 'onboarding'],
  },
  {
    key: 'utility',
    emoji: '📊',
    title: 'Information & Utility',
    commands: [
      'userinfo', 'serverinfo', 'roleinfo', 'avatar', 'aesthetic', 'stats', 'invites',
      'settings', 'autoresponder', 'social', 'ping', 'help', 'doctor', 'profile',
    ],
  },
  {
    key: 'games',
    emoji: '🎮',
    title: 'Fun & Games',
    commands: ['blackjack', 'slots', 'meme'],
  },
  {
    key: 'ai',
    emoji: '🤖',
    title: 'AI & Chat',
    commands: ['ask', 'chat', 'summarize', 'translate', 'search', 'aimod', 'ai-permissions', 'neural'],
  },
  {
    key: 'tickets',
    emoji: '🎫',
    title: 'Tickets & Support',
    commands: ['ticket', 'tpanel', 'suggest'],
  },
  {
    key: 'voice',
    emoji: '🔊',
    title: 'Voice & Temp Channels',
    commands: ['voice', 'tempchannel', 'aura'],
  },
  {
    key: 'events',
    emoji: '⏰',
    title: 'Reminders & Events',
    commands: ['remind', 'birthday', 'poll', 'giveaway', 'timedmsg'],
  },
  {
    key: 'more',
    emoji: '🧩',
    title: 'More Commands',
    commands: [], // catch-all — anything not claimed above lands here
  },
];

const CATEGORY_CHOICES = CATEGORIES.map(category => ({
  name: `${category.emoji} ${category.title}`,
  value: category.key,
}));

// ── Helpers ─────────────────────────────────────────────────────

/** Read the raw slash-command payload from a command module. */
function commandData(command) {
  const data = command?.data;
  if (!data) return null;
  try {
    if (typeof data.toJSON === 'function') return data.toJSON();
  } catch {
    /* fall through to the raw object shape */
  }
  return typeof data === 'object' ? data : null;
}

/**
 * Index the live command registry: name -> { name, description, subcommands }.
 * Returns an empty map when the client has no command collection, so the
 * caller can degrade gracefully instead of throwing.
 */
function buildLiveIndex(client) {
  const index = new Map();
  const collection = client?.commands;
  if (!collection) return index;

  let entries = [];
  try {
    entries = typeof collection.entries === 'function'
      ? [...collection.entries()]
      : Object.entries(collection);
  } catch {
    entries = [];
  }

  for (const [key, command] of entries) {
    const json = commandData(command);
    if (!json) continue;
    const name = json.name || key;
    if (!name) continue;
    const subcommands = (Array.isArray(json.options) ? json.options : [])
      .filter(option => option && option.type === 1 && option.name)
      .map(option => option.name);
    index.set(name, {
      name,
      description: json.description || 'Command module',
      subcommands,
    });
  }
  return index;
}

/**
 * Bucket the live commands. Every registered command ends up in exactly
 * one bucket: the ones claimed by the category map keep their preferred
 * home, everything else falls into the "more" catch-all.
 */
function classifyCommands(liveIndex) {
  const claimed = new Set();

  const buckets = CATEGORIES.map(category => {
    const members = [];
    for (const name of category.commands) {
      if (claimed.has(name)) continue;
      const entry = liveIndex.get(name);
      if (!entry) continue; // not registered → never advertise it
      claimed.add(name);
      members.push(entry);
    }
    return { key: category.key, emoji: category.emoji, title: category.title, members };
  });

  const catchAll = buckets.find(bucket => bucket.key === 'more');
  if (catchAll) {
    const leftovers = [];
    for (const [name, entry] of liveIndex) {
      if (claimed.has(name)) continue;
      claimed.add(name);
      leftovers.push(entry);
    }
    leftovers.sort((a, b) => a.name.localeCompare(b.name));
    catchAll.members = leftovers;
  }

  return buckets;
}

/**
 * Resolve the public dashboard URL. The repo convention is the
 * DASHBOARD_URL environment variable (see deploy/platform-configs and
 * packages/systems/monitor). When it is not configured there is no
 * dashboard to link to, so the button is omitted instead of pointing
 * users at a dead localhost link.
 */
function resolveDashboardUrl() {
  const raw = process.env.DASHBOARD_URL;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return trimmed;
}

function buildDashboardRow() {
  const url = resolveDashboardUrl();
  if (!url) return null;
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Web Dashboard')
      .setStyle(ButtonStyle.Link)
      .setURL(url)
      .setEmoji('🌐')
  );
}

function applyThumbnail(embed, client) {
  if (client?.user?.displayAvatarURL) {
    embed.setThumbnail(client.user.displayAvatarURL({ size: 256 }));
  }
  return embed;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

/** Embeds for a single category view — one field per command. */
function buildCategoryEmbeds(bucket, client) {
  const fields = bucket.members.map(member => ({
    name: `/${member.name}`,
    value: `${member.description}${member.subcommands.length > 0 ? `\n└ **Subcommands:** ${member.subcommands.join(', ')}` : ''}`,
    inline: false,
  }));

  if (fields.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle(`${bucket.emoji} ${bucket.title}`)
      .setDescription('No commands are currently registered in this category.')
      .setFooter({ text: CATEGORY_FOOTER })
      .setTimestamp();
    return [applyThumbnail(embed, client)];
  }

  const groups = chunk(fields, MAX_FIELDS_PER_EMBED).slice(0, MAX_EMBEDS_PER_MESSAGE);
  return groups.map((group, index) => {
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle(`${bucket.emoji} ${bucket.title}`)
      .setDescription(
        index === 0
          ? 'Below are all available slash commands in this category:'
          : 'Continued:'
      )
      .addFields(group)
      .setFooter({ text: CATEGORY_FOOTER })
      .setTimestamp();
    return applyThumbnail(embed, client);
  });
}

/** The overview embed — every category with its live command names. */
function buildOverviewEmbed(buckets, client, totalCmds, guildCount) {
  const visible = buckets.filter(bucket => bucket.key !== 'more' || bucket.members.length > 0);

  const categoryFields = visible.map(bucket => ({
    name: `${bucket.emoji} ${bucket.title}`,
    value: `${bucket.members.length} command${bucket.members.length === 1 ? '' : 's'}:\n`
      + bucket.members.map(member => `\`/${member.name}\``).join(' • '),
    inline: true,
  }));

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle('⚡ Aura Bot v2.0 — Command Suite & Documentation')
    .setDescription(
      `Enterprise Discord Bot loaded with **${totalCmds} primary slash commands**.\n\n`
      + 'Use `/help category:<category>` for subcommand details & options!'
    )
    .addFields(categoryFields)
    .setFooter({ text: `Aura Bot Control • Operating across ${guildCount} server(s)` })
    .setTimestamp();

  return applyThumbnail(embed, client);
}

/** Branded fallback — the command must never throw at the user. */
async function replyWithError(interaction) {
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle('⚠️ Aura Bot — Help Unavailable')
    .setDescription('Something went wrong while building the help page. Please try again in a moment.')
    .setFooter({ text: 'Aura Bot v2.0' })
    .setTimestamp();

  try {
    if (!interaction?.reply) return undefined;
    if (interaction.replied || interaction.deferred) {
      if (typeof interaction.followUp === 'function') {
        return await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }
      return undefined;
    }
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  } catch {
    return undefined;
  }
}

// ── Command ─────────────────────────────────────────────────────
export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View Aura Bot features, active modules, and documentation.')
    .addStringOption(o =>
      o.setName('category')
        .setDescription('Select specific category to inspect')
        .addChoices(CATEGORY_CHOICES)
    ),
  cooldown: 3000,
  async execute(clientOrInteraction, interactionOrClient) {
    const interaction = clientOrInteraction?.reply ? clientOrInteraction : interactionOrClient;
    const client = clientOrInteraction?.commands ? clientOrInteraction : (interactionOrClient?.commands ? interactionOrClient : interaction?.client);

    try {
      const liveIndex = buildLiveIndex(client);
      const buckets = classifyCommands(liveIndex);
      const totalCmds = liveIndex.size;
      const guildCount = client?.guilds?.cache?.size ?? 0;

      const selectedCat = interaction?.options?.getString?.('category');
      const selected = selectedCat ? buckets.find(bucket => bucket.key === selectedCat) : null;

      const dashboardRow = buildDashboardRow();
      const components = dashboardRow ? [dashboardRow] : [];

      if (selected) {
        const embeds = buildCategoryEmbeds(selected, client);
        return await interaction.reply({ embeds, components, flags: MessageFlags.Ephemeral });
      }

      const embed = buildOverviewEmbed(buckets, client, totalCmds, guildCount);
      return await interaction.reply({ embeds: [embed], components, flags: MessageFlags.Ephemeral });
    } catch (err) {
      client?.logger?.warn?.(`[Help] Failed to render help output: ${err?.message || err}`);
      return await replyWithError(interaction);
    }
  },
};
