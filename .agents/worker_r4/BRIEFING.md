# BRIEFING — 2026-07-27T20:33:43Z

## Mission
Implement R4. Time-Decay Leveling & Gamified Retention (Leveling & Economy) in Aura Bot v2.

## 🔒 My Identity
- Archetype: worker_r4
- Roles: implementer, qa, specialist
- Working directory: d:\aura-bot-v2\.agents\worker_r4
- Original parent: d2277814-095c-4fdf-a1e9-85cd2b983957
- Milestone: R4 Time-Decay Leveling & Gamified Retention

## 🔒 Key Constraints
- Implement exponential XP decay for inactive members over configurable grace periods (e.g. rawXp * e^(-lambda * (daysInactive - graceDays)))
- Re-calculate rank roles and leaderboard positions based on current decaying active scores rather than static historical totals
- Export `recalculateGuildRanks(client, guildId)` and integrate into background tasks cron for periodic automated rank demotion/promotion sync
- Run lint:syntax, audit:commands, test:smoke
- Genuine implementation, no cheating or hardcoding

## Current Parent
- Conversation ID: d2277814-095c-4fdf-a1e9-85cd2b983957
- Updated: 2026-07-27T20:33:43Z

## Task Summary
- **What to build**: Exponential XP time-decay leveling, decaying active score recalculation for rank roles & leaderboards, export `recalculateGuildRanks`, background tasks cron integration.
- **Success criteria**: All smoke tests pass, syntax lint passes, command audit passes.
- **Interface contracts**: shared/systems/leveling/levelingSystem.js, shared/database/index.js, shared/systems/backgroundTasks.js
- **Code layout**: JS modular structure in d:\aura-bot-v2

## Key Decisions Made
- Initializing Worker R4 state and context.

## Artifact Index
- ORIGINAL_REQUEST.md — Original task prompt and constraints
- BRIEFING.md — Context and briefing documentation
- progress.md — Heartbeat progress tracker

## Change Tracker
- **Files modified**: None yet
- **Build status**: Not run yet
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending
- **Lint status**: Pending
- **Tests added/modified**: Pending

## Loaded Skills
None
