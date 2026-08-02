## 2026-07-28T01:24:37Z
You are Worker M6 (teamwork_preview_worker).
Working directory: d:\aura-bot-v2\.agents\worker_m6
Target project: d:\aura-bot-v2

Task: Implement the Social Alerts & Notifications Module (synthesizing NotifyMe, MEE6).
1. Add REST API endpoints in `dashboard/server.js`:
   - `GET /api/guilds/:guildId/social-alerts`
   - `POST /api/guilds/:guildId/social-alerts`
   - `DELETE /api/guilds/:guildId/social-alerts/:id`
   Ensure state connects with `GuildSettings` (`socialAlertsConfig`) and `shared/systems/socialAlerts/socialAlerts.js`.
2. Build UI component `dashboard/components/modules/SocialAlertsModule.jsx`:
   - Dark mode (`#09090b`) glassmorphic design.
   - Platform feed manager (YouTube, Twitch, Kick, Twitter/X, RSS feeds).
   - Subscription setup form (channel handle/URL, target Discord channel, ping role selector, message template).
   - Active feed subscriptions list table with delete/test actions.
3. Verify syntax by running `npm run lint:syntax`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write a handoff report to `d:\aura-bot-v2\.agents\worker_m6\handoff.md` and send a message back with your progress.
