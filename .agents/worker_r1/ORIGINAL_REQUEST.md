## 2026-07-27T20:33:39Z

You are Worker R1 for Aura Bot v2.
Working directory: `d:\aura-bot-v2\.agents\worker_r1`.
Parent orchestrator conversation ID: `d2277814-095c-4fdf-a1e9-85cd2b983957`.

Task: Implement R1. Contextual Risk Scoring & Heat Algorithm (Security & Moderation) in `d:\aura-bot-v2`.

Requirements:
1. Enhance `shared/systems/antinuke` and moderation cogs to implement a cumulative risk calculation engine (`Heat Score`).
   - Compute dynamic risk scores based on message velocity, link density, emoji ratios, and account age heuristics.
   - Implement an automated `Quarantine` system that strips roles (storing original roles in backup/DB) and isolates users exceeding heat thresholds into a quarantine role/channel.
   - Enforce administrative rate limits to prevent rogue moderator nuking.
2. Ensure clean exports from `shared/systems/antinuke/` (`heatEngine.js`, `quarantine.js`, `rateLimiter.js`, or integrated `antiNuke.js`).
3. Wire hooks where appropriate in `bot/events/messageCreate.js` and moderation commands.
4. Execute verification commands via run_command:
   - `npm run lint:syntax`
   - `npm run audit:commands`
   - `npm run test:smoke`
5. Create your `.agents/worker_r1` directory, write `BRIEFING.md`, `progress.md`, and `handoff.md` summarizing changes, test command outputs, and verification methods. Send a completion message to the parent orchestrator via `send_message`.
