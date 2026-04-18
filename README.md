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
- `src/bot/` — Discord bot logic, commands, and events.
- `src/web/` — Web dashboard, API, and frontend assets.
- `src/shared/` — Common database models, AI service, and monitoring.
- `src/utils/` — Utility functions and professional logging.

## 🧪 Monitoring & Health
Aura implements a dedicated `MonitorService` that tracks heartbeats for:
- Bot Logic Core
- Web Dashboard
- PostgreSQL Connection

**Telegram Alerts**: Integrated directly into the monitor to notify developers of service status, recoveries, and critical failures.

---
© 2026 Aura Innovations.
