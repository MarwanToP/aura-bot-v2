# Codebase Analysis Report: R1, R2, & R3 Infrastructure

**Project:** Aura Bot v2 — Discord Intelligence & Management Platform  
**Explorer:** Explorer 2  
**Date:** 2026-07-27  
**Scope:** R1 (Contextual Risk Scoring & Heat Algorithm), R2 (Dynamic Ephemeral Voice Topologies & Voice-Text Linking), R3 (Skill-Based Support Ticket Routing & CSAT Feedback)

---

## 1. Executive Summary

An architectural and functional investigation was conducted across `shared/systems/antinuke`, `bot/cogs/moderation`, `shared/systems/voice`, `bot/cogs/utility/voice.js`, `shared/systems/tickets`, `bot/cogs/management/tickets.js`, and `shared/database/index.js`. 

The core findings indicate that while foundational modules for AntiNuke/AntiRaid, TempVoice, and Support Tickets exist in the codebase, significant strategic innovations specified in requirements R1, R2, and R3 are currently missing or only partially stubbed out.

---

## 2. Requirement Analysis: R1 — Contextual Risk Scoring & Heat Algorithm

### 2.1 Codebase & Structure Map
- **Core Files:**
  - `shared/systems/antinuke/antiNuke.js` — Guild audit log event handler & punishment engine.
  - `shared/systems/antinuke/antiRaid.js` — Member join velocity, account age pattern analyzer, and server lockdown.
  - `bot/cogs/moderation/modCommands.js` — Slash moderation commands (`/ban`, `/kick`, `/timeout`, `/warn`, `/clear`, `/softban`, `/history`, `/warnings`).
  - `bot/cogs/moderation/security.js` — `/lockdown` command handler.
  - `bot/cogs/admin/security.js` — Security shield dashboard command (`/security status`, `lockdown`, `whitelist`, `backup`).
  - `bot/events/messageCreate.js` — Message event processing including AI AutoMod filtering.
- **Database & State:**
  - `GuildSettings` model (`shared/database/index.js`): `antiNukeEnabled`, `antiNukeConfig` (JSONB), `antiRaidEnabled`, `auditLogChannelId`, `modLogChannelId`.
  - Redis Client (`shared/database/redis.js`): Bounded increment counters via `incrementBounded(key, max, windowMs)` for audit action limits (`antinuke:${guildId}:${executorId}:${actionType}`).

### 2.2 Existing Functions & Interfaces
1. `handleAntiNuke(client, guildId, executorId, actionType, details)` (`antiNuke.js`): Monitors threshold for audit events (`ban`, `kick`, `channel_delete`, `role_delete`, `webhook_create`) using Redis keys. Triggers `punish(guild, member)` when exceeded.
2. `punish(guild, member)` (`antiNuke.js`): Executes role stripping (`derank`), 24-hour timeout, kick, or ban based on `config.antiNuke.punishments`.
3. `trackJoin(client, member)` (`antiRaid.js`): Tracks join rate in Redis (`raid:joins:${guild.id}`), collects join history (`raid:members:${guild.id}`), calculates pattern risk score (0-100 based on velocity, new account ratio, username similarity via Levenshtein distance, average account age), and activates lockdown if score >= 60.
4. `activateLockdown`, `liftLockdown`, `isInLockdown` (`antiRaid.js`): Locks/unlocks text channel `@everyone` SendMessages permissions.

### 2.3 Gap Analysis & Missing Requirements for R1
1. **Contextual Risk Scoring / Heat Score Engine:**
   - *Current State:* AntiRaid computes a join-pattern risk score on join events, but there is **no message-level cumulative Heat Score engine**.
   - *Missing Requirement:* A dedicated dynamic risk scoring engine (`Heat Score`) analyzing real-time message stream factors:
     - Message velocity (message frequency per user within time windows).
     - Link density (URL count / ratio within messages).
     - Emoji ratios (emoji count / total character length ratio).
     - Account age heuristics (young account multipliers/bonuses).
     - Exponential time decay of accumulated heat score.
