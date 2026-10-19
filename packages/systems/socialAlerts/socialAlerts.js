// ================================================================
//  AURA BOT v2.0 — Social Alerts System (Premium)
//  Platforms: Twitch, YouTube, Reddit, RSS, Twitter/X,
//             Instagram, TikTok, Bluesky, Kick, Podcast
// ================================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';
import RSSParser      from 'rss-parser';
import axios          from 'axios';
import logger         from '../../utils/logger.js';
import dns            from 'node:dns/promises';
import net            from 'node:net';

const rssParser = new RSSParser();

// ═══════════════════════════════════════════════════════════════
//  SSRF protection
//
//  `identifier` is a free-form user string that the bot fetches
//  server-side (RSS feeds, platform APIs). Before ANY network call
//  it must be proven to point at a public address of a supported
//  platform — otherwise a guild admin could point the bot at
//  http://169.254.169.254/ and read the response back out of an embed.
// ═══════════════════════════════════════════════════════════════

// Hosts the bot already talks to for the platform APIs. Plain `http` is
// only accepted for these — every other identifier has to be `https`.
const KNOWN_HOSTS = new Set([
  'reddit.com', 'www.reddit.com', 'old.reddit.com', 'np.reddit.com',
  'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be',
  'googleapis.com', 'www.googleapis.com',
  'twitch.tv', 'www.twitch.tv', 'm.twitch.tv', 'clips.twitch.tv',
  'id.twitch.tv', 'api.twitch.tv',
  'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
  'instagram.com', 'www.instagram.com',
  'tiktok.com', 'www.tiktok.com',
  'bsky.app', 'www.bsky.app', 'bsky.social',
  'kick.com', 'www.kick.com',
]);

// Per-platform host allow-list: a URL identifier has to live on one of the
// platform's own domains. 'rss'/'podcast' monitor arbitrary feeds, so they
// accept any host — but only a public one (see assertPublicHost).
const PLATFORM_HOSTS = {
  reddit:    ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'np.reddit.com'],
  youtube:   ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
  twitch:    ['twitch.tv', 'www.twitch.tv', 'm.twitch.tv', 'clips.twitch.tv'],
  twitter:   ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
  instagram: ['instagram.com', 'www.instagram.com'],
  tiktok:    ['tiktok.com', 'www.tiktok.com'],
  bluesky:   ['bsky.app', 'www.bsky.app', 'bsky.social'],
  kick:      ['kick.com', 'www.kick.com'],
  rss:       null,
  podcast:   null,
};

// Platforms whose identifier is a plain account name / channel id.
const HANDLE_PLATFORMS = new Set(['reddit', 'youtube', 'twitch', 'twitter', 'instagram', 'tiktok', 'bluesky', 'kick']);
// Platforms whose identifier is a feed URL.
const URL_PLATFORMS = new Set(['rss', 'podcast']);

const HANDLE_RE = /^[A-Za-z0-9_.-]{1,64}$/;
const DNS_TIMEOUT_MS = 5000;

/** True for every address that must never be reached from the outside. */
function isPrivateIPv4(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b, c] = p;
  if (a === 0) return true;                                    // 0.0.0.0/8   "this network"
  if (a === 10) return true;                                   // 10/8        private
  if (a === 127) return true;                                  // 127/8       loopback
  if (a === 169 && b === 254) return true;                     // 169.254/16  link-local (cloud metadata!)
  if (a === 172 && b >= 16 && b <= 31) return true;            // 172.16/12   private
  if (a === 192 && b === 168) return true;                      // 192.168/16  private
  if (a === 100 && b >= 64 && b <= 127) return true;            // 100.64/10   CGNAT
  if (a === 192 && b === 0) return true;                        // 192.0/24    IETF protocol assignments
  if (a === 192 && b === 88 && c === 99) return true;           // 192.88.99/24 6to4 relay anycast
  if (a === 198 && (b === 18 || b === 19)) return true;         // 198.18/15   benchmarking
  if (a === 198 && b === 51 && c === 100) return true;          // 198.51.100/24 TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true;           // 203.0.113/24 TEST-NET-3
  if (a >= 224) return true;                                   // multicast / reserved / broadcast
  return false;
}

