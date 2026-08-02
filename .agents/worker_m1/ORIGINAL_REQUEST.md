## 2026-07-28T01:24:09Z
You are Worker M1 (teamwork_preview_worker).
Working directory: d:\aura-bot-v2\.agents\worker_m1
Target project: d:\aura-bot-v2

Task: Implement the Security & Anti-Nuke Module (synthesizing Wick, Vetox, Security Bot).
1. Add REST API endpoints in `dashboard/server.js`:
   - `GET /api/guilds/:guildId/security`
   - `POST /api/guilds/:guildId/security`
   - `GET /api/guilds/:guildId/quarantine`
   - `POST /api/guilds/:guildId/quarantine/:userId/unquarantine`
   Ensure state connects with `GuildSettings` and `shared/systems/antinuke/` (`antiNuke.js`, `antiRaid.js`, `heatEngine.js`).
2. Build UI component `dashboard/components/modules/SecurityModule.jsx`:
   - Next.js 16 / React 19 / Tailwind v4 dark mode (`#09090b`) glassmorphic UI.
   - Interactive live toggle controls: Anti-Nuke, Anti-Raid, Bot Add Lock, Webhook Protection.
   - Sliders/inputs for Heat Score thresholds (velocity, link density, account age heuristics).
   - Quarantine Vault list table showing quarantined users with action button to restore/unquarantine.
3. Verify syntax by running `npm run lint:syntax`.