2. **Automated Quarantine System:**
   - *Current State:* `punish()` in `antiNuke.js` strips non-everyone roles (`derank`) on AntiNuke detection, but does not provide an isolated Quarantine role state, does not backup stripped roles for restoration, and does not restrict channel access.
   - *Missing Requirement:* An automated Quarantine system that:
     - Detects when a user's cumulative Heat Score breaches configured thresholds.
     - Backs up the user's current roles (in Redis/PostgreSQL).
     - Strips existing roles and assigns a designated Quarantine role.
     - Restricts channel visibility/interaction to a dedicated quarantine isolation area.
     - Supports manual admin release / auto-release upon heat decay.
3. **Administrative Rate Limits:**
   - *Current State:* `antiNuke.js` tracks Discord audit log events (deletions, bans, kicks), but there is **no rate limiter on administrative command invocations** (e.g. moderator mass-bans, mass-timeouts, role wipes executed through bot commands).
   - *Missing Requirement:* Rate limiting engine specifically enforcing action budgets for admins/mods within configured sliding windows (e.g. max 5 mod actions/minute), blocking rogue moderator mass-purges before audit log processing.

---

## 3. Requirement Analysis: R2 — Dynamic Ephemeral Voice Topologies & Voice-Text Linking

### 3.1 Codebase & Structure Map
- **Core Files:**
  - `shared/systems/voice/voiceSystem.js` — TempVoice event handler and interactive UI manager.
  - `shared/systems/voice/voiceAI.js` — Aura Voice Assistant (Whisper speech-to-text + Gemini intent parser).
  - `bot/cogs/utility/voice.js` — `/voice` slash command (`setup`, `lock`, `unlock`, `name`, `limit`, `ai`).
- **Database & State:**
  - `GuildSettings` model: `tempVoiceEnabled`, `tempVoiceCreatorId`, `tempVoiceCategoryId`, `tempVoiceNameTemplate`.
  - `TempChannel` model (`shared/database/index.js`): `guildId`, `channelId`, `ownerId`, `expiresAt`.

### 3.2 Existing Functions & Interfaces
1. `handleVoiceUpdate(client, oldState, newState)` (`voiceSystem.js`):
   - Listens to voice state transitions. When a user enters `tempVoiceCreatorId`, it creates a `GuildVoice` channel in `tempVoiceCategoryId`, applies owner permission overwrites, moves the member into the channel, creates a `TempChannel` DB record, and posts an interactive control embed (`sendTempVoiceInterface`).
   - On exit: deletes the voice channel and `TempChannel` DB record if empty. Transfers ownership if the owner leaves while others remain.
2. `handleTempVoiceInteraction(client, interaction)` (`voiceSystem.js`):
   - Manages button interactions (`tv:privacy`, `tv:cancel`, `tv:claim`, etc.).
3. `/voice` command suite (`bot/cogs/utility/voice.js`):
   - Provides admin `/voice setup` and user room controls (`/voice lock`, `unlock`, `name`, `limit`).

### 3.3 Gap Analysis & Missing Requirements for R2
1. **Dynamic Ephemeral Voice Channel Lifecycle:**
   - *Current State:* Basic creator channel entry/exit creation and cleanup is implemented in `voiceSystem.js`.
   - *Missing Requirement:* Comprehensive lifecycle management including orphan channel cleanup on bot startup/reconnect, custom user limit presets, and seamless channel state retention.
2. **Rich Presence Activity Dynamic Renaming:**
   - *Current State:* **Missing entirely.** Voice channel names are statically formatted using `tempVoiceNameTemplate` (`{user}'s Room`) upon creation.
   - *Missing Requirement:* Dynamic renaming based on member Rich Presence activity:
     - Listening for `presenceUpdate` events.
     - Detecting active game title or rich presence status of channel owner/members (e.g. `🎮 Valorant - [User]'s Room`).
     - Updating channel name dynamically with rate-limit safeguards (Discord channel rename limit is 2 per 10 minutes).
