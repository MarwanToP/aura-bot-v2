# 🟩 Deploy Aura Bot v2 to Square Cloud (100% Free 24/7)

Square Cloud is designed specifically for Discord Bots and Node.js applications with **NO Credit Card / Visa required**.

Your project has already been auto-configured with the official [squarecloud.app](file:///d:/aura-bot-v2/squarecloud.app) configuration file.

---

## ⚡ 3-Step Deployment Guide (~2 min)

### Step 1: Login to Square Cloud
1. Open **[squarecloud.app/dashboard](https://squarecloud.app/dashboard)** in your browser.
2. Complete the Cloudflare verification if prompted, and click **Login with Discord**.

---

### Step 2: Upload Project
Choose one of the 2 easy options:

#### Option A: Direct GitHub Import (Recommended)
1. Click **Add Application** → Select **GitHub**.
2. Select repository `MarwanToP/aura-bot-v2` and branch `main`.
3. Square Cloud will automatically detect your [squarecloud.app](file:///d:/aura-bot-v2/squarecloud.app) config file.

#### Option B: Upload Zip File
1. Zip your project files (excluding `node_modules`).
2. On Square Cloud Dashboard, click **Upload Application** and drop your `.zip` file.

---

### Step 3: Set Environment Variables
Go to **Application Settings** → **Environment Variables** (or `.env` section) and paste your credentials:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
REDIS_TLS=true
GEMINI_API_KEY=your_gemini_key
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
MODE=BOTH
```

Click **Start / Commit** → Your Discord bot and web dashboard will be online 24/7!