function isPrivateIPv6(ip) {
  const v = ip.toLowerCase().split('%')[0];      // strip the zone index
  if (v === '::' || v === '::1') return true;
  const mapped = v.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);   // ::ffff:127.0.0.1 → loopback
  if (v.startsWith('fe80')) return true;          // link-local
  if (/^f[cd]/.test(v)) return true;               // fc00::/7 unique local
  if (v.startsWith('ff')) return true;             // multicast
  if (v.startsWith('2001:db8')) return true;       // documentation
  if (v.startsWith('64:ff9b')) return true;        // NAT64 (embeds a v4 address)
  return false;
}

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true;                                     // unknown format → refuse
}

/** host === allowed || host is a subdomain of allowed */
function hostAllowed(host, allowed) {
  return allowed.some((h) => host === h || host.endsWith(`.${h}`));
}

/** Resolve a hostname and refuse loopback / private / link-local / reserved targets. */
async function assertPublicHost(host) {
  if (!host) return { ok: false, reason: 'The URL has no host.' };

  if (net.isIP(host)) {
    if (isPrivateAddress(host)) return { ok: false, reason: `"${host}" is a private or reserved address.` };
    return { ok: true };
  }

  let timer;
  try {
    const records = await Promise.race([
      dns.lookup(host, { all: true, verbatim: true }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('dns timeout')), DNS_TIMEOUT_MS);
        timer.unref?.();
      }),
    ]);

    if (!records?.length) return { ok: false, reason: `Could not resolve "${host}".` };
    for (const record of records) {
      if (isPrivateAddress(record.address)) {
        return { ok: false, reason: `"${host}" resolves to a private or reserved address.` };
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: `Could not resolve "${host}".` };
  } finally {
    clearTimeout(timer);
  }
}

/** The account name a platform URL points at (last path segment). */
function handleFromUrl(url) {
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) return null;
  return segments[segments.length - 1].replace(/^@/, '') || null;
}

/**
 * Validate a social-alert identifier BEFORE it is ever fetched.
 * @returns {Promise<{ ok: true, identifier: string } | { ok: false, reason: string }>}
 */
export async function validateAlertIdentifier(platform, identifier) {
  const key = String(platform || '').toLowerCase();
  const raw = String(identifier ?? '').trim();

  if (!raw) return { ok: false, reason: 'The identifier is empty.' };
  if (!(key in PLATFORM_HOSTS) && !URL_PLATFORMS.has(key)) {
    return { ok: false, reason: `Unsupported platform "${platform}".` };
  }

  const looksLikeUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) || raw.startsWith('//');

  if (looksLikeUrl) {
    let url;
    try {
      url = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
    } catch {
      return { ok: false, reason: 'That does not look like a valid URL.' };
    }

    const scheme = url.protocol.replace(':', '').toLowerCase();
    const host   = url.hostname.toLowerCase().replace(/\.$/, '');

    if (scheme !== 'https' && scheme !== 'http') {
      return { ok: false, reason: `Unsupported URL scheme "${scheme}://" — use https://.` };
    }
    if (scheme === 'http' && !KNOWN_HOSTS.has(host)) {
      return { ok: false, reason: 'Plain http:// is only allowed for the supported platform hosts — use https://.' };
    }

    const allowed = PLATFORM_HOSTS[key];
    if (allowed && !hostAllowed(host, allowed)) {
      return { ok: false, reason: `A ${key} identifier must point at ${allowed[0]} (got "${host}").` };
    }

    const publicCheck = await assertPublicHost(host);
    if (!publicCheck.ok) return publicCheck;

    if (HANDLE_PLATFORMS.has(key)) {
      const handle = handleFromUrl(url);
      if (!handle || !HANDLE_RE.test(handle)) {
        return { ok: false, reason: `Could not read a ${key} account name from that URL.` };
      }
      return { ok: true, identifier: handle };
    }

    return { ok: true, identifier: url.toString() };
  }

  // Not a URL.
  if (URL_PLATFORMS.has(key)) {
    return { ok: false, reason: `A ${key} feed needs a full https:// URL.` };
  }
  if (!HANDLE_RE.test(raw) || raw.includes('..')) {
    return { ok: false, reason: 'That does not look like a valid account name or URL.' };
  }
  if (net.isIP(raw)) {
    return { ok: false, reason: 'An IP address is not a valid account name.' };
  }
  return { ok: true, identifier: raw };
}

