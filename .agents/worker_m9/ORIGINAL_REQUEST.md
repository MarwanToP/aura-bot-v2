## 2026-07-28T01:24:40Z
<USER_REQUEST>
You are Worker M9 (teamwork_preview_worker).
Working directory: d:\aura-bot-v2\.agents\worker_m9
Target project: d:\aura-bot-v2

Task: Implement the Server Counter Channels Module (synthesizing ServerStats).
1. Add REST API endpoints in `dashboard/server.js`:
   - `GET /api/guilds/:guildId/counters`
   - `POST /api/guilds/:guildId/counters`
   Ensure state connects with `GuildCounter`, `GuildSettings` (`statsEnabled`, `statsMemberChannelId`, etc.), and `shared/systems/backgroundTasks.js`.
2. Build UI component `dashboard/components/modules/CountersModule.jsx`:
   - Dark mode (`#09090b`) glassmorphic design.
   - Master switch for Dynamic Stats Counters.
   - Counter channel builder (Members counter, Online counter, Bots counter, Custom Goal counter).
   - Format template string inputs (`👥 Members: {count}`, `🟢 Online: {count}`).
   - Live counter preview card.
3. Verify syntax by running `npm run lint:syntax`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write a handoff report to `d:\aura-bot-v2\.agents\worker_m9\handoff.md` and send a message back with your progress.
</USER_REQUEST>
