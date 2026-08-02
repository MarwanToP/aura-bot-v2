## 2026-07-28T04:24:41Z
You are Worker M10 (teamwork_preview_worker).
Working directory: d:\aura-bot-v2\.agents\worker_m10
Target project: d:\aura-bot-v2

Task: Implement the Polls & Governance Module (synthesizing Mr. Poll).
1. Add REST API endpoints in `dashboard/server.js`:
   - `GET /api/guilds/:guildId/polls`
   - `POST /api/guilds/:guildId/polls`
   - `GET /api/guilds/:guildId/suggestions`
   - `POST /api/guilds/:guildId/suggestions`
   Ensure state connects with `Suggestion`, `shared/systems/polls/pollSystem.js`, and `GuildSettings`.
2. Build UI component `dashboard/components/modules/GovernanceModule.jsx`:
   - Dark mode (`#09090b`) glassmorphic design.
   - Democratic Poll Creator (Question, options, duration, role vote multipliers, anonymous single-vote integrity switch).
   - Active and ended polls list table.
   - Community suggestion box settings & suggestion queue moderation card.
3. Verify syntax by running `npm run lint:syntax`.
