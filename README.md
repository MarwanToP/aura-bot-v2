# 💠 Aura Bot v2.0 — Enterprise Modular Architecture

A state-of-the-art Discord Intelligence Platform and Web Dashboard rebuilt with a 1,000,000x clean separation of concerns, high-concurrency sharding, and real-time telemetry.

---

## 🛠️ Tech Stack & Hosting

- **Runtime**: Node.js v20 (ESM)
- **Discord Framework**: discord.js v14
- **AI Engine**: Google Gemini API
- **Database & Cache**: PostgreSQL + Upstash Redis (atomic caching & real-time sync)
- **Dashboard**: Express.js + Socket.IO + Next.js / Tailwind UI
- **Primary Hosting**: **WispByte** (Bot Node & Dedicated Backend)
- **Edge Routing & CDN**: **Cloudflare** (Edge Front Door & Workers)

---

## 📦 Project Architecture

npm-workspaces monorepo:

```
aura-bot-v2/
├── apps/
│   ├── bot/         # Discord bot (commands, events, handlers) — entry: apps/bot/src/index.js
│   ├── dashboard/   # Express API + Socket.IO + Next.js UI — entry: apps/dashboard/src/server.js
│   └── ai-worker/   # Gemini AI worker — entry: apps/ai-worker/src/index.js
├── packages/        # Shared: config, database (Sequelize + Prisma), redis, logger, locales, systems, utils
├── deploy/          # Docker, platform configs, maintenance / test / deployment scripts
├── docs/            # Architecture, brand, deployment and UI specs
└── migrations/
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and configure your credentials:
```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DATABASE_URL=postgresql://user:password@localhost:5432/auradb
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Run
```bash
npm run start:bot        # Discord bot
npm run start:dashboard  # Dashboard server
npm run start:worker     # AI worker
npm run dev              # bot + dashboard together
```

---

## 🧪 Testing & Verification Scripts

```bash
# Run syntax linter across all JS files (apps/, packages/)
npm run lint:syntax

# Perform static audit on all 50+ slash commands
npm run audit:commands

# Run full smoke tests (Bot commands + Dashboard health endpoint)
npm run test:smoke

# Lint
npm run lint
```

---

## ☁️ Production Deployment

### WispByte + Cloudflare Deployment
- **Bot & Dashboard Host**: **WispByte** application node (run the bot and dashboard as separate processes via the `start:*` scripts).
- **Edge Routing & CDN**: Proxy web traffic through **Cloudflare** Worker (see `deploy/scripts/cloudflare` and `docs/cloudflare/`) for SSL, DDoS protection, and global edge caching.

---

## 🎛️ Command Control & Role Settings

Aura Bot v2 includes per-guild command management and role visibility controls directly from the Web Dashboard.

### Features:
- **Enable / Disable Commands**: Toggle individual slash commands on or off for your server in real-time.
- **Role Restrictions**: Restrict command execution to specific Discord Role IDs. If configured, only members with one of the allowed roles can execute the command.
- **Bot Enforcement**: Direct real-time permission check during interaction creation with immediate user feedback via ephemeral embeds.
- **Redis Cache Invalidation & Realtime Sync**: Instant updates across shards using Redis `aura:config_update` event publishing.

---
© 2026 Aura Innovations. Enterprise Discord Intelligence Platform.