// Monotonic alert id — Date.now() alone collides when two alerts are created
// within the same millisecond (the wrong row would then be removed/tested).
let alertIdSeq = 0;
function nextAlertId() {
  alertIdSeq = (alertIdSeq + 1) % 1000;
  return String(Date.now() * 1000 + alertIdSeq);
}

// ─── /social command ─────────────────────────────────────────
export const social = {
  data: new SlashCommandBuilder()
    .setName('social')
    .setDescription('Manage social media alerts [Premium]')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s
      .setName('add')
      .setDescription('Add a social media alert')
      .addStringOption(o => o
        .setName('platform')
        .setDescription('Platform to monitor')
        .setRequired(true)
        .addChoices(
          { name: '🟣 Twitch',    value: 'twitch' },
          { name: '🔴 YouTube',   value: 'youtube' },
          { name: '🟠 Reddit',    value: 'reddit' },
          { name: '📡 RSS Feed',  value: 'rss' },
          { name: '🐦 Twitter/X', value: 'twitter' },
          { name: '📷 Instagram', value: 'instagram' },
          { name: '🎵 TikTok',   value: 'tiktok' },
          { name: '🦋 Bluesky',  value: 'bluesky' },
          { name: '🎮 Kick',     value: 'kick' },
          { name: '🎙️ Podcast',  value: 'podcast' },
        )
      )
      .addStringOption(o => o.setName('identifier').setDescription('Username / Channel ID / URL').setRequired(true))
      .addChannelOption(o => o.setName('channel').setDescription('Alert channel').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Custom alert message ({name}, {url}, {title})'))
      .addRoleOption(o => o.setName('ping').setDescription('Role to ping'))
    )
    .addSubcommand(s => s
      .setName('remove')
      .setDescription('Remove a social alert')
      .addIntegerOption(o => o.setName('id').setDescription('Alert ID').setRequired(true))
    )
    .addSubcommand(s => s.setName('list').setDescription('List all social alerts'))
    .addSubcommand(s => s
      .setName('test')
      .setDescription('Test a social alert')
      .addIntegerOption(o => o.setName('id').setDescription('Alert ID').setRequired(true))
    ),

  userPermissions: [PermissionFlagsBits.ManageGuild],
  botPermissions:  [PermissionFlagsBits.SendMessages],
  premiumTier:     1,
  guildOnly:       true,
  cooldown:        5000,

  async execute(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const sub = interaction.options.getSubcommand();

    const isPremium = await checkPremium(client, interaction.guildId);
    if (!isPremium) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'premium', description: '⭐ Social Alerts require **Aura Premium**.' })] });
    }

    // Store alerts in Redis/Guild settings
    const alertsKey = `social:alerts:${interaction.guildId}`;

    if (sub === 'add') {
      const platform   = interaction.options.getString('platform');
      const identifier = interaction.options.getString('identifier');
      const channel    = interaction.options.getChannel('channel');
      const message    = interaction.options.getString('message');
      const pingRole   = interaction.options.getRole('ping');

      const alerts = await client.redis.getJSON(alertsKey) || [];

      if (alerts.length >= 50) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: '⚠️ Maximum of 50 social alerts per server.' })] });
      }

      // Validate the identifier BEFORE anything is stored — the bot fetches it
      // server-side, so an unvalidated value would be an SSRF hole.
      const validation = await validateAlertIdentifier(platform, identifier);
      if (!validation.ok) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ ${validation.reason}` })] });
      }
      const safeIdentifier = validation.identifier;

      const id   = nextAlertId();
      const alert = { id, platform, identifier: safeIdentifier, channelId: channel.id, message, pingRoleId: pingRole?.id, lastPostId: null, enabled: true };
      alerts.push(alert);

      await client.redis.setJSON(alertsKey, alerts, 86400 * 30);
      try {
        const { GuildSettings } = client.db.models;
        const [s] = await GuildSettings.findOrCreate({ where: { guildId: interaction.guildId } });
        await s.update({ socialAlertsConfig: { ...(s.socialAlertsConfig || {}), alerts } });
      } catch {}

      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Alert **#${id}** added!\n**Platform:** ${platform}\n**Account:** ${safeIdentifier}\n**Channel:** <#${channel.id}>` })] });
    }

    if (sub === 'remove') {
      const id     = interaction.options.getInteger('id');
      const alerts = await client.redis.getJSON(alertsKey) || [];
      const idx    = alerts.findIndex(a => String(a.id) === String(id));

      if (idx === -1) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Alert not found.' })] });
      alerts.splice(idx, 1);
      await client.redis.setJSON(alertsKey, alerts, 86400 * 30);
      try {
        const { GuildSettings } = client.db.models;
        const [s] = await GuildSettings.findOrCreate({ where: { guildId: interaction.guildId } });
        await s.update({ socialAlertsConfig: { ...(s.socialAlertsConfig || {}), alerts } });
      } catch {}
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Alert #${id} removed.` })] });
    }

    if (sub === 'list') {
      const alerts = await client.redis.getJSON(alertsKey) || [];
      if (!alerts.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: '📭 No social alerts configured.' })] });

      const platformEmojis = { twitch: '🟣', youtube: '🔴', reddit: '🟠', rss: '📡', twitter: '🐦', instagram: '📷', tiktok: '🎵', bluesky: '🦋', kick: '🎮', podcast: '🎙️' };

      const fields = alerts.slice(0, 20).map(a => ({
        name:  `${platformEmojis[a.platform] || '📱'} #${a.id} — ${a.platform}`,
        value: `**Account:** ${a.identifier}\n**Channel:** <#${a.channelId}>${a.pingRoleId ? `\n**Ping:** <@&${a.pingRoleId}>` : ''}`,
        inline: false,
      }));

      return interaction.editReply({ embeds: [buildEmbed({ type: 'info', title: `📱 Social Alerts (${alerts.length})`, fields })] });
    }

    if (sub === 'test') {
      const id     = interaction.options.getInteger('id');
      const alerts = await client.redis.getJSON(alertsKey) || [];
      const alert  = alerts.find(a => String(a.id) === String(id));
      if (!alert) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Alert not found.' })] });

      const channel = await client.channels.fetch(alert.channelId).catch(() => null);
      if (!channel) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Alert channel not found.' })] });

      await sendSocialAlert(client, channel, alert, {
        title: `🧪 Test Post from ${alert.identifier}`,
        description: 'This is a test alert from Aura Bot.',
        url: 'https://discord.com',
        thumbnail: null,
      });

      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Test alert sent to <#${channel.id}>!` })] });
    }
  },
};

