# Project: Aura Bot v2 — Enterprise Dashboard & Backend Integration

## Architecture
Aura Bot v2 is an Enterprise Discord Intelligence & Management Platform built with Node.js (`bot/`, `shared/systems/`) and Next.js 14 (`dashboard/`).
System modules live in `shared/systems/`.
Dashboard components & pages live in `dashboard/`.
Main scripts: `npm run lint:syntax`, `npm run audit:commands`, Next.js build.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Architecture Assessment | Read existing codebase in `shared/systems/`, `dashboard/`, `bot/`, `package.json` | None | IN_PROGRESS |
| 2 | M1: Security & Anti-Nuke Module | Heat scoring, Quarantine Vault, Anti-Raid, Bot Add Lock, Webhook Protection (`shared/systems/antinuke`, UI & API) | M1 | PLANNED |
| 3 | M2: Moderation & Audit Module | Auto-Mod, Warning/Ban Appeals, Audit Log Viewer (`shared/systems/moderation`, UI & API) | M1 | PLANNED |
| 4 | M3: Verification Gateway Module | Web/Captcha verification, Alt-account detection (`shared/systems/verification`, UI & API) | M1 | PLANNED |
| 5 | M4: Ticketing & Applications Module | Skill-routed Ticket Panels, HTML Transcripts, Form Builder (`shared/systems/tickets`, `shared/systems/applications`, UI & API) | M1 | PLANNED |
| 6 | M5: Voice Topologies Module | Ephemeral Voice Channels ("Join to Create"), Control Panel, Voice-Text Sync (`shared/systems/voice`, UI & API) | M1 | PLANNED |
| 7 | M6: Social Alerts & Notifications Module | YouTube, Twitch, Kick, Twitter/X, RSS Feed Manager (`shared/systems/social`, UI & API) | M1 | PLANNED |
| 8 | M7: Gamification & Economy Module | Time-Decay Leveling, Leaderboards, Daily Streaks, Virtual Server Shop (`shared/systems/leveling`, `shared/systems/economy`, UI & API) | M1 | PLANNED |
| 9 | M8: Growth & Invite Analytics Module | Invite Attribution, Fake Invite Shield, Invite Leaderboards (`shared/systems/invites`, UI & API) | M1 | PLANNED |
| 10 | M9: Server Counter Channels Module | Dynamic Stats Counters (Members, Bots, Online, Goals) (`shared/systems/counters`, UI & API) | M1 | PLANNED |
| 11 | M10: Polls & Governance Module | Democratic Role-Weighted Polls, Anonymous Single-Vote System (`shared/systems/polls`, UI & API) | M1 | PLANNED |
| 12 | M11: Dashboard Navigation, Layout & Aesthetic Polish | Next.js 14 `#09090b` glassmorphism layout, navigation tabs, global toggle controls, shared config contracts | M1-M10 | PLANNED |
| 13 | M12: System Integration & Full Verification | `npm run lint:syntax`, `npm run audit:commands`, Next.js build verification | M1-M11 | PLANNED |

## Interface Contracts
- All 10 unified modules mirror single-source-of-truth configuration models in `shared/systems/` with zero redundant parameters.
- Dashboard API routes (`dashboard/app/api/...`) interface with `shared/systems/` backend contracts.
- Next.js dashboard UI (`dashboard/app/...` / `dashboard/components/...`) features modern dark mode (`#09090b`), glassmorphism, responsive navigation tabs, interactive live toggle controls, and modal builders.

## Code Layout
- `shared/systems/`: Backend business logic for all 10 unified feature modules
- `dashboard/`: Next.js 14 web dashboard (App Router, Tailwind CSS, Framer Motion)
- `bot/`: Discord bot slash commands and event handlers interacting with shared systems
- `main.js`: Primary bot initialization script