3. **Voice-Text Channel Visibility Sync:**
   - *Current State:* **Missing entirely.** No linked text channel creation or text channel permission synchronization exists when voice channels are spawned or joined.
   - *Missing Requirement:* Synchronizing associated text channel visibility:
     - Automatically creating or linking a text channel paired with the ephemeral voice channel.
     - Dynamically updating `ViewChannel` / `SendMessages` permission overwrites for members joining or leaving the voice channel, giving active voice members real-time access to the voice-text channel.

---

## 4. Requirement Analysis: R3 — Skill-Based Support Ticket Routing & CSAT Feedback

### 4.1 Codebase & Structure Map
- **Core Files:**
  - `shared/systems/tickets/ticketSystem.js` — Ticket creation, closing, transcripts, button handlers, and panel generators.
  - `bot/cogs/management/tickets.js` — `/ticket` slash commands (`panel`, `close`, `claim`, `transcript`).
  - `bot/cogs/admin/tpanel.js` — Visual ticket panel configurator command UI (`/tpanel`).
  - `shared/systems/staff/staffSystem.js` — Staff duty tracking & activity monitor (`trackActivity`).
- **Database & State:**
  - `Ticket` model (`shared/database/index.js`): `ticketId`, `guildId`, `userId`, `channelId`, `category`, `subject`, `priority` (`Low`, `Medium`, `High`, `Critical`), `status` (`open`, `claimed`, `closed`, `archived`), `claimedBy`, `closedBy`, `closedAt`, `firstResponseAt`, `satisfaction`, `transcriptUrl`, `tags`.
  - `TicketPanel` model: Configurable multi-category ticket panels (`categories` JSONB).
  - `GuildCounter` model: Tracks per-guild ticket sequence counter (`ticketCount`).

### 4.2 Existing Functions & Interfaces
1. `createTicket(client, guild, user, { category, subject, priority })` (`ticketSystem.js`):
   - Validates user open ticket count against `config.tickets.maxOpenPerUser`.
   - Increments `GuildCounter.ticketCount`, creates text channel in `ticketCategoryId`, configures permission overwrites for user, bot, and `ticketSupportRoles`.
   - Sends welcome embed with Claim and Close buttons, posts automated category responses (Technical, Complaints, Management), and logs creation to `ticketLogChannelId`.
2. `closeTicket(client, ticketId, guildId, closedBy)` (`ticketSystem.js`):
   - Sets ticket status to `closed`, generates HTML transcript via `discord-html-transcripts` if premium, locks channel permissions, and posts Re-open, Delete, and Rate Us buttons.
3. `handleButton(client, interaction, args)` (`ticketSystem.js`):
   - Handles `claim` (`ticket.update({ claimedBy, status: 'claimed' })`), `close`, `delete`, `survey` (returns 1-5 star buttons), `rate` (saves rating integer 1-5 to `satisfaction`), `setlang`, `open`.
4. `initializeTicketPanel`, `sendTicketPanel`, `handleSelectMenu` (`ticketSystem.js`).

### 4.3 Gap Analysis & Missing Requirements for R3
1. **Skill-Based Support Ticket Routing (Tag Matching):**
   - *Current State:* Tickets assign access broadly to `settings.ticketSupportRoles`. Category auto-replies exist, but **no skill-tag matching engine exists**.
   - *Missing Requirement:* Routing newly created tickets directly to online staff with matching skill permissions:
     - Defining skill tags per ticket category/topic (e.g. `tech_support`, `billing`, `discord_mod`).
     - Matching ticket tags to staff skill permissions/roles.
     - Identifying online/on-duty staff with matching skill tags and adding targeted permission overwrites or pinging relevant staff.
2. **Ticket Claiming Workflow:**
   - *Current State:* Basic claim button updates `claimedBy` and sets status to `claimed` in `Ticket` model.
   - *Missing Requirement:* Full claiming workflow enforcing staff-only claiming, adjusting channel permission overwrites so the claiming staff member becomes primary handler, and preventing duplicate claims or unauthorized access.