// ─── Send Social Alert ───────────────────────────────────────
async function sendSocialAlert(client, channel, alert, data) {
  const platformColors = {
    twitch: 0x9146FF, youtube: 0xFF0000, reddit: 0xFF4500,
    rss: 0xFFA500, twitter: 0x1DA1F2, instagram: 0xE1306C,
    tiktok: 0x000000, bluesky: 0x0085FF, kick: 0x53FC18, podcast: 0x8B5CF6,
  };
  const platformEmojis = {
    twitch: '🟣 Twitch', youtube: '🔴 YouTube', reddit: '🟠 Reddit',
    rss: '📡 RSS', twitter: '🐦 Twitter/X', instagram: '📷 Instagram',
    tiktok: '🎵 TikTok', bluesky: '🦋 Bluesky', kick: '🎮 Kick', podcast: '🎙️ Podcast',
  };

  const content = alert.pingRoleId ? `<@&${alert.pingRoleId}>` : undefined;

  let description = alert.message
    ? alert.message.replace(/{name}/g, alert.identifier).replace(/{url}/g, data.url || '').replace(/{title}/g, data.title || '')
    : `**${alert.identifier}** just posted!`;

  const embed = buildEmbed({
    type:        'info',
    color:       platformColors[alert.platform] || 0x5865F2,
    title:       `${platformEmojis[alert.platform] || '📱'} — ${data.title?.slice(0, 256) || alert.identifier}`,
    description,
    thumbnail:   data.thumbnail || null,
    fields:      data.url ? [{ name: '🔗 Link', value: data.url, inline: false }] : [],
    timestamp:   true,
  });

  await channel.send({ content, embeds: [embed] });
}

