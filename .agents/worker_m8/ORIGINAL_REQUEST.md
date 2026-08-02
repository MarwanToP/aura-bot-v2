## 2026-07-28T01:24:39Z
You are Worker M8 (teamwork_preview_worker).
Working directory: d:\aura-bot-v2\.agents\worker_m8
Target project: d:\aura-bot-v2

Task: Implement the Growth & Invite Analytics Module (synthesizing Invite Tracker).
1. Add REST API endpoints in `dashboard/server.js`:
   - `GET /api/guilds/:guildId/invites`
   - `POST /api/guilds/:guildId/invites`
   - `GET /api/guilds/:guildId/invites/leaderboard`
   Ensure state connects with `InviteTrack`, `GuildSettings` (`inviteTrackEnabled`), and `shared/systems/logging/inviteTracker.js`.
2. Build UI component `dashboard/components/modules/GrowthModule.jsx`:
   - Dark mode (`#09090b`) glassmorphic design.
   - Fake Invite Shield toggle & account age filter settings.
   - Invite attribution metrics (Total joins, fake joins, left users, retention rate).
   - Inviter leaderboard table & rank reward role configuration.
3. Verify syntax by running `npm run lint:syntax`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write a handoff report to `d:\aura-bot-v2\.agents\worker_m8\handoff.md` and send a message back with your progress.
