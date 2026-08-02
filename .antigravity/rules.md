# Aura Bot v2 — Repository Hygiene & Development Guidelines

This repository follows a strict modular monorepo architecture. All AI tools, developer contributions, and automated scripts MUST adhere to the structural and hygiene rules defined below.

---

## 1. Directory Structure Standards

```
aura-bot-v2/
├── .antigravity/                 # System guidelines & AI instruction rules
│   └── rules.md                  # Permanent repository standards (this file)
├── .github/                      # CI/CD workflows and GitHub templates
├── apps/                         # Standalone Application Services
│   ├── bot/                      # Discord Bot Service (@aura/bot)
│   │   └── src/                  # Bot entrypoint, commands, events, modules
│   ├── dashboard/                # Web Dashboard Service (@aura/dashboard)
│   │   └── src/                  # Server entrypoint, REST API, UI components
│   └── ai-worker/                # Neural Engine AI Worker (@aura/ai-worker)
│       └── src/                  # Gemini 1.5 Flash pipeline & queues
├── packages/                     # Shared Internal Utility Packages
│   ├── config/                   # @aura/config (Zod environment schemas & global config)
│   ├── database/                 # @aura/database (Prisma schema & Neon PostgreSQL connection)
│   ├── redis/                    # @aura/redis (Upstash Redis client & atomic helpers)
│   └── logger/                   # @aura/logger (Centralized Winston logger)
├── deploy/                       # Deployment & Infrastructure Configuration
│   ├── docker/                   # Dockerfile and docker-compose configurations
│   ├── platform-configs/         # Render, Railway, Koyeb, Cloudflare deployment configs
│   └── scripts/                  # Deployment & maintenance scripts
├── docs/                         # Documentation & Migration Runbooks
├── .env.example                  # Validated environment variable blueprint
├── .gitignore                    # Secrets & build output exclusion rules
└── package.json                  # Root monorepo workspace configuration
```

---

## 2. File Placement Rules

1. **Discord Bot Code**:
   - MUST reside inside `apps/bot/src/`.
   - Slash & prefix commands live in `apps/bot/src/commands/`.
   - Event listeners live in `apps/bot/src/events/`.
   - Feature modules (TempVoice, AntiNuke, Verification) live in `apps/bot/src/modules/`.

2. **Web Dashboard Code**:
   - MUST reside inside `apps/dashboard/src/`.
   - Express server entrypoint lives in `apps/dashboard/src/server.js`.
   - REST API routes live in `apps/dashboard/src/api/`.
   - Middleware (auth, security, rate-limiting) lives in `apps/dashboard/src/middleware/`.
   - React / Next UI components live in `apps/dashboard/src/components/` or `apps/dashboard/src/app/`.

3. **Shared Modules**:
   - Shared utilities, config schemas, database models, and loggers MUST reside under `packages/`.
   - NO shared business logic or global utility scripts may float in the project root.

4. **Scripts & Platform Deployment**:
   - Deployment scripts, migration scripts, and maintenance scripts live in `deploy/scripts/`.
   - Hosting platform manifests (Render, Railway, Koyeb, Cloudflare) live in `deploy/platform-configs/`.

---

## 3. Root Cleanliness

The repository root MUST be kept clean and contain ONLY essential root configuration files:
- `package.json`
- `.env.example`
- `.gitignore`
- `README.md`
- `Dockerfile`
- `docker-compose.yml`

NO loose `.js`, `.ts`, `.py`, `.png`, or temporary build files may be placed in the repository root.

---

## 4. Git & Security Hygiene

- Never commit secrets, tokens, or local credentials.
- Ensure `.env`, `node_modules/`, `.next/`, `build/`, `dist/`, and log files are listed in `.gitignore`.
- Run syntax and lint checks (`npm run lint:syntax`) before pushing code to GitHub.
