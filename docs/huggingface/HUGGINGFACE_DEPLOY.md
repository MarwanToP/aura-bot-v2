# 🚀 Deploy Aura Bot v2 to Hugging Face Spaces (100% Free 24/7)

Hugging Face Spaces provides **100% FREE 24/7 Docker containers** (2 vCPU, 16GB RAM) with **NO credit card / Visa required**.

This repository is pre-configured with Hugging Face Docker metadata in `README.md` and `Dockerfile`.

---

## 📋 Step 1: Create a Hugging Face Space (~2 min)

1. Open **[huggingface.co/new-space](https://huggingface.co/new-space)** in your browser (sign up if needed).
2. Configure your space settings:
   - **Owner**: Your Hugging Face Username
   - **Space Name**: `aura-bot-v2`
   - **License**: `mit`
   - **Select Space SDK**: 🐳 **Docker**
   - **Choose a Docker Template**: **Blank**
   - **Space Hardware**: **CPU Basic (Free - 2 vCPU, 16GB RAM)**
   - **Space Visibility**: **Public** or **Private** (Environment secrets remain hidden even in public spaces!)
3. Click **Create Space**.

---

## 🔗 Step 2: Connect GitHub or Push Code (~1 min)

### Option A: Direct GitHub Sync (Recommended)
1. Go to your new Space's **Settings** tab.
2. Scroll to **Repository** → Click **Connect GitHub**.
3. Select `MarwanToP/aura-bot-v2` and branch `main`.
4. Enable **Auto-Sync**.

### Option B: Push directly to Hugging Face Git
Run these commands in your local project terminal:
```bash
git remote add hf https://huggingface.co/spaces/YOUR_HF_USERNAME/aura-bot-v2
git push hf main
```

---

## 🔑 Step 3: Add Secrets & Environment Variables (~3 min)

Go to your Space **Settings** → **Variables and Secrets**.

### Add Secrets (Click "New Secret" for each):

| Secret Name | Value | Description |
|---|---|---|
| `DISCORD_TOKEN` | `Bot Token` | From Discord Developer Portal |
| `DISCORD_CLIENT_ID` | `App Client ID` | From Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | `App Secret` | From Discord Developer Portal |
| `DATABASE_URL` | `postgresql://...` | Neon PostgreSQL Connection string |
| `REDIS_URL` | `rediss://...` | Upstash Redis Connection string |
| `REDIS_TLS` | `true` | Required for Upstash Redis TLS |
| `GEMINI_API_KEY` | `AI Key` | Google Gemini API Key |
| `SESSION_SECRET` | `Random 32-char string` | Session Encryption Key |
| `JWT_SECRET` | `Random 32-char string` | JWT Signing Key |

### Add Variables (Click "New Variable" for each):

| Variable Name | Value |
|---|---|
| `MODE` | `BOTH` |
| `PORT` | `7860` |
| `TRUST_PROXY` | `true` |
| `DASHBOARD_URL` | `https://YOUR_HF_USERNAME-aura-bot-v2.hf.space` |
| `DISCORD_CALLBACK_URL` | `https://YOUR_HF_USERNAME-aura-bot-v2.hf.space/auth/discord/callback` |
| `DASHBOARD_CORS_ORIGIN` | `https://YOUR_HF_USERNAME-aura-bot-v2.hf.space` |

---

## ⚡ Step 4: Verify Uptime

1. Click **Restart Space** or save your secrets.
2. Hugging Face will build the Docker container using your [Dockerfile](file:///d:/aura-bot-v2/Dockerfile).
3. Check the **App** and **Logs** tabs:
   - Logs should display `[System] Initializing Aura Core | Mode: BOTH` followed by `Discord bot logged in`.
   - Your Discord Bot status will change to **Online**.
   - Your Web Dashboard will open at `https://YOUR_HF_USERNAME-aura-bot-v2.hf.space`.

---

## 🎯 Discord Developer Portal Setup

Make sure to add your Hugging Face Callback URL to your Discord App:
1. Open [Discord Developer Portal](https://discord.com/developers/applications).
2. Select your Bot App → **OAuth2** → **Redirects**.
3. Add: `https://YOUR_HF_USERNAME-aura-bot-v2.hf.space/auth/discord/callback`
4. Click **Save Changes**.

---

### 🎉 Your Bot & Web Dashboard are now live 24/7 with zero sleeping and zero credit card required!