3. **Tier Escalation System:**
   - *Current State:* **Missing entirely.** `Ticket` model has a `priority` ENUM (`Low`, `Medium`, `High`, `Critical`), but there is no workflow to escalate tickets to higher staff tiers.
   - *Missing Requirement:* Tier escalation mechanism:
     - Escalating tickets from Tier 1 (General Support) -> Tier 2 (Senior Staff) -> Tier 3 (Management).
     - Updating channel permission overwrites to include higher-tier staff roles.
     - Elevating priority status, notifying target tier staff, and recording escalation history.
4. **CSAT Rating Prompts:**
   - *Current State:* `closeTicket` includes a "Rate Us" button in the closed ticket channel, and `handleButton` saves the 1-5 integer rating to `satisfaction`.
   - *Missing Requirement:* Automated post-resolution CSAT workflow:
     - Automatically prompting the user (via DM or interactive prompt upon closure).
     - Supporting rating selection (1-5 stars) and optional feedback comments.
     - Calculating and exposing CSAT aggregate metrics for staff analytics.

---

## 5. Summary Matrix of Requirements & Gaps

| Requirement Area | Feature | Current Code Base | Gap Status | Required Implementation |
|---|---|---|---|---|
| **R1 (Security)** | Heat Score Engine | AntiRaid tracks join patterns | **Missing** | Implement cumulative Heat Score engine (velocity, link density, emoji ratio, account age) in `shared/systems/antinuke/` |
| **R1 (Security)** | Automated Quarantine | `punish()` deranks on AntiNuke | **Missing** | Implement Quarantine system (role backup, Quarantine role assignment, channel isolation, release logic) |
| **R1 (Security)** | Admin Rate Limits | AntiNuke audit log tracking | **Missing** | Implement sliding-window admin action rate limiter per moderator |
| **R2 (Voice)** | Ephemeral Lifecycle | Entry/exit creation & deletion | **Partial** | Refine lifecycle edge cases, startup cleanup, and permission defaults |
| **R2 (Voice)** | Rich Presence Renaming | Static `{user}'s Room` name | **Missing** | Implement `presenceUpdate` listener to dynamically rename voice channels based on game/activity |
| **R2 (Voice)** | Voice-Text Visibility Sync | None | **Missing** | Implement dynamic voice-text channel pairing and member visibility synchronization |
| **R3 (Tickets)** | Skill-Based Routing | Category default permissions | **Missing** | Implement skill-tag matching router matching ticket categories to staff skill roles/permissions |
| **R3 (Tickets)** | Claiming Workflow | Basic `claimedBy` DB update | **Partial** | Refine staff validation, channel overwrite adjustments, and claim management |
| **R3 (Tickets)** | Tier Escalation | Priority enum field only | **Missing** | Implement tier escalation workflow (T1 -> T2 -> T3), updating permissions & staff notifications |
| **R3 (Tickets)** | CSAT Rating Prompts | Rating button in closed channel | **Partial** | Automate post-resolution CSAT prompt delivery, comment capture, and aggregate reporting |

---

## 6. Recommendations for Implementation Phase

1. **R1 Integration Plan:**
   - Export `calculateHeatScore(message)` and `evaluateQuarantine(member, heatScore)` from `shared/systems/antinuke/antiNuke.js` (or a dedicated `heatScore.js` module in `shared/systems/antinuke/`).
   - Hook message processing into `bot/events/messageCreate.js`.
   - Implement admin rate limiting state via Redis in `shared/systems/antinuke/adminRateLimit.js`.
2. **R2 Integration Plan:**
   - Extend `shared/systems/voice/voiceSystem.js` with `handlePresenceUpdate(client, oldPresence, newPresence)` for Rich Presence renaming with rate limiting (max 1 rename per 5 min per channel).
   - Add text channel creation/permission sync in `handleVoiceUpdate` to open/hide voice-linked text channels.
3. **R3 Integration Plan:**
   - Extend `shared/systems/tickets/ticketSystem.js` with `routeTicketBySkill(client, guild, ticket, category)`, `escalateTicket(client, ticketId, guildId, escalatedBy, targetTier)`, and automated CSAT dispatch.
