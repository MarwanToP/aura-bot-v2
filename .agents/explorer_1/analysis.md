# Aura Bot v2 — Comprehensive Codebase & Dashboard Integration Analysis Report

## Executive Summary
This report provides a thorough read-only architectural investigation of the **Aura Bot v2** codebase, covering the Express API server, Next.js dashboard, bot slash command cogs, shared system backends, database models, and maintenance/test scripts. The objective is to establish the baseline mapping for integrating all 10 unified feature modules into the cyber-minimal web dashboard (`dashboard/`).

---

## 1. Project Architecture & Available Scripts

### Root Project (`package.json`)
- **Version**: `2.0.0`
- **Main Entrypoint**: `main.js` (Bot startup)
- **Engine**: Node.js `>=18.0.0`
- **Key Dependencies**: `discord.js@^14.15.3`, `sequelize@^6.37.3`, `pg@^8.22.0`, `ioredis@^5.10.1`, `express@^4.19.2`, `passport-discord@^0.1.4`, `framer-motion@^12.4.7`, `lucide-react@^0.475.0`, `recharts@^2.15.1`, `i18next@^23.12.2`, `winston@^3.13.0`.
- **Maintenance & Test Scripts**:
  - `npm run lint:syntax`: Executes `shared/scripts/maintenance/check-syntax.js`. Scans `main.js`, `bot/`, `shared/`, `dashboard/` (ignoring JSX/frontend files). **Status**: Passed (95 JavaScript files checked cleanly).
  - `npm run audit:commands`: Executes `shared/scripts/maintenance/audit-commands.js`. Dynamically loads all bot cogs using stubbed Redis/i18n and checks slash command JSON structure, descriptions, options, and bounds. **Status**: Passed (54 commands loaded, 0 errors, 0 warnings).
  - `npm run dashboard`: Runs `node dashboard/server.js` (Express standalone backend with Discord OAuth, Redis session storage, and REST/WebSocket endpoints).
  - `npm run db:migrate`: Executes database migration script (`shared/scripts/deployment/migrate.js`).
  - `npm run test:smoke`: Runs syntax check, bot command smoke test, and website health smoke test.

### Dashboard Workspace (`dashboard/package.json`)
- **Version**: `0.1.0`
- **Frontend Stack**: Next.js `^16.2.12` (App Router), React `^19.2.8`, Tailwind CSS `^4` (`@tailwindcss/postcss`), Framer Motion `^12.42.2`, Lucide React `^0.475.0`, Recharts `^2.15.4`.
- **Scripts**:
  - `dev`: `next dev`
  - `build`: `next build`
  - `start`: `next start`
- **Build Status**: `next build` in `dashboard/` initially reported a missing `globals.css` import in `dashboard/app/layout.js` (located at root `app/globals.css`). Implementing agents must ensure `dashboard/app/globals.css` is present or properly imported during M11 UI polish.

---

## 2. Dashboard Directory Layout & Architecture

The web dashboard is situated in `dashboard/` with the following structure:

```
dashboard/
├── app/
│   ├── layout.js       # Cyber-minimal dark mode root layout (#09090b)
│   ├── page.js         # Main Dashboard Telemetry page with Framer Motion grid
│   └── globals.css     # Tailwind v4 import & custom glow utilities (needs creation)
├── components/
│   ├── AnalyticsChart.jsx   # Interactive Recharts area chart for message/member flow
│   ├── CommandSettings.jsx  # Individual command toggle and permission controls
│   ├── LiveConsole.jsx      # Socket.IO live mod log / telemetry log feed
│   ├── MetricsGrid.jsx      # Telemetry KPI cards (Guilds, Users, Uptime, Latency)
│   ├── ModuleSettings.jsx   # Basic high-level module toggle grid
│   └── Navbar.jsx           # Top navigation header with server selector & user avatar
├── public/                  # Static assets (banners, html fallbacks)
├── cloudflare-worker.js     # Edge proxy script for Cloudflare deployment
├── next.config.mjs          # Next.js configuration
├── postcss.config.mjs       # Tailwind CSS PostCSS plugin setup
└── server.js                # Standalone Express API backend (Port 3000)
```

