# Aura Bot v2 Monorepo Migration Guide

## Monorepo Restructuring Overview

Aura Bot v2 has been restructured into a modular monorepo format:

- `apps/bot/`: Discord Bot service entrypoint and handlers (`src/index.js`)
- `apps/dashboard/`: Web Dashboard REST API and Socket.io server (`src/server.js`)
- `apps/ai-worker/`: Asynchronous Gemini 1.5 Flash AI Worker pipeline (`src/gemini/pipeline.js`)
- `packages/config/`: Centralized Zod schema validation for environment variables
- `packages/database/`: Prisma ORM schema & client for Neon PostgreSQL
- `packages/redis/`: Upstash Redis client with atomic rate-limiting counter logic
- `packages/logger/`: Centralized structured logger (Winston)
- `deploy/`: Infrastructure & platform configuration files (`docker/`, `platform-configs/`)

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and populate required variables:
   - `DISCORD_TOKEN`
   - `DATABASE_URL`
   - `REDIS_URL`
   - `GEMINI_API_KEY`
   - `JWT_SECRET`

3. **Database Migration**:
   ```bash
   npm run db:generate
   ```

4. **Running Services**:
   - Start Discord Bot: `npm run start:bot`
   - Start Web Dashboard: `npm run start:dashboard`
   - Run Syntax Check: `npm run lint:syntax`
