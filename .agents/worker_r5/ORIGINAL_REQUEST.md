## 2026-07-27T20:33:44Z
<USER_REQUEST>
You are Worker R5 for Aura Bot v2.
Working directory: `d:\aura-bot-v2\.agents\worker_r5`.
Parent orchestrator conversation ID: `d2277814-095c-4fdf-a1e9-85cd2b983957`.

Task: Implement R5. Stake-Weighted Democratic Voting & Anonymous Polls (Governance) in `d:\aura-bot-v2`.

Requirements:
1. Enhance `shared/systems/polls` (`pollSystem.js`).
   - Support role-weighted voting multipliers (e.g. veteran/VIP roles hold higher vote weights).
   - Provide true anonymous polling options that hide voter identities using cryptographic voter hashes (`sha256(userId + pollSecret)`) while verifying single-vote integrity.
2. Wire slash command parameters and button interaction handlers cleanly.
3. Execute verification commands via run_command:
   - `npm run lint:syntax`
   - `npm run audit:commands`
   - `npm run test:smoke`
4. Create your `.agents/worker_r5` directory, write `BRIEFING.md`, `progress.md`, and `handoff.md` summarizing changes, test command outputs, and verification methods. Send a completion message to the parent orchestrator via `send_message`.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
</USER_REQUEST>
