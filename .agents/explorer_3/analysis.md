# Exploration & Architectural Analysis Report: R4 & R5

**Target Repository**: `d:\aura-bot-v2`  
**Investigated Systems**:
- **R4**: Time-Decay Leveling & Gamified Retention (`shared/systems/leveling`)
- **R5**: Stake-Weighted Democratic Voting & Anonymous Polls (`shared/systems/polls`)

---

## Executive Summary

This report documents the architectural state of R4 (Leveling) and R5 (Polls) in Aura Bot v2.
- **R4 State**: The leveling module (`shared/systems/leveling/levelingSystem.js`) handles standard message XP accumulation, voice XP rewards, rank card generation via Canvas, and static leaderboard lookup. **Missing**: Exponential XP decay algorithm for inactive members, configurable grace periods, dynamic active score calculation, and rank role/leaderboard recalculation engine.
- **R5 State**: The poll module (`shared/systems/polls/pollSystem.js`) provides standard single-vote slash commands and Redis-backed interaction buttons with basic anonymous flag. **Missing**: Stake-weighted democratic voting with role multipliers, true cryptographic/anonymized voter identity separation with single-vote integrity verification, and configurable role weight settings.

---

## 1. System Analysis: R4 — Time-Decay Leveling (`shared/systems/leveling`)

### 1.1 Existing Codebase & Exports
- **File Location**: `shared/systems/leveling/levelingSystem.js`
- **Exported Functions**:
  - `xpForLevel(level)` (Line 12): Returns total XP needed using formula `5 * level^2 + 50 * level + 100` from `config.leveling.levelFormula`.
  - `levelFromXp(xp)` (Lines 14–18): Calculates level, `currentXp`, and `nextLevelXp` from raw XP.
  - `awardMessageXp(client, message)` (Lines 25–52): Awards random XP (15–25) per message with a 60s Redis cooldown (`xpcool:guildId:userId`). Updates `UserProfile.xp`, `UserProfile.level`, `UserProfile.lastXpAt = new Date()`, `UserProfile.totalMessages`. Calls `handleLevelUp`.
  - `awardVoiceXp(client, guildId, userId, minutes)` (Lines 114–128): Awards 5 XP/min. Updates `UserProfile.xp`, `UserProfile.level`, `UserProfile.voiceMinutes`.
  - `getLeaderboard(client, guildId, limit = 10, offset = 0)` (Lines 130–135): Returns `UserProfile` rows sorted by static total `xp` (`order: [['xp', 'DESC']]`).
  - `getUserRank(client, guildId, userId)` (Lines 137–145): SQL query counting profiles with higher static `xp`: `SELECT COUNT(*)+1 AS rank FROM "user_profiles" WHERE "guildId"=:g AND "xp">(SELECT "xp" FROM "user_profiles" WHERE "guildId"=:g AND "userId"=:u LIMIT 1)`.
  - `generateRankCard(member, profile, rank)` (Lines 148–230): Generates a 1000x280 PNG rank card using `@napi-rs/canvas`.

### 1.2 Integration Points
- `bot/events/messageCreate.js` (Line 23): Triggers `awardMessageXp(client, message)`.
- `shared/systems/backgroundTasks.js` (Lines 16–21 & 64–85): Triggers `awardVoiceXp` on 1-minute cron and voice state updates.
- `bot/cogs/utility/utilityCommands.js`: Commands `/rank` (Line 150) and `/leaderboard` (Line 183).

### 1.3 Database & State Models
- **`UserProfile` Model** (`shared/database/index.js`, Lines 162–179):
  - Attributes: `userId`, `guildId`, `xp` (BIGINT), `level` (INTEGER), `totalMessages` (BIGINT), `voiceMinutes` (BIGINT), `lastXpAt` (DATE), `cardColor` (STRING).
  - Indexes: `(userId, guildId)` unique, `(guildId, xp)`.
- **`GuildSettings` Model** (`shared/database/index.js`, Lines 43–159):
  - Attributes: `levelingEnabled` (BOOLEAN), `levelUpChannelId` (STRING), `xpMultiplier` (FLOAT).
- **`LevelReward` Model** (`shared/database/index.js`, Lines 306–311):
  - Attributes: `guildId`, `level`, `roleId`, `removeOnNext` (BOOLEAN).

### 1.4 Missing R4 Requirements
1. **Exponential XP Decay Algorithm**:
   - Inactive members currently retain 100% of their historical XP forever.
   - Formula needed: For `daysInactive = (now - lastXpAt) in days`:
     - If `daysInactive > gracePeriodDays` (e.g. default 7 days):
       $$\text{decayedXp} = \text{rawXp} \times e^{-\lambda \times (\text{daysInactive} - \text{gracePeriodDays})}$$
       where $\lambda = \frac{\ln(2)}{\text{halfLifeDays}}$ (e.g. 14 days half-life) or configurable decay factor.
2. **Dynamic Leaderboard & Rank Calculation**:
   - `getLeaderboard` and `getUserRank` currently query raw static `xp`. They must calculate dynamic decaying active scores for all users in the guild.
3. **Rank Role Recalculator**:
   - Currently, roles are only awarded when `newLevel > oldLevel` on message creation. If a user's active score decays below a level threshold, their level drops and rank roles must be automatically removed/updated (`LevelReward`).
   - Need an exported function `recalculateGuildRanks(client, guildId)` and a cron job in `backgroundTasks.js` (e.g., daily execution).

