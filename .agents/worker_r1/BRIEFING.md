# BRIEFING — 2026-07-27T23:34:00Z

## Mission
Implement R1. Contextual Risk Scoring & Heat Algorithm (Security & Moderation) in `d:\aura-bot-v2`.

## 🔒 My Identity
- Archetype: implementer/qa/specialist
- Roles: implementer, qa, specialist
- Working directory: `d:\aura-bot-v2\.agents\worker_r1`
- Original parent: `d2277814-095c-4fdf-a1e9-85cd2b983957`
- Milestone: R1 - Contextual Risk Scoring & Heat Algorithm

## 🔒 Key Constraints
- Enhance `shared/systems/antinuke` and moderation cogs to implement a cumulative risk calculation engine (`Heat Score`).
- Compute dynamic risk scores based on message velocity, link density, emoji ratios, and account age heuristics.
- Implement an automated `Quarantine` system that strips roles (storing original roles in backup/DB) and isolates users exceeding heat thresholds into a quarantine role/channel.
- Enforce administrative rate limits to prevent rogue moderator nuking.
- Ensure clean exports from `shared/systems/antinuke/` (`heatEngine.js`, `quarantine.js`, `rateLimiter.js`, or integrated `antiNuke.js`).
- Wire hooks where appropriate in `bot/events/messageCreate.js` and moderation commands.
- Execute verification commands via `run_command`: `npm run lint:syntax`, `npm run audit:commands`, `npm run test:smoke`.
- No hardcoded test outputs or facades. All code must be genuine and maintain real state/behavior.

## Current Parent
- Conversation ID: `d2277814-095c-4fdf-a1e9-85cd2b983957`
- Updated: 2026-07-27T23:34:00Z

## Task Summary
- **What to build**: Dynamic risk score (Heat Algorithm), Quarantine system with role backup/restore, administrative rate limiter for antinuke/moderation, wired into messageCreate and moderation handlers.
- **Success criteria**: All npm verification scripts (`npm run lint:syntax`, `npm run audit:commands`, `npm run test:smoke`) pass without errors.
- **Interface contracts**: `shared/systems/antinuke/` exports `heatEngine.js`, `quarantine.js`, `rateLimiter.js` or integrated `antiNuke.js`.
- **Code layout**: `shared/systems/antinuke/`, `bot/events/messageCreate.js`, moderation commands in `bot/` or `shared/`.

## Key Decisions Made
- [TBD]

## Change Tracker
- **Files modified**: None yet
- **Build status**: Pending
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending
- **Lint status**: Pending
- **Tests added/modified**: Pending

## Loaded Skills
- None

## Artifact Index
- `.agents/worker_r1/ORIGINAL_REQUEST.md` — Initial user task request
- `.agents/worker_r1/BRIEFING.md` — Agent briefing & state
- `.agents/worker_r1/progress.md` — Progress tracker
