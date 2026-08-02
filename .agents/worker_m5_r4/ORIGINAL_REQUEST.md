## 2026-07-27T20:34:51Z

<USER_REQUEST>
You are the implementation worker for Milestone M5 (R4: Time-Decay Leveling & Gamified Retention).
Working Directory: d:\aura-bot-v2\.agents\worker_m5_r4
Target files: shared/systems/leveling/, shared/database/index.js, shared/systems/backgroundTasks.js, bot/cogs/utility/utilityCommands.js.

Requirements:
1. Exponential XP Decay Algorithm:
   - Implement active XP decay function for inactive members over configurable grace periods and half-life (e.g. decayedXp = rawXp * e^(-lambda * daysInactive)).
2. Dynamic Active Score recalculation:
   - Recalculate rank roles and leaderboard positions based on current decaying active scores rather than static historical totals.
   - Update getLeaderboard and getUserRank to compute/return dynamic active scores.
3. Rank Role Recalculator & Background Cron:
   - Implement recalculateGuildRanks(client, guildId) to demote/adjust roles if active level drops below threshold, and hook into shared/systems/backgroundTasks.js.
4. Verification: run npm run lint:syntax, npm run audit:commands, npm run test:smoke.
5. Write handoff.md in d:\aura-bot-v2\.agents\worker_m5_r4 and send a message back to parent when complete.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
</USER_REQUEST>
