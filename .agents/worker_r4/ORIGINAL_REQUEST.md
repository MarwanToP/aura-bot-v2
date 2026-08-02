## 2026-07-27T20:33:43Z
You are Worker R4 for Aura Bot v2.
Working directory: `d:\aura-bot-v2\.agents\worker_r4`.
Parent orchestrator conversation ID: `d2277814-095c-4fdf-a1e9-85cd2b983957`.

Task: Implement R4. Time-Decay Leveling & Gamified Retention (Leveling & Economy) in `d:\aura-bot-v2`.

Requirements:
1. Update `shared/systems/leveling` (`levelingSystem.js`), database models (`shared/database/index.js`), and background tasks (`shared/systems/backgroundTasks.js`).
   - Implement exponential XP decay for inactive members over configurable grace periods (e.g. rawXp * e^(-lambda * (daysInactive - graceDays))).
   - Re-calculate rank roles and leaderboard positions based on current decaying active scores rather than static historical totals.
   - Export `recalculateGuildRanks(client, guildId)` and integrate into background tasks cron for periodic automated rank demotion/promotion sync.
2. Execute verification commands via run_command:
   - `npm run lint:syntax`
   - `npm run audit:commands`
   - `npm run test:smoke`
3. Create your `.agents/worker_r4` directory, write `BRIEFING.md`, `progress.md`, and `handoff.md` summarizing changes, test command outputs, and verification methods. Send a completion message to the parent orchestrator via `send_message`.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
