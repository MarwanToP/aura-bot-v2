// ================================================================
//  AURA BOT v2.0 — Keep-Alive Pinger
//  Prevents free-tier hosts (Render, etc.) from sleeping the service
// ================================================================
import https from 'https';
import http  from 'http';
import logger from './utils/logger.js';

/**
 * Pings the bot's own web dashboard every 14 minutes.
 * Render free tier sleeps after 15 min of inactivity — this prevents it.
 * Railway/Fly.io don't need this, but it doesn't hurt.
 */
export function startKeepAlive() {
  const rawUrl = process.env.DASHBOARD_URL || process.env.RENDER_EXTERNAL_URL || process.env.RAILWAY_PUBLIC_DOMAIN;
  if (!rawUrl) {
    logger.warn('[KeepAlive] No public URL set — skipping self-ping (local mode)');
    return;
  }

  // Normalise to full URL
  const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  const pingUrl = `${url}/api/health`;

  const INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

  const ping = () => {
    const client = pingUrl.startsWith('https') ? https : http;
    const req = client.get(pingUrl, (res) => {
      logger.debug(`[KeepAlive] Pinged ${pingUrl} → ${res.statusCode}`);
    });
    req.on('error', (err) => {
      logger.warn(`[KeepAlive] Ping failed: ${err.message}`);
    });
    req.setTimeout(10_000, () => req.destroy());
  };

  // First ping after 1 minute, then every 14 minutes
  setTimeout(() => {
    ping();
    setInterval(ping, INTERVAL_MS);
  }, 60_000);

  logger.info(`[KeepAlive] ✓ Self-ping every 14 min → ${pingUrl}`);
}
