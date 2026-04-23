# 💠 Aura Bot v2.0 — Neural Intelligence Platform

State-of-the-Art Discord Intelligence and Management Platform.

## 🚀 Key Features
- **Neural Moderation**: AI-powered content analysis using Google Gemini 1.5 Flash.
*   **Holographic Dashboard**: Fully responsive web interface with real-time telemetry.
- **Split-Core Architecture**: Independent Bot and Web segments for maximum stability.
- **TempVoice**: Dynamic voice channel generation and management.
- **Professional Staff Office**: Advanced application and performance tracking system.
- **Global Economy & Levels**: Highly optimized gaming systems with Redis caching.

## 🛠️ Tech Stack
*   **Language**: Node.js v20 (ESM)
- **Discord API**: discord.js v14
- **AI Engine**: Google Gemini 1.5 Flash
- **Database**: PostgreSQL (Prisma/Sequelize) via Neon.tech
- **Cache Layer**: Upstash Redis (High Speed)
- **Dashboard**: Express.js + Socket.io + Vanilla CSS
*   **Hosting**: Render.com (Production)

## 📡 Essential Services & APIs
*   **Google AI**: Intent analysis, moderation, and command resolution.
- **Upstash**: Atomic state management and sharding cache.
- **Neon**: Persistent relational data storage.
- **Telegram Bot API**: Real-time service monitoring and crash alerts.
- **Discord OAuth2**: Secure user authentication for the dashboard.

## 📦 Project Structure
- `aura/` — Discord bot logic, commands, and events.
- `website/` — Web dashboard, API, and frontend assets.
- `shared/` — Common database models, AI service, and monitoring.

## ☁️ Render Deployment (24/7 Split Services)
Use two Render services from `render.yaml`:
- **Worker**: `aura-bot-worker` (`MODE=BOT`)
- **Web**: `aura-dashboard-web` (`MODE=DASHBOARD`)

> `MODE=BOTH` is still supported for local/dev single-process runs.

## ☁️ Cloudflare Migration (Edge Front Door)
If you are moving website traffic from Railway to Cloudflare, use:
- `wrangler.toml` (Worker + static assets + dynamic proxy routes)
- `website/cloudflare-worker.js`
- Guide: `docs/CLOUDFLARE_MIGRATION.md`
- Full integration runbook: `docs/CLOUDFLARE_COMPLETE_INTEGRATION.md`
- Automation scripts:
  - `npm run cf:zone:setup -- YOUR_DOMAIN https://YOUR_ORIGIN`
  - `npm run cf:zone:verify -- YOUR_DOMAIN ns1.cloudflare.com,ns2.cloudflare.com`

### 1) Deploy Bot Worker (Render Worker Service)
1. In Render, create Blueprint from this repo (`render.yaml`) or create a Docker Worker manually.
2. Confirm service uses:
   - `type: worker`
   - `dockerfilePath: ./Dockerfile`
   - `MODE=BOT`
3. Set required env vars:
   - `NODE_ENV=production`
   - `DISCORD_TOKEN`
   - `DATABASE_URL`
   - `REDIS_URL`
   - `REDIS_TLS` (`true` for Upstash)
   - `GEMINI_API_KEY` (if AI features enabled)
   - `JWT_SECRET`
   - Optional alerts: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
4. Deploy and verify logs show bot login + heartbeat started.

### 2) Deploy Dashboard Web (Render Web Service)
1. Confirm service uses:
   - `type: web`
   - `dockerfilePath: ./Dockerfile`
   - `MODE=DASHBOARD`
   - `healthCheckPath=/api/health`
2. Set required env vars:
   - `NODE_ENV=production`
   - `TRUST_PROXY=true`
   - `DASHBOARD_STRICT_STARTUP=true`
   - `DASHBOARD_COOKIE_SECURE=true`
   - `DATABASE_URL`
   - `REDIS_URL`
   - `REDIS_TLS` (`true` for Upstash)
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `DISCORD_TOKEN` (used by dashboard APIs needing bot access)
   - `SESSION_SECRET`
   - `JWT_SECRET`
   - `DASHBOARD_URL=https://<your-web-service>.onrender.com`
   - `DISCORD_CALLBACK_URL=https://<your-web-service>.onrender.com/auth/discord/callback`
   - `DASHBOARD_CORS_ORIGIN=https://<your-web-service>.onrender.com`
3. Deploy and verify `GET /api/health` returns `{ "status": "ok" }`.

### Monitoring Note
- **UptimeRobot is monitoring only** (HTTP checks + alerts).
- It does **not** host your bot or dashboard.

## 🧪 Monitoring & Health
Aura implements a dedicated `MonitorService` that tracks heartbeats for:
- Bot Logic Core
- Web Dashboard
- PostgreSQL Connection

**Telegram Alerts**: Integrated directly into the monitor to notify developers of service status, recoveries, and critical failures.

---
© 2026 Aura Innovations.
