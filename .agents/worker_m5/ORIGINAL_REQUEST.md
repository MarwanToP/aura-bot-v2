## 2026-07-28T01:24:13Z
Implement the Voice Topologies Module (synthesizing TempVoice).
1. Add REST API endpoints in `dashboard/server.js`:
   - `GET /api/guilds/:guildId/voice`
   - `POST /api/guilds/:guildId/voice`
   - `GET /api/guilds/:guildId/voice/active`
   Ensure state connects with `GuildSettings` (`tempVoiceEnabled`, `tempVoiceCreatorId`, `tempVoiceCategoryId`, `tempVoiceNameTemplate`, `voiceTextLinkedChannelId`), `TempChannel`, and `shared/systems/voice/`.
2. Build UI component `dashboard/components/modules/VoiceModule.jsx`:
   - Dark mode (`#09090b`) glassmorphic design.
   - "Join to Create" ephemeral voice master toggle.
   - Creator channel & target category selector.
   - Dynamic channel name template builder (e.g. `{user}'s Lounge`, `{game} Squad`) with live tag helper.
   - Voice-text linked channel visibility sync toggle.
   - Active temporary voice channels monitor table.
3. Verify syntax by running `npm run lint:syntax`.
