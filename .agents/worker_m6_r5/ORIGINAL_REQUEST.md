## 2026-07-27T20:34:55Z
You are the implementation worker for Milestone M6 (R5: Stake-Weighted Democratic Voting & Anonymous Polls).
Working Directory: d:\aura-bot-v2\.agents\worker_m6_r5
Target files: shared/systems/polls/pollSystem.js.

Requirements:
1. Role-Weighted Voting Multipliers:
   - Support role multipliers (e.g., veteran roles hold vote multipliers like 2.0x, VIP = 1.5x) when tallying poll results, looking up role weights from settings or poll configuration.
2. Anonymous Polling with Single-Vote Integrity:
   - Provide true anonymous polling options that hide voter identity while verifying single-vote integrity using cryptographic salted hashes (e.g. sha256).
   - Ensure voter choices cannot be linked back to user IDs while preventing double voting.
3. Verification: run npm run lint:syntax, npm run audit:commands, npm run test:smoke.
4. Write handoff.md in d:\aura-bot-v2\.agents\worker_m6_r5 and send a message back to parent when complete.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
