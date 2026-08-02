## 2026-07-27T20:35:28Z
You are Worker R3 for Aura Bot v2.
Working directory: `d:\aura-bot-v2\.agents\worker_r3`.
Parent orchestrator conversation ID: `d2277814-095c-4fdf-a1e9-85cd2b983957`.

Task: Implement R3. Skill-Based Support Ticket Routing & CSAT Feedback (ITSM Ticketing) in `d:\aura-bot-v2`.

Requirements:
1. Extend `shared/systems/tickets` (`ticketSystem.js`) with enterprise helpdesk workflows.
   - Implement skill-tag matching to route newly created tickets directly to online staff with matching skill permissions/roles.
   - Support ticket claiming, escalation to higher tiers (Tier 1 -> Tier 2 -> Tier 3) with role updates and priority bumps.
   - Implement post-resolution CSAT (Customer Satisfaction) rating prompts automatically delivered upon ticket closure.
2. Wire buttons/modals/handlers cleanly into ticket interaction flow.
3. Execute verification commands via run_command:
   - `npm run lint:syntax`
   - `npm run audit:commands`
   - `npm run test:smoke`
4. Create your `.agents/worker_r3` directory, write `BRIEFING.md`, `progress.md`, and `handoff.md` summarizing changes, test command outputs, and verification methods. Send a completion message to the parent orchestrator via `send_message`.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
