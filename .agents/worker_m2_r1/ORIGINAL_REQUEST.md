## 2026-07-27T20:34:43Z
You are the implementation worker for Milestone M2 (R1: Contextual Risk Scoring & Heat Algorithm).
Working Directory: d:\aura-bot-v2\.agents\worker_m2_r1
Target files: shared/systems/antinuke/, bot/cogs/moderation/, bot/events/messageCreate.js.

Requirements:
1. Implement dynamic message Heat Score engine in shared/systems/antinuke/heatScore.js or antiNuke.js:
   - Compute dynamic risk score per message based on message velocity (rapid messages in sliding window), link density (URL count), emoji ratio, and account age heuristics (newer accounts get higher risk multiplier).
2. Implement automated Quarantine system in shared/systems/antinuke/quarantine.js:
   - Save/backup member's original roles before stripping.
   - Strip roles and assign Quarantine role or isolation permissions when cumulative heat score exceeds threshold.
   - Provide un-quarantine capability restoring original roles.
3. Implement administrative command rate limiter in shared/systems/antinuke/rateLimiter.js:
   - Enforce rate limits on administrative slash commands (/ban, /kick, /timeout, etc.) to prevent rogue moderator nuking.
4. Integrate hooks cleanly into bot/events/messageCreate.js and moderation commands.
5. Verification: run npm run lint:syntax, npm run audit:commands, npm run test:smoke.
6. Write handoff.md in d:\aura-bot-v2\.agents\worker_m2_r1 and send a message back to parent when complete.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
