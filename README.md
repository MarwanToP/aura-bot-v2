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

```
aura-bot-v2/
├── bot/                       # All Discord Bot Logic
│   ├── cogs/                  # Modular Command Modules (admin, ai, fun, games, management, mod, premium, utility)
│   ├── core/                  # Main Bot Client, Command Loader & Event Loader
│   ├── events/                # Discord Event Listeners (ready, interactionCreate, messageCreate, etc.)
│   └── utils/                 # Bot-specific utilities
├── dashboard/                 # Web Dashboard & Public Assets
│   ├── server.js              # Express + Socket.IO REST/Realtime Backend
│   ├── cloudflare-worker.js   # Cloudflare Edge Worker integration
│   └── public/                # Web Frontend Assets & UI pages
├── shared/                    # Code shared between Bot and Dashboard
│   ├── config/                # Environment & Configuration Schemas
│   ├── database/              # PostgreSQL Sequelize & Redis Models
│   ├── locales/               # Internationalization i18n JSON files
│   ├── scripts/               # Structured Maintenance, Tests & Deployment Scripts
│   ├── systems/               # Decoupled Core Systems (AI, Economy, Tickets, Leveling, Voice)
│   └── utils/                 # Shared Logger, Embed Builder, Permissions
├── docs/                      # Documentation & Architecture Specifications
└── main.js                    # Unified Entry Point (Split-Core Orchestration)
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
MODE=BOTH
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DATABASE_URL=postgresql://user:password@localhost:5432/auradb
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your_super_secret_session_key
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Run Concurrently
Run both the Bot and Dashboard concurrently via the main orchestrator:
```bash
npm start
```
Or with auto-reload in development:
```bash
npm run dev
```

---

## 🎛️ Operational Modes

| Command | Mode | Description |
| :--- | :--- | :--- |
| `MODE=BOTH node main.js` | BOTH | Runs both Discord Bot and Web Dashboard concurrently in a single process. |
| `MODE=BOT node main.js` | BOT | Runs Discord Bot worker only (with health check endpoint). |
| `MODE=DASHBOARD node main.js` | DASHBOARD | Runs Web Dashboard Express server only. |

---

## 🧪 Testing & Verification Scripts

```bash
# Run syntax linter across all JS files (/bot, /dashboard, /shared)
npm run lint:syntax

# Perform static audit on all 50+ slash commands
npm run audit:commands

# Run full smoke tests (Bot commands + Dashboard health endpoint)
npm run test:smoke

# Run end-to-end command mock test harness
npm run test:e2e
```

---

## ☁️ Production Deployment

### WispByte + Cloudflare Deployment
- **Bot & Dashboard Host**: Deployed on **WispByte** application node using `main.js` (`MODE=BOTH` or split `MODE=BOT` / `MODE=DASHBOARD`).
- **Edge Routing & CDN**: Proxy web traffic through **Cloudflare** Worker (`dashboard/cloudflare-worker.js`) for SSL, DDoS protection, and global edge caching.

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
