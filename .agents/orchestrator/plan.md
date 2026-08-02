# Project Plan — Aura Bot v2 Enterprise Dashboard & Backend Integration

## Objective
Synthesize and integrate 14 Discord bot dashboard feature domains into 10 unified, non-overlapping modules in Next.js 14 dashboard and backend without feature duplication.

## Unified Module Matrix (14 Bots -> 10 Unified Modules)
1. **Security & Anti-Nuke**: Heat scoring, Quarantine Vault, Anti-Raid, Bot Add Lock, Webhook Protection (Wick, Vetox, Security Bot)
2. **Moderation & Audit**: Auto-Mod, Warning/Ban Appeals, Audit Log Viewer (Dyno, ProBot)
3. **Verification Gateway**: Web/Captcha verification, Alt-account detection (Security Bot, Wick)
4. **Ticketing & Applications**: Skill-routed Ticket Panels, HTML Transcripts, Custom Application Form Builder (Ticket Tool, Appy)
5. **Voice Topologies**: Ephemeral Voice Channels ("Join to Create"), Control Panel, Voice-Text Sync (TempVoice)
6. **Social Alerts & Notifications**: YouTube, Twitch, Kick, Twitter/X, RSS Feed Manager (NotifyMe, MEE6)
7. **Gamification & Economy**: Time-Decay Leveling, Leaderboards, Daily Streaks, Virtual Server Shop (MEE6, ProBot, Fizbo)
8. **Growth & Invite Analytics**: Invite Attribution, Fake Invite Shield, Invite Leaderboards (Invite Tracker)
9. **Server Counter Channels**: Dynamic Stats Counters (Members, Bots, Online, Goals) (ServerStats)
10. **Polls & Governance**: Democratic Role-Weighted Polls, Anonymous Single-Vote System (Mr. Poll)

## Execution Strategy
1. **Phase 1: Codebase & Architecture Baseline Exploration**
   - Explorer analyzes `dashboard/` layout, Next.js 14 setup, Tailwind CSS, Framer Motion, shared system contracts in `shared/systems/`, and npm scripts.

2. **Phase 2: Implementation of 10 Unified Modules & Backend Contracts**
   - For each module:
     - Worker implements backend API route(s) and shared system contracts in `shared/systems/` and `dashboard/app/api/...`.
     - Worker implements high-aesthetic Next.js UI component(s) (`#09090b` dark mode, glassmorphism, responsive navigation tabs, live toggle controls, modals).
     - Worker verifies linting & builds.
     - Reviewer and Auditor verify code quality and integrity.

3. **Phase 3: Dashboard Navigation, Global Layout & Toggle Controls**
   - Implement responsive tab navigation, global sidebar/header with glassmorphism aesthetic (`#09090b`), and live module toggle master controls.

4. **Phase 4: Full System Integration & Verification**
   - `npm run lint:syntax` passes clean across `/bot`, `/dashboard`, `/shared`.
   - `npm run audit:commands` passes clean across all registered slash commands.
   - Next.js dashboard builds clean (`npm run build` or `npm run build:dashboard`).
