# 🚀 Aura Bot v2.0 — Render Deployment Guide (24/7 Hosting)

This guide walks you through deploying **Aura Bot v2.0** to [Render.com](https://render.com) for 24/7 online hosting.

---

## 📑 Option 1: Automatic Blueprint Deployment (Recommended)

Render can automatically build and deploy all services using the included `render.yaml` blueprint.

### Steps:
1. Push your repository to **GitHub** or **GitLab**.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml` and prompt you to fill in the required environment variables:
   - `DISCORD_TOKEN`
   - `DATABASE_URL` (e.g. from Neon.tech or Render PostgreSQL)
   - `REDIS_URL` (e.g. from Upstash Redis or Render Redis)
   - `DISCORD_CLIENT_ID` & `DISCORD_CLIENT_SECRET` (if running dashboard)
   - `GEMINI_API_KEY` (if AI features are enabled)
6. Click **Apply**. Render will automatically build the Docker container and start your service!

---

## ⚡ Option 2: Free Tier Deployment (Single All-In-One Web Service)

If you are using Render's **Free Tier**, you can run both the Discord Bot and Web Dashboard inside a single Web Service.

### Steps:
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Select **Docker** as the Runtime.
5. Set **Build Command**: Leave blank (uses Dockerfile).
6. Under **Environment Variables**, add:
   | Key | Recommended Value / Details |
   | --- | --- |
   | `MODE` | `BOTH` (or `BOT` for bot only) |
   | `NODE_ENV` | `production` |
   | `DISCORD_TOKEN` | Your Bot Token |
   | `DATABASE_URL` | PostgreSQL URL (`postgresql://...`) |
   | `REDIS_URL` | Redis URL (`redis://...` or `rediss://...`) |
   | `REDIS_TLS` | `true` (if using Upstash) |
   | `DISCORD_CLIENT_ID` | OAuth2 Client ID |
   | `DISCORD_CLIENT_SECRET` | OAuth2 Client Secret |
   | `SESSION_SECRET` | Random 32+ character string |
   | `JWT_SECRET` | Random 32+ character string |
7. Set **Health Check Path**: `/api/health`
8. Click **Create Web Service**.

---

## 🔑 Required Environment Variables Overview

| Variable | Description |
| --- | --- |
| `DISCORD_TOKEN` | Discord Bot Token from [Discord Developer Portal](https://discord.com/developers/applications) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL |
| `REDIS_TLS` | Set to `true` when using Upstash Redis with TLS |
| `MODE` | Service mode: `BOT`, `DASHBOARD`, or `BOTH` |
| `PORT` | Set automatically by Render |
| `GEMINI_API_KEY` | Google Gemini API Key for AI moderation & commands |

---

## 🔍 Verification & Health Checks

Once deployed, you can verify your deployment status:
- **Bot Status**: Check Render deployment logs for `[Boot] Logging in...` and `[Shard 0] Successfully initialized ✓`.
- **Health Endpoint**: Access `https://<your-render-app>.onrender.com/api/health` to verify response `{"status": "ok"}`.
- **Local Pre-Flight Check**: Run `npm run render:check` locally anytime to verify readiness.

---
© 2026 Aura Innovations
