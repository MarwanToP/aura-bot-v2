import 'dotenv/config';
import axios from 'axios';
import nodemailer from 'nodemailer';
import logger from '../../utils/logger.js';
import redis from '../../database/redis.js';
import database from '../../database/index.js';

class MonitorService {
  constructor() {
    this.telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
    this.alertEmail = process.env.ALERT_EMAIL;
    this.components = ['bot', 'dashboard', 'database'];
    this.isAlerting = false;

    if (this.telegramToken && this.telegramChatId) {
      this.sendAlert(`🚀 **Aura Core Activated** | Monitoring synchronized across all quadrants.`);
    } else {
      logger.warn('[Monitor] Telegram credentials missing. Alerts will be disabled.');
    }
  }

  /**
   * Update the heartbeat of a component in Redis
   * @param {string} component - 'bot' or 'dashboard'
   */
  async updateHeartbeat(component) {
    try {
      const key = `aura:monitor:heartbeat:${component}`;
      await redis.set(key, Date.now());
      // logger.debug(`[Monitor] Heartbeat updated for ${component}`);
    } catch (err) {
      logger.error(`[Monitor] Failed to update heartbeat for ${component}:`, err.message);
    }
  }

  /**
   * Start sending heartbeats for the current process
   * @param {string} component - 'bot' or 'dashboard'
   */
  startHeartbeat(component) {
    logger.info(`[Monitor] Starting heartbeat for ${component}...`);
    this.updateHeartbeat(component);
    setInterval(() => this.updateHeartbeat(component), 60000); // Every minute
  }

  /**
   * Check all components and send alerts if any are offline
   */
  async checkServices() {
    for (const comp of this.components) {
      try {
        if (comp === 'database') {
          await database.authenticate();
          const statusKey = `aura:monitor:alerted:database`;
          const wasAlerted = await redis.get(statusKey);
          if (wasAlerted) {
             await this.sendAlert(`✅ **Recovery**: **DATABASE** connection restored.`);
             await redis.del(statusKey);
          }
          continue;
        }

        const key = `aura:monitor:heartbeat:${comp}`;
        const lastSeen = await redis.get(key);
        const now = Date.now();

        // If no heartbeat found or it's older than 3 minutes
        if (!lastSeen || (now - parseInt(lastSeen)) > 180000) {
          const statusKey = `aura:monitor:alerted:${comp}`;
          const alreadyAlerted = await redis.get(statusKey);

          if (!alreadyAlerted) {
            const timeDiff = lastSeen ? Math.round((now - parseInt(lastSeen)) / 1000) : 'unknown';
            const msg = `⚠️ **[CRITICAL] Aura Bot Monitor** ⚠️\n\nComponent **${comp.toUpperCase()}** appears to be OFFLINE.\nLast seen: ${timeDiff} seconds ago.\n\nPlease check the logs and restart the service if necessary.`;
            
            logger.warn(`[Monitor] Alerting for ${comp}: Component appears offline.`);
            await this.sendAlert(msg);
            await redis.setex(statusKey, 3600, 'true'); // Don't spam alert for 1 hour
          }
        } else {
          // If it was down but now it's up, we could send a "recovery" alert here
          const statusKey = `aura:monitor:alerted:${comp}`;
          const wasAlerted = await redis.get(statusKey);
          if (wasAlerted) {
            await this.sendAlert(`✅ **Recovery**: Component **${comp.toUpperCase()}** is back online.`);
            await redis.del(statusKey);
          }
        }
      } catch (err) {
        logger.error(`[Monitor] Check failed for ${comp}:`, err.message);
        
        // Handle database specific failure
        if (comp === 'database') {
          const statusKey = `aura:monitor:alerted:database`;
          const alreadyAlerted = await redis.get(statusKey);
          if (!alreadyAlerted) {
            await this.sendAlert(`⚠️ **[CRITICAL] Aura Bot Monitor** ⚠️\n\n**DATABASE** connection FAILED.\nThe bot and dashboard may not function correctly.\nError: ${err.message}`);
            await redis.setex(statusKey, 3600, 'true');
          }
        }
      }
    }
  }

  /**
   * Start the monitoring loop (should only run in Dashboard or a dedicated process)
   */
  startAlertLoop() {
    logger.info('[Monitor] Starting alert monitoring loop (3-minute interval)...');
    setInterval(() => this.checkServices(), 180000); // Check every 3 minutes
  }

  /**
   * Eternal Pulse — Keeps Render services awake 24/7.
   * Pings the Bot and Dashboard URLs every 10 minutes.
   */
  async startPulse() {
    const dashboardUrl = process.env.DASHBOARD_URL;
    const botUrl = process.env.BOT_URL || `http://localhost:${process.env.PORT || 3000}`;

    logger.info(`[Pulse] Neural Heartbeat active: Keeping services awake.`);

    const ping = async () => {
      try {
        if (dashboardUrl) await axios.get(`${dashboardUrl.replace(/\/$/, '')}/api/health`, { timeout: 5000 }).catch(() => {});
        if (botUrl) await axios.get(`${botUrl.replace(/\/$/, '')}/api/health`, { timeout: 5000 }).catch(() => {});
        logger.debug('[Pulse] 💓 Heartbeat sync successful.');
      } catch (err) {
        // Silently fail as some services take time to wake up
      }
    };

    // Initial ping and then every 10 minutes
    ping();
    setInterval(ping, 10 * 60 * 1000);
  }

  /**
   * Send alert via configured channels
   * @param {string} message 
   */
  async sendAlert(message) {
    if (this.isAlerting) return;
    this.isAlerting = true;

    try {
      // 1. Telegram
      if (this.telegramToken && this.telegramChatId) {
        await axios.post(`https://api.telegram.org/bot${this.telegramToken}/sendMessage`, {
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: 'Markdown',
        }, { timeout: 10000 }).catch(err => logger.error('[Monitor] Telegram Alert Failed:', err.response?.data || err.message));
      }

      // 2. Email
      if (process.env.SMTP_HOST && this.alertEmail) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_PORT == 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Aura Monitor" <${process.env.SMTP_USER}>`,
          to: this.alertEmail,
          subject: '⚠️ Aura Bot Alert: Component Offline',
          text: message.replace(/\*\*/g, ''), // Strip markdown for email text
          html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #ff4d4d; border-radius: 8px;">
            <h2 style="color: #d63031;">Aura Bot Alert</h2>
            <p>${message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
          </div>`,
        }).catch(err => logger.error('[Monitor] Email Alert Failed:', err.message));
      }
    } finally {
      this.isAlerting = false;
    }
  }
}

export default new MonitorService();
