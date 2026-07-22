# 🚀 Deploy Aura Bot to Koyeb + Render (24/7)

Code is already pushed. **You only need to do 2 one-time setups (~5 min total).** After that, every `git push origin main` auto-deploys to both.

---

## ✅ What's already done (by me)

- ✅ `koyeb.yaml` at repo root — full env var set, free tier, Frankfurt region
- ✅ `render.yaml` at repo root — 3 services (worker / dashboard / all-in-one)
- ✅ `Dockerfile` — Node 20 Alpine, healthcheck-aware
- ✅ GitHub Actions — triggers Koyeb/Render redeploy on push
- ✅ Pushed commit `ae48078` to `main` on `MarwanToP/aura-bot-v2`

---

## 🪶 1. Koyeb (5 min, one-time)

Open this in Brave:
**https://app.koyeb.com/apps/new**

Steps:
1. **Sign in** with GitHub (one click — Koyeb will request access to your repos)
2. Choose **"Deploy from GitHub"** → select `MarwanToP/aura-bot-v2` → branch `main`
3. Koyeb will detect `koyeb.yaml` automatically — just click **Deploy**
4. While it builds, click **Settings → Environment Variables** and paste these secrets (from your local `.env`):

   | Key | Value |
   |---|---|
   | `DISCORD_TOKEN` | (from your .env) |
   | `DISCORD_CLIENT_ID` | (from your .env) |
   | `DISCORD_CLIENT_SECRET` | (from your .env) |
   | `DATABASE_URL` | (from your .env) |
   | `REDIS_URL` | (from your .env) |
   | `GEMINI_API_KEY` | (from your .env) |
   | `CLOUDFLARE_ACCOUNT_ID` | (from your .env) |
   | `CLOUDFLARE_API_TOKEN` | (from your .env) |
   | `TELEGRAM_BOT_TOKEN` | (from your .env) |
   | `TELEGRAM_CHAT_ID` | (from your .env) |
   | `SESSION_SECRET` | (from your .env) |
   | `JWT_SECRET` | (from your .env) |

   Mark each one as **Secret**.
5. After first deploy, copy the public URL (e.g. `https://aura-bot-xyz.koyeb.app`) and update in Koyeb env vars:
   - `DASHBOARD_URL` = `https://aura-bot-xyz.koyeb.app`
   - `DISCORD_CALLBACK_URL` = `https://aura-bot-xyz.koyeb.app/auth/discord/callback`
   - `DASHBOARD_CORS_ORIGIN` = `https://aura-bot-xyz.koyeb.app`
6. **Redeploy** → bot is online 24/7.

> **Free tier caveat:** Koyeb's `free` instance has limited monthly hours and cold-starts. For real 24/7, upgrade to `small` (~$7/mo). You can change this in Koyeb → Service → Settings → Instance Type.

---

## 🎨 2. Render (3 min, one-time, optional backup)

Open this in Brave:
**https://dashboard.render.com/blueprints**

Steps:
1. **Sign in** with GitHub
2. Click **"New Blueprint Instance"** → connect `MarwanToP/aura-bot-v2` → branch `main`
3. Render will detect `render.yaml` and offer **3 services**:
   - `aura-bot-worker` (BOT mode, **starter** plan)
   - `aura-dashboard-web` (DASHBOARD mode, **starter** plan)
   - `aura-bot-allinone` (BOTH mode, **free** plan) ← **enable this one for free 24/7**
4. Click **Apply** → Render will ask for the same secret env vars as above
5. After deploy, copy the `aura-bot-allinone` URL and update its env vars:
   - `DASHBOARD_URL` / `DISCORD_CALLBACK_URL` / `DASHBOARD_CORS_ORIGIN` → all = the allinone URL
6. **Manual deploy** → bot is online 24/7.

> **Free tier caveat:** Render free spins down after 15 min idle. To stay 24/7 free, hit the URL every 14 min OR upgrade to starter ($7/mo). The `keep-alive.yml` workflow pings it every 10 min — check if it's enabled.

---

## 🔁 After both are live

From now on, every time you do:
```
git add .
git commit -m "..."
git push origin main
```

→ GitHub Actions builds a fresh Docker image
→ Koyeb auto-redeploys (via the `koyeb.yaml` config)
→ Render auto-redeploys (via `render.yaml` + `autoDeploy: true`)

No more manual deploys. 24/7.

---

## 🛟 If something breaks

| Symptom | Fix |
|---|---|
| Bot not connecting to Discord | Check `DISCORD_TOKEN` is correct + marked Secret in Koyeb/Render |
| Dashboard OAuth loop | `DISCORD_CALLBACK_URL` must match exactly the deployed URL + `/auth/discord/callback` |
| `EADDRINUSE` in logs | You're running two instances on the same port. Disable `aura-bot-worker` in Render if using allinone. |
| Memory crash on free tier | Upgrade to `small` (Koyeb) or `starter` (Render) |
| Koyeb cold start | Expected on free tier. Upgrade to small for always-warm. |

---

## 🔐 After you're live — rotate secrets

Your `.env` was exposed during this setup. **Once the bot is online, regenerate these on their source platforms:**
- Discord: revoke + regenerate bot token (https://discord.com/developers/applications)
- Neon: rotate DB password
- Upstash: rotate Redis password
- Cloudflare: roll API token
- Telegram: revoke bot via @BotFather
- Gemini: create new key

Then update the new values in Koyeb + Render env vars, redeploy. Old values become useless.