// ─── Background Checker (called every 5 minutes) ────────────
export async function checkSocialAlerts(client) {
  try {
    const guilds = client.guilds.cache;
    for (const [guildId] of guilds) {
      const alertsKey = `social:alerts:${guildId}`;
      let alerts = await client.redis.getJSON(alertsKey);

      if (!alerts?.length) {
        try {
          const { GuildSettings } = client.db.models;
          const s = await GuildSettings.findOne({ where: { guildId } });
          if (s?.socialAlertsConfig?.alerts?.length) {
            alerts = s.socialAlertsConfig.alerts;
            await client.redis.setJSON(alertsKey, alerts, 86400 * 30).catch(() => {});
          }
        } catch {}
      }

      if (!alerts?.length) continue;

      for (const alert of alerts) {
        if (!alert.enabled) continue;

        try {
          await checkSingleAlert(client, guildId, alert, alertsKey, alerts);
        } catch (err) {
          logger.debug(`[Social] Error checking ${alert.platform}/${alert.identifier}: ${err.message}`);
        }
      }
    }
  } catch (err) {
    logger.warn('[Social] checkSocialAlerts error:', err.message);
  }
}

async function checkSingleAlert(client, guildId, alert, alertsKey, allAlerts) {
  let newPost = null;

  // Re-validate on every pass — rows stored before this validation existed
  // (or written by another path) must never be fetched blindly.
  const validation = await validateAlertIdentifier(alert.platform, alert.identifier);
  if (!validation.ok) {
    logger.debug(`[Social] Skipping ${alert.platform}/${alert.identifier}: ${validation.reason}`);
    return;
  }
  const identifier = validation.identifier;

  if (alert.platform === 'rss' || alert.platform === 'podcast') {
    const feed = await rssParser.parseURL(identifier).catch(() => null);
    if (!feed?.items?.length) return;

    const latest = feed.items[0];
    const latestId = latest.guid || latest.link;
    if (latestId === alert.lastPostId) return;
    newPost = { id: latestId, title: latest.title, url: latest.link, description: latest.contentSnippet?.slice(0, 300) };
  }

  if (alert.platform === 'reddit') {
    const url  = `https://www.reddit.com/r/${encodeURIComponent(identifier)}/new.json?limit=1`;
    const res  = await axios.get(url, { headers: { 'User-Agent': process.env.REDDIT_USER_AGENT || 'AuraBot/2.0' } }).catch(() => null);
    const post = res?.data?.data?.children?.[0]?.data;
    if (!post || post.id === alert.lastPostId) return;
    newPost = { id: post.id, title: post.title, url: `https://reddit.com${post.permalink}`, thumbnail: post.thumbnail !== 'self' ? post.thumbnail : null };
  }

  if (alert.platform === 'youtube' && process.env.YOUTUBE_API_KEY) {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', channelId: identifier, order: 'date', maxResults: 1, key: process.env.YOUTUBE_API_KEY },
    }).catch(() => null);
    const item = res?.data?.items?.[0];
    if (!item || item.id.videoId === alert.lastPostId) return;
    newPost = {
      id:        item.id.videoId,
      title:     item.snippet.title,
      url:       `https://youtu.be/${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails?.high?.url,
    };
  }

  if (alert.platform === 'twitch' && process.env.TWITCH_CLIENT_ID) {
    // Check if streamer went live
    const tokenRes = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: { client_id: process.env.TWITCH_CLIENT_ID, client_secret: process.env.TWITCH_CLIENT_SECRET, grant_type: 'client_credentials' }
    }).catch(() => null);
    if (!tokenRes) return;

    const streamRes = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(identifier)}`, {
      headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${tokenRes.data.access_token}` }
    }).catch(() => null);

    const stream = streamRes?.data?.data?.[0];
    if (!stream) return; // Not live
    if (stream.id === alert.lastPostId) return; // Already alerted

    newPost = { id: stream.id, title: `${identifier} is LIVE: ${stream.title}`, url: `https://twitch.tv/${identifier}`, thumbnail: stream.thumbnail_url?.replace('{width}', '320').replace('{height}', '180') };
  }

  if (!newPost) return;

  // Send alert
  const channel = await client.channels.fetch(alert.channelId).catch(() => null);
  if (channel?.isTextBased()) {
    await sendSocialAlert(client, channel, alert, newPost);
  }

  // Update lastPostId
  alert.lastPostId = newPost.id || Date.now().toString();
  const idx = allAlerts.findIndex(a => String(a.id) === String(alert.id));
  if (idx !== -1) {
    allAlerts[idx] = alert;
    await client.redis.setJSON(alertsKey, allAlerts, 86400 * 30);
  }
}

async function checkPremium(client, guildId) {
  try {
    const { GuildSettings } = client.db.models;
    const s = await GuildSettings.findOne({ where: { guildId } });
    return (s?.premiumTier || 0) > 0;
  } catch { return false; }
}

export default social;
