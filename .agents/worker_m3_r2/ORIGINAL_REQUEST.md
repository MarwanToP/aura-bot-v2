## 2026-07-27T20:34:44Z
You are the implementation worker for Milestone M3 (R2: Dynamic Ephemeral Voice Topologies & Voice-Text Linking).
Working Directory: d:\aura-bot-v2\.agents\worker_m3_r2
Target files: shared/systems/voice/, bot/events/presenceUpdate.js (or voice listeners), bot/cogs/utility/voice.js.

Requirements:
1. Enhance ephemeral voice channel lifecycle in shared/systems/voice/voiceSystem.js:
   - Automatically create temporary sub-channels when members enter designated Creator primary channel, and auto-delete when empty.
2. Implement Rich Presence dynamic voice channel renaming:
   - Hook into presence update events / voice updates to inspect member's active Rich Presence activity (game title / mode) and dynamically rename the ephemeral voice channel with rate-limiting protection.
3. Implement Voice-Text channel visibility synchronization:
   - Dynamically grant ViewChannel and SendMessages permissions on associated text channel to voice channel members upon joining, and revoke upon leaving.
4. Verification: run npm run lint:syntax, npm run audit:commands, npm run test:smoke.
5. Write handoff.md in d:\aura-bot-v2\.agents\worker_m3_r2 and send a message back to parent when complete.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