### Backend API Server (`dashboard/server.js`)
`server.js` is an Express + Passport.js + Socket.IO + Redis server powering dashboard telemetry and REST endpoints.
- **Authentication**: Discord OAuth2 (`/auth/discord`, `/auth/discord/callback`, `/auth/logout`, `/api/me`) with `connect-redis` session store and strict state validation.
- **WebSocket**: Socket.IO server broadcasting live system metrics (every 10s) and Redis `aura:modlogs` channel events.
- **Existing REST Endpoints**:
  - `GET /api/health`, `GET /api/stats`
  - `GET /api/guilds`, `GET /api/guilds/:guildId`, `POST /api/guilds/:guildId` (Updates `GuildSettings`)
  - `GET /api/guilds/:guildId/overview` (Member flow telemetry)
  - `GET /api/guilds/:guildId/staff`, `GET /api/guilds/:guildId/fingerprints`, `GET /api/guilds/:guildId/analytics`
  - `GET /api/guilds/:guildId/leaderboard` (Economy top balances)
  - `GET/POST /api/guilds/:guildId/ticket-panels` (Ticket panel builder)
  - `GET /api/commands`, `GET /api/guilds/:guildId/commands`, `POST /api/guilds/:guildId/commands/:commandName/:action`
  - `GET/POST /api/guilds/:guildId/command-settings/:commandName`
  - `GET/POST /api/guilds/:guildId/aliases`
  - `GET/POST /api/guilds/:guildId/modules`
  - `POST /api/guilds/:guildId/premium/redeem`, `POST /api/guilds/:guildId/premium/activate`
  - `GET/POST /api/guilds/:guildId/backups`

---

## 3. Shared Systems Backends & Database Models

System backends live in `shared/systems/` and interface with PostgreSQL via Sequelize models defined in `shared/database/index.js`.

### System Files (`shared/systems/`)
1. `antinuke/` (`antiNuke.js`, `antiRaid.js`, `heatEngine.js`): Anti-nuke rate limiting, heat scoring, quarantine vault (`quarantineUser`), anti-raid join filters, bot add lock.
2. `applications/` (`applicationSystem.js`): Staff and member application forms.
3. `birthday/` (`birthdaySystem.js`): Birthday tracking and automated celebrations.
4. `customcommands/` (`customCommands.js`): Dynamic custom response builder.
5. `customization/` (`customizationSystem.js`): Guild branding and prefix settings.
6. `economy/` (`economySystem.js`): Virtual currency, daily streaks, gambling, server shop.
7. `giveaway/` (`giveawaySystem.js`): Reaction and button-based giveaways with requirements.
8. `leveling/` (`levelingSystem.js`): Experience points, time-decay leveling (`xpDecayEnabled`), rank cards, level rewards.
9. `logging/` (`loggingSystem.js`, `inviteTracker.js`): Audit logging, mod log dispatching, invite attribution & fake invite shield.
10. `monitor/` (`monitorService.js`): System metrics and process monitoring.
11. `polls/` (`pollSystem.js`): Single & multi-option democratic polls with role-weighted voting.
12. `reactionroles/` (`reactionRoleSystem.js`): Emoji to role mapping.
13. `socialAlerts/` (`socialAlerts.js`): YouTube, Twitch, Kick, Twitter/X, RSS notification manager.
14. `staff/` (`staffSystem.js`): Staff shift tracking (`StaffDuty`), fingerprint logs (`StaffFingerprint`), CSAT performance tracking.
15. `tickets/` (`ticketSystem.js`): Skill-based ticket routing, multi-tier escalation, CSAT surveys, HTML transcripts.
16. `voice/` (`voiceSystem.js`, `voiceAI.js`): Ephemeral temp voice channels ("Join to Create"), voice-text channel sync, voice activity logging.
17. `welcome/` (`welcomeSystem.js`): Welcome cards, custom canvas image layout, auto-roles.
18. `backgroundTasks.js`: Cron and interval jobs (counter channel updates, birthday announcements, temp voice cleanup, timed messages).

