import axios from 'axios';
import logger from '../../utils/logger.js';

/**
 * Pulse System — Keeps Render services from spinning down.
 * Pings the Bot and Dashboard URLs every 13 minutes.
 */
export async function startPulse() {
  const urls = [
    process.env.DASHBOARD_URL,
    process.env.BOT_URL // The bot creates its own health URL
  ].filter(url => url && url.startsWith('http'));

  if (urls.length === 0) {
    logger.warn('[Pulse] No valid URLs found for heartbeat. Skipping.');
    return;
  }

  logger.info(`[Pulse] Neural Heartbeat active for: ${urls.join(', ')}`);

  // Initial pulse
  sendPulse(urls);

  // Repeat every 13 minutes (Render timeout is 15m)
  setInterval(() => sendPulse(urls), 13 * 60 * 1000);
}

async function sendPulse(urls) {
  for (const url of urls) {
    try {
      await axios.get(`${url.replace(/\/$/, '')}/api/health`);
      logger.debug(`[Pulse] 💓 Signal sent to ${url}`);
    } catch (err) {
      logger.debug(`[Pulse] ⚠️ Signal failed for ${url} (Service might be waking up)`);
    }
  }
}
