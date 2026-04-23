// ================================================================
//  AURA BOT v2.0 — Social Alerts System (Premium)
//  Platforms: Twitch, YouTube, Reddit, RSS, Twitter/X,
//             Instagram, TikTok, Bluesky, Kick, Podcast
// ================================================================

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';
import RSSParser      from 'rss-parser';
import axios          from 'axios';
import logger         from '../../utils/logger.js';

const rssParser = new RSSParser();

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
  premiumTier:     1,
  guildOnly:       true,
  cooldown:        5000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
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

      const id   = Date.now();
      const alert = { id, platform, identifier, channelId: channel.id, message, pingRoleId: pingRole?.id, lastPostId: null, enabled: true };
      alerts.push(alert);

      await client.redis.setJSON(alertsKey, alerts, 86400 * 30);

      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Alert **#${id}** added!\n**Platform:** ${platform}\n**Account:** ${identifier}\n**Channel:** <#${channel.id}>` })] });
    }

    if (sub === 'remove') {
      const id     = interaction.options.getInteger('id');
      const alerts = await client.redis.getJSON(alertsKey) || [];
      const idx    = alerts.findIndex(a => a.id === id);

      if (idx === -1) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Alert not found.' })] });
      alerts.splice(idx, 1);
      await client.redis.setJSON(alertsKey, alerts, 86400 * 30);
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
      const alert  = alerts.find(a => a.id === id);
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
      const alerts    = await client.redis.getJSON(alertsKey);
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

  if (alert.platform === 'rss' || alert.platform === 'podcast') {
    const feed = await rssParser.parseURL(alert.identifier).catch(() => null);
    if (!feed?.items?.length) return;

    const latest = feed.items[0];
    if (latest.guid === alert.lastPostId) return;
    newPost = { title: latest.title, url: latest.link, description: latest.contentSnippet?.slice(0, 300) };
  }

  if (alert.platform === 'reddit') {
    const url  = `https://www.reddit.com/r/${alert.identifier}/new.json?limit=1`;
    const res  = await axios.get(url, { headers: { 'User-Agent': process.env.REDDIT_USER_AGENT || 'AuraBot/2.0' } }).catch(() => null);
    const post = res?.data?.data?.children?.[0]?.data;
    if (!post || post.id === alert.lastPostId) return;
    newPost = { title: post.title, url: `https://reddit.com${post.permalink}`, thumbnail: post.thumbnail !== 'self' ? post.thumbnail : null };
  }

  if (alert.platform === 'youtube' && process.env.YOUTUBE_API_KEY) {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', channelId: alert.identifier, order: 'date', maxResults: 1, key: process.env.YOUTUBE_API_KEY },
    }).catch(() => null);
    const item = res?.data?.items?.[0];
    if (!item || item.id.videoId === alert.lastPostId) return;
    newPost = {
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

    const streamRes = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${alert.identifier}`, {
      headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${tokenRes.data.access_token}` }
    }).catch(() => null);

    const stream = streamRes?.data?.data?.[0];
    if (!stream) return; // Not live
    if (stream.id === alert.lastPostId) return; // Already alerted

    newPost = { title: `${alert.identifier} is LIVE: ${stream.title}`, url: `https://twitch.tv/${alert.identifier}`, thumbnail: stream.thumbnail_url?.replace('{width}', '320').replace('{height}', '180') };
  }

  if (!newPost) return;

  // Send alert
  const channel = await client.channels.fetch(alert.channelId).catch(() => null);
  if (channel?.isTextBased()) {
    await sendSocialAlert(client, channel, alert, newPost);
  }

  // Update lastPostId
  alert.lastPostId = newPost.id || Date.now().toString();
  const idx = allAlerts.findIndex(a => a.id === alert.id);
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