### Database Models (`shared/database/index.js`)
- `GuildSettings`, `UserProfile`, `ModerationCase`, `Warning`
- `Ticket`, `TicketCSAT`, `TicketPanel`
- `Economy`, `ShopItem`, `Inventory`
- `Giveaway`, `GiveawayEntry`, `Birthday`, `LevelReward`
- `AutoResponder`, `CustomCommand`, `ReactionRole`, `StarboardEntry`
- `InviteTrack`, `GuildCounter`, `Automation`, `TimedMessage`
- `Achievement`, `UserAchievement`, `TempChannel`
- `ApplicationForm`, `StaffApplication`, `StaffDuty`, `StaffFingerprint`
- `Suggestion`, `CommandSettings`

---

## 4. Bot Cogs & Commands (`bot/`)

Slash commands and event handlers are organized into cogs (`bot/cogs/`):
- `cogs/admin/`: `aesthetic.js`, `deliver.js`, `neural.js`, `reactionRoles.js`, `security.js`, `tpanel.js`
- `cogs/ai/`: `aiCommands.js`
- `cogs/fun/`: `funCommands.js`
- `cogs/games/`: `gameCommands.js`
- `cogs/management/`: `apply.js`, `staff.js`, `tickets.js`
- `cogs/moderation/`: `backup.js`, `caseManager.js`, `modCommands.js`, `security.js`, `serverTools.js`, `staff.js`
- `cogs/premium/`: `clan.js`, `economy.js`, `premiumCommands.js`
- `cogs/utility/`: `aura.js`, `autoresponder.js`, `infoCommands.js`, `invites.js`, `stats.js`, `suggest.js`, `utilityCommands.js`, `verify.js`, `voice.js`

Slash commands interact directly with `shared/systems/` backends and update single-source-of-truth settings in `GuildSettings`.

---

## 5. Comprehensive Mapping Against 10 Target Unified Dashboard Modules

