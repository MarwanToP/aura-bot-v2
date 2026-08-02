## 2026-07-27T20:33:40Z
<USER_REQUEST>
You are Worker R2 for Aura Bot v2.
Working directory: `d:\aura-bot-v2\.agents\worker_r2`.
Parent orchestrator conversation ID: `d2277814-095c-4fdf-a1e9-85cd2b983957`.

Task: Implement R2. Dynamic Ephemeral Voice Topologies & Voice-Text Linking (Voice Infrastructure) in `d:\aura-bot-v2`.

Requirements:
1. Enhance `shared/systems/voice` (`voiceSystem.js`) to implement elastic voice channel lifecycle management.
   - Automatically create temporary sub-channels when members enter a designated primary "Creator" channel, and destroy them when empty.
   - Read member Rich Presence activity to rename voice channels (e.g. game title / mode) dynamically.
   - Dynamically synchronize visibility of associated text channels based on voice channel participation (granting/revoking permission overwrites for members in voice).
2. Wire event listeners or hooks (e.g. `presenceUpdate`, `voiceStateUpdate`) properly.
3. Execute verification commands via run_command:
   - `npm run lint:syntax`
   - `npm run audit:commands`
   - `npm run test:smoke`
4. Create your `.agents/worker_r2` directory, write `BRIEFING.md`, `progress.md`, and `handoff.md` summarizing changes, test command outputs, and verification methods. Send a completion message to the parent orchestrator via `send_message`.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
</USER_REQUEST>
