## 2026-07-27T20:34:47Z
You are the implementation worker for Milestone M4 (R3: Skill-Based Support Ticket Routing & CSAT Feedback).
Working Directory: d:\aura-bot-v2\.agents\worker_m4_r3
Target files: shared/systems/tickets/, shared/database/index.js.

Requirements:
1. Skill-Tag Routing:
   - Match ticket category skill tags to online staff members possessing matching skill roles / permissions upon ticket creation, pinging / granting access to matched staff.
2. Claiming & Tier Escalation:
   - Implement ticket claiming and multi-tier escalation (Tier 1 -> Tier 2 -> Tier 3), updating channel permission overwrites, support role assignments, and priority level.
3. Automated Post-Resolution CSAT Feedback:
   - Automate post-resolution CSAT rating prompts (1-5 stars) upon ticket closure, capturing satisfaction metrics in the database.
4. Verification: run npm run lint:syntax, npm run audit:commands, npm run test:smoke.
5. Write handoff.md in d:\aura-bot-v2\.agents\worker_m4_r3 and send a message back to parent when complete.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