| # | Target Module | Equivalent Competitors | Existing Backend & DB Models | Bot Commands | Express API Status | Dashboard UI Status | Gaps & Next Steps |
|---|---------------|-----------------------|------------------------------|--------------|--------------------|---------------------|-------------------|
| **M1** | **Security & Anti-Nuke** | Wick, Vetox, Security Bot | `shared/systems/antinuke/` (`antiNuke.js`, `antiRaid.js`, `heatEngine.js`), `GuildSettings` (`antiNukeEnabled`, `antiNukeConfig`, `antiRaidEnabled`) | `/security setup`, `/security status` in `cogs/moderation/security.js` | Partial (`POST /api/guilds/:guildId`). Missing dedicated `/api/guilds/:guildId/security` for heat parameters, quarantine vault list, bot add lock. | Basic toggle in `ModuleSettings.jsx`. Missing dedicated Security & Anti-Nuke panel with live heat meter and quarantine manager. | Add `/api/guilds/:guildId/security` endpoints and `SecurityModule.jsx` tab. |
| **M2** | **Moderation & Audit** | Dyno, ProBot | `shared/systems/logging/loggingSystem.js`, `ModerationCase`, `Warning`, `GuildSettings` (`autoModEnabled`, `aiModEnabled`, `aiModSensitivity`) | `/warn`, `/ban`, `/kick`, `/timeout`, `/casemanager` in `cogs/moderation/` | Partial (`/api/guilds/:guildId/fingerprints`, Socket.IO modlog stream). Missing case search & auto-mod rule API (`/api/guilds/:guildId/moderation`). | `LiveConsole.jsx` for logs. Missing Auto-Mod rule builder, warning history viewer, and appeal manager. | Build `ModerationModule.jsx` UI and backend API for Auto-Mod rules & case management. |
| **M3** | **Verification Gateway** | Security Bot, Wick | `cogs/utility/verify.js`, `events/verifyButton.js`, `GuildSettings` (`verificationEnabled`, `verificationRoleId`, `verificationChannelId`, `verificationMessageId`) | `/verify setup`, `/verify panel`, `/verify disable` | Generic `POST /api/guilds/:guildId`. Missing `/api/guilds/:guildId/verification` endpoint for captcha mode & alt age threshold. | Generic toggle only. Missing Captcha modal builder, alt detection settings, and panel previewer. | Implement `VerificationModule.jsx` UI and REST route. |
| **M4** | **Ticketing & Applications** | Ticket Tool, Appy | `shared/systems/tickets/ticketSystem.js`, `applications/applicationSystem.js`, `Ticket`, `TicketCSAT`, `TicketPanel`, `ApplicationForm` | `/tpanel`, `/tickets`, `/apply` | `GET/POST /api/guilds/:guildId/ticket-panels`. Missing transcript retrieval & application form endpoints (`/api/guilds/:guildId/applications`). | None (Only raw JSON endpoint exists). Missing Ticket Panel drag-and-drop builder, CSAT metric cards, and form editor. | Build `TicketingModule.jsx` UI with interactive panel modal and CSAT reporting. |
| **M5** | **Voice Topologies** | TempVoice | `shared/systems/voice/voiceSystem.js`, `voiceAI.js`, `TempChannel`, `GuildSettings` (`tempVoiceEnabled`, `tempVoiceCreatorId`, `tempVoiceCategoryId`, `tempVoiceNameTemplate`, `voiceTextLinkedChannelId`) | `/voice setup`, `/voice lock`, `/voice name` in `cogs/utility/voice.js` | Generic `POST /api/guilds/:guildId`. Missing `/api/guilds/:guildId/voice` endpoint for active temp channel state & template config. | Generic toggle only. Missing Voice Topology control panel (generator channel setup, template tag editor `{user}'s Room`, active room manager). | Build `VoiceModule.jsx` UI & API routes. |
| **M6** | **Social Alerts & Notifications** | NotifyMe, MEE6 | `shared/systems/socialAlerts/socialAlerts.js`, `GuildSettings` (`socialAlertsConfig`) | `/socialadd`, `/sociallist` in `cogs/utility/` | Missing dedicated `/api/guilds/:guildId/social-alerts` endpoint. | Generic toggle only. Missing feed manager UI (YouTube/Twitch/Kick/Twitter/RSS feed lists, ping role selectors, message templates). | Create `SocialAlertsModule.jsx` component & CRUD endpoints. |
| **M7** | **Gamification & Economy** | MEE6, ProBot, Fizbo | `shared/systems/leveling/levelingSystem.js`, `economy/economySystem.js`, `UserProfile`, `Economy`, `ShopItem`, `Inventory`, `LevelReward`, `Achievement` | `/rank`, `/leaderboard`, `/shop`, `/daily` in `cogs/premium/economy.js` | `GET /api/guilds/:guildId/leaderboard`. Missing shop items CRUD & level rewards API (`/api/guilds/:guildId/economy`). | Generic toggle. Missing Leaderboard table, Virtual Shop item manager, and XP time-decay curve chart. | Develop `GamificationModule.jsx` UI & API routes for shop & level rewards. |
| **M8** | **Growth & Invite Analytics** | Invite Tracker | `shared/systems/logging/inviteTracker.js`, `InviteTrack`, `GuildSettings` (`inviteTrackEnabled`) | `/invites`, `/inviter` in `cogs/utility/invites.js` | Missing `/api/guilds/:guildId/invites` analytics endpoint. | Generic toggle only. Missing Invite attribution dashboard (fake invite shield toggle, inviter leaderboard, join code trends). | Implement `GrowthModule.jsx` UI & invite analytics REST API. |
| **M9** | **Server Counter Channels** | ServerStats | `shared/systems/backgroundTasks.js`, `GuildCounter`, `GuildSettings` (`statsEnabled`, `statsMemberChannelId`, `statsOnlineChannelId`, `statsBotChannelId`) | `/stats setup`, `/stats update` in `cogs/utility/stats.js` | Missing `/api/guilds/:guildId/counters` configuration endpoint. | Generic toggle only. Missing Dynamic Counter Channel builder (Members, Online, Bots, Goal counters with custom title formatting). | Implement `CountersModule.jsx` UI & counter configuration API. |
| **M10** | **Polls & Governance** | Mr. Poll | `shared/systems/polls/pollSystem.js`, `Suggestion`, `GuildSettings` (`suggestionsEnabled`, `suggestionsChannelId`) | `/poll create`, `/suggest` in `cogs/utility/suggest.js` | Missing `/api/guilds/:guildId/polls` & `/api/guilds/:guildId/suggestions` endpoints. | Generic toggle only. Missing Democratic Poll builder (weighted role votes, anonymous voting toggle) and Suggestion moderation queue. | Develop `GovernanceModule.jsx` UI & poll/suggestion management API. |

