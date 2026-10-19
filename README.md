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
aura-bot-v2/                   # ESM monorepo (npm workspaces)
├── apps/
│   ├── bot/                   # Discord Bot Service
│   │   └── src/
│   │       ├── index.js       # Bot entrypoint (gateway client, boot health check)
│   │       ├── commands/      # Slash command modules (admin, ai, fun, games, general, management, moderation, premium, utility)
│   │       ├── core/          # Command loader & shared bot core
│   │       ├── events/        # Discord event listeners (interactionCreate, messageCreate, ...)
│   │       ├── handlers/      # Interaction & command dispatch handlers
│   │       └── modules/       # Bot-specific feature modules
│   ├── dashboard/             # Web Dashboard (Next.js UI + Express/Socket.IO backend)
│   │   ├── src/server.js      # Dashboard entrypoint (REST API + Socket.IO + Next.js)
│   │   ├── src/api/           # REST route modules (auth, guilds, modules, commands, stats)
│   │   ├── src/components/    # Dashboard UI components
│   │   └── public/            # Static assets served by the edge worker
│   └── ai-worker/             # Asynchronous AI moderation worker
│       └── src/index.js       # Worker entrypoint (drains the aura:ai:jobs queue)
├── packages/                  # Code shared between Bot, Dashboard & Worker
│   ├── config/                # Environment schema & configuration (Zod)
│   ├── database/              # PostgreSQL (Prisma/Sequelize) & Redis models
│   ├── redis/                 # Redis client, pub/sub & job queue helpers
│   ├── locales/               # Internationalization i18n JSON files
│   ├── logger/                # Shared structured logger (Winston)
│   ├── systems/               # Decoupled Core Systems (AI, Economy, Tickets, Leveling, Voice, Health, ...)
│   └── utils/                 # Shared embeds, permissions, card generator
├── deploy/                    # Infrastructure & platform manifests
│   ├── platform-configs/      # Railway, Render, Koyeb, disCloud, Square Cloud, Cloudflare
│   └── scripts/               # Maintenance, test & deployment scripts
├── docs/                      # Documentation & Architecture Specifications
└── package.json               # Workspace root (npm scripts, dependencies)
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

### 3. Run the Stack
Every service has its own npm script (see the root `package.json`):
```bash
npm start              # Discord bot only (apps/bot/src/index.js)
npm run start:dashboard # Web dashboard only (apps/dashboard/src/server.js)
npm run start:worker   # AI worker only (apps/ai-worker/src/index.js)
npm run dev            # bot + dashboard + AI worker, concurrently
npm run dev:bot        # bot + AI worker (no dashboard)
```

The AI worker is not optional: without it the `aura:ai:jobs` queue is never
drained and no moderation action is ever applied.

---

## 🎛️ Operational Modes

| Command | Runs | Description |
| :--- | :--- | :--- |
| `npm start` | Bot | Discord bot worker (gateway client, command loader, event handlers). |
| `npm run start:dashboard` | Dashboard | Web dashboard only — Express REST API, Socket.IO telemetry and the Next.js UI. |
| `npm run start:worker` | Worker | AI worker only — asynchronous Gemini moderation pipeline. |
| `npm run dev` | Bot + Dashboard + Worker | All three services concurrently, with auto-reload. |
| `npm run dev:bot` | Bot + Worker | Everything except the dashboard. |

---

## 🧪 Testing & Verification Scripts

```bash
# Run the syntax linter across all JS files (apps/, packages/, deploy/)
npm run lint:syntax

# Perform a static audit on every slash command
npm run audit:commands

# Run the offline smoke gate (lint:syntax + audit:commands + command harness)
npm run test:smoke

# Run the slash-command mock harness on its own
npm run test:commands
```

Live checks (they need real credentials in `.env`):
```bash
npm run test:db         # database model/schema integrity
npm run test:db:types   # column type / primary-key drift
npm run test:live       # full runtime audit (gateway login, permissions, DB, Redis, AI)
```

---

## ☁️ Production Deployment

### Platform manifests
Ready-to-use manifests live in `deploy/platform-configs/`:

| Platform | File | Start command |
| :--- | :--- | :--- |
| Railway | `railway.json` | `node apps/bot/src/index.js` |
| disCloud | `discloud.config` | `MAIN=apps/bot/src/index.js` |
| Square Cloud | `squarecloud.app` | `MAIN=apps/bot/src/index.js` (`START=npm start`) |
| Render / Koyeb | `render.yaml`, `koyeb.yaml` | Docker (`Dockerfile` → `npm start`) |

All three bot hosts start the bot entrypoint `apps/bot/src/index.js` — there is
no root `main.js` in this repository. The dashboard is a separate service
(`apps/dashboard/src/server.js`); run it as its own container/worker.

### WispByte + Cloudflare Deployment
- **Bot & Dashboard Host**: Deployed on **WispByte** application nodes — the bot runs `npm start` (`apps/bot/src/index.js`) and the dashboard runs `npm run start:dashboard` (`apps/dashboard/src/server.js`).
- **Edge Routing & CDN**: Proxy web traffic through the **Cloudflare** Worker (`wrangler.toml` → `deploy/scripts/cloudflare/setup-cloudflare-zone.mjs`) for SSL, DDoS protection, and global edge caching.

---

## 🎛️ Command Control & Role Settings

Aura Bot v2 includes per-guild command management and role visibility controls directly from the Web Dashboard.

### Features:
- **Enable / Disable Commands**: Toggle individual slash commands on or off for your server in real-time.
- **Role Restrictions**: Restrict command execution to specific Discord Role IDs. If configured, only members with one of the allowed roles can execute the command.
- **Bot Enforcement**: Direct real-time permission check during interaction creation with immediate user feedback via ephemeral embeds.
- **Redis Cache Invalidation**: Guild-scoped settings are cached in Redis and invalidated on write — the AI-moderation toggle lives under `aura:guild:<guildId>:config` (TTL 300s), the auto-responder rules under `autoresponder:<guildId>`, and social alert state under `social:alerts:<guildId>`. Command enable/disable flags and role allowlists are read from the database (`CommandSettings`) on every interaction, so a dashboard change takes effect on the next command use. AI moderation results travel back to the bot over the `aura:moderation:actions` pub/sub channel.

---
© 2026 Aura Innovations. Enterprise Discord Intelligence Platform.