---

## 2. System Analysis: R5 — Stake-Weighted Democratic Voting & Anonymous Polls (`shared/systems/polls`)

### 2.1 Existing Codebase & Exports
- **File Location**: `shared/systems/polls/pollSystem.js`
- **Exported Objects & Functions**:
  - `poll` (Lines 14–170): Slash command module export with subcommands:
    - `create`: Parses question, up to 5 options, duration, and boolean `anonymous`. Stores poll object in Redis key `poll:${msgId}` with 7-day TTL.
    - `end`: Deletes `poll:${msgId}` from Redis and edits Discord embed with final result summary.
    - `results`: Reads `poll:${msgId}` from Redis and displays current percentage bar charts.
  - `handleButton(client, interaction, args)` (Lines 173–226): Router for `poll:vote:<optionIndex>`.
    - Reads Redis key `poll:${msgId}`.
    - Tracks user vote mapping: `pollData.votes[userId] = optionIndex`.
    - Updates integer count array: `pollData.counts[optionIndex]++`.
    - Saves updated object to Redis and edits Discord embed.

### 2.2 Integration Points
- `bot/events/interactionCreate.js` (Lines 213, 234–245): Dynamically imports `shared/systems/polls/pollSystem.js` for custom IDs starting with `poll:`.

### 2.3 Database & State Models
- **Redis Key Structure**: `poll:${msgId}` (JSON, TTL 7 days):
  ```json
  {
    "question": "Which feature is top priority?",
    "options": ["Time-Decay Leveling", "Stake-Weighted Polls"],
    "anonymous": false,
    "endsAt": "2026-08-01T00:00:00.000Z",
    "hostId": "123456789012345678",
    "guildId": "987654321098765432",
    "votes": { "user1": 0, "user2": 1 },
    "counts": [1, 1]
  }
  ```
- **PostgreSQL**: No dedicated poll model currently exists.

### 2.4 Missing R5 Requirements
1. **Stake-Weighted Democratic Voting**:
   - Currently, every vote increments `counts[optionIndex]` by `+1` uniformly.
   - Requirement: Support role-weighted multipliers (e.g., veteran roles = 2.0x, VIP roles = 1.5x, default = 1.0x).
   - Needs configuration store (in `GuildSettings` or poll parameters) for role weights: `{ roleId: multiplier }`.
   - Vote processing must compute user weight $W$ from member roles and maintain both `weightedScores` and raw `voteCounts`.
2. **True Anonymous Polling & Single-Vote Integrity**:
   - Currently, when `anonymous: true`, Redis `pollData.votes` directly maps `userId -> optionIndex`. Anyone with Redis access or inspect logs can see voter identity linked to choice.
   - Requirement: Separate voter identity tracking from option selection.
   - Mechanism:
     - Use a cryptographic salt/secret per poll ($S = \text{sha256}(\text{pollId} + \text{guildSecret})$).
     - Store anonymized voter receipt: `voterHashes[sha256(userId + S)] = { optionIndex, weight }` OR maintain an unlinked `votedUserIds` set and a separate option score pool.
     - Single-Vote Integrity Verification: Provide a verification routine `verifySingleVoteIntegrity(pollData, userId, pollSecret)` to guarantee that `userId` has cast exactly 1 vote without revealing `optionIndex`.

---

## 3. Proposed Modifications & Interface Contracts

### 3.1 Interface Contracts to Export

#### For `shared/systems/leveling/levelingSystem.js`:
```javascript
export function calculateDecayedXp(rawXp, lastXpAt, gracePeriodDays = 7, halfLifeDays = 14)
export async function getEffectiveUserProfile(client, guildId, userId)
export async function getLeaderboard(client, guildId, limit = 10, offset = 0, useDecay = true)
export async function getUserRank(client, guildId, userId, useDecay = true)
export async function recalculateGuildRanks(client, guildId)
```

#### For `shared/systems/polls/pollSystem.js`:
```javascript
export function calculateMemberVoteWeight(member, roleWeightsMap)
export function createAnonymousVoterToken(userId, pollId, secretKey)
export function verifySingleVoteIntegrity(pollData, userId, secretKey)
export async function processWeightedVote(client, interaction, pollData, optionIndex)
```

### 3.2 Database Model Enhancements
1. **`GuildSettings` (`shared/database/index.js`)**:
   - Add leveling decay columns:
     - `decayEnabled`: `DataTypes.BOOLEAN`, default `true`
     - `decayGraceDays`: `DataTypes.INTEGER`, default `7`
     - `decayHalfLifeDays`: `DataTypes.INTEGER`, default `14`
   - Add poll role weights column:
     - `pollRoleWeights`: `DataTypes.JSONB`, default `{}` (e.g. `{ "roleId123": 2.0 }`)

---

## 4. Risk Assessment & Mitigations

| Identified Risk | Impact | Proposed Mitigation |
|-----------------|--------|---------------------|
| Performance overhead of dynamic decay calculations across large guilds during `/leaderboard` queries | High | Cache calculated decayed leaderboard positions in Redis (`leaderboard:decayed:guildId`) with 60s TTL |
| Race conditions during rapid button votes on polls | Medium | Use atomic Redis transactions or mutex per poll ID (`poll:lock:msgId`) during vote application |
| Unintended role stripping if decay drops level | High | Add `decayRoleProtection` toggle or log role demotions clearly with explicit reason string `[Aura Time-Decay]` |