---

## 6. Milestone Decomposition Recommendations

Based on the investigation, the recommended phased execution plan follows 12 distinct milestones:

1. **Milestone 1: Exploration & Architecture Assessment** *(Completed)*
   - Read-only analysis of codebase, verification of syntax lint (`npm run lint:syntax`) and command audit (`npm run audit:commands`), mapping all 10 modules.
2. **Milestone 2 (M1): Security & Anti-Nuke Module**
   - Implement `shared/systems/antinuke/` REST endpoints in `server.js` (`/api/guilds/:guildId/security`).
   - Create `dashboard/components/modules/SecurityModule.jsx` featuring heat threshold sliders, quarantine vault table, and anti-raid toggles.
3. **Milestone 3 (M2): Moderation & Audit Module**
   - Implement `/api/guilds/:guildId/moderation` endpoints for Auto-Mod rules and case lookup.
   - Create `dashboard/components/modules/ModerationModule.jsx` with rule builder and audit log history.
4. **Milestone 4 (M3): Verification Gateway Module**
   - Implement `/api/guilds/:guildId/verification` endpoint.
   - Create `dashboard/components/modules/VerificationModule.jsx` with Captcha mode selector and alt account shield settings.
5. **Milestone 5 (M4): Ticketing & Applications Module**
   - Enhance `/api/guilds/:guildId/ticket-panels` and add `/api/guilds/:guildId/applications`.
   - Create `dashboard/components/modules/TicketingModule.jsx` with ticket panel builder, skill routing tags manager, and CSAT telemetry cards.
6. **Milestone 6 (M5): Voice Topologies Module**
   - Implement `/api/guilds/:guildId/voice` endpoint.
   - Create `dashboard/components/modules/VoiceModule.jsx` with Creator channel dropdown, template string builder (`{user}'s Room`), and active channel list.
7. **Milestone 7 (M6): Social Alerts & Notifications Module**
   - Implement `/api/guilds/:guildId/social-alerts` CRUD endpoints.
   - Create `dashboard/components/modules/SocialAlertsModule.jsx` for managing YouTube/Twitch/Kick/Twitter/RSS feed subscriptions.
8. **Milestone 8 (M7): Gamification & Economy Module**
   - Implement `/api/guilds/:guildId/economy` endpoints (Shop CRUD, XP multiplier, level rewards).
   - Create `dashboard/components/modules/GamificationModule.jsx` with virtual shop manager, leaderboard viewer, and XP curve configuration.
9. **Milestone 9 (M8): Growth & Invite Analytics Module**
   - Implement `/api/guilds/:guildId/invites` analytics endpoint.
   - Create `dashboard/components/modules/GrowthModule.jsx` with invite attribution chart, fake invite shield toggle, and top inviters list.
10. **Milestone 10 (M9): Server Counter Channels Module**
    - Implement `/api/guilds/:guildId/counters` endpoint.
    - Create `dashboard/components/modules/CountersModule.jsx` with channel counter template builder and real-time count previews.
11. **Milestone 11 (M10): Polls & Governance Module**
    - Implement `/api/guilds/:guildId/polls` and `/api/guilds/:guildId/suggestions` endpoints.
    - Create `dashboard/components/modules/GovernanceModule.jsx` with democratic poll creator and suggestion queue manager.
12. **Milestone 12 (M11): Dashboard Navigation, Layout & Aesthetic Polish**
    - Create `dashboard/app/globals.css` with Tailwind directives and cyber-minimal glassmorphism styles.
    - Refactor `dashboard/app/page.js` to feature responsive side/top navigation tabs for switching seamlessly between the 10 unified modules.
    - Standardize cyber-minimal dark mode (`#09090b`), glassmorphic containers, framer-motion page transitions, and toast notifications.
13. **Milestone 13 (M12): System Integration & Full Verification**
    - Perform end-to-end testing: run `npm run lint:syntax`, `npm run audit:commands`, and Next.js `npm run build` in `dashboard/`. Verify zero warnings or build failures.
