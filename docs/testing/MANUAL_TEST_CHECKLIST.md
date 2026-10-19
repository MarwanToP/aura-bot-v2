# Aura Bot — Manual Discord Verification Checklist

**How this document is used.** Everything here is executed **inside the Discord client**. No laptop, no terminal, no local tooling. You type a slash command, you read what the bot posts back, you mark PASS / FAIL / VERIFY.

**Command count: 68 registered commands.** The number is not hardcoded in this file — it was enumerated from the runtime loader (`apps/bot/src/core/commandHandler.js` → `loadCommands`), which loads `apps/bot/src/commands/**` first (with overwrite) and then `packages/systems/**` (without overwrite), skipping any export with `register: false` and any export that does not carry both `data` and `execute`. The full matrix in section 3 has **68 rows — one per registered command**.

Commands that exist in the source tree but are deliberately **not** registered (they carry `register: false`): `/imagine`, `/clan`, `/backup`, `/automation`, and the legacy `/help` + `/ping` duplicates inside `utilityCommands.js`. **These are not bugs — do not report them as missing.**

---

## 1. Is the live bot up to date?

The live bot previously ran an **old build** where commands were absent entirely. If the checks below fail, the running process is stale and must be redeployed — no amount of re-running commands will fix it.

### 1.1 Check the custom status (30 seconds)

1. Open the server member list.
2. Find the bot and hover/click it → **Profile**.
3. The status line must read exactly:

```
over Aura Servers | /help
```

This string is set in `apps/bot/src/index.js` (`client.user.setPresence`, activity type `3` = WATCHING, `status: 'online'`).

- Status shows something else (e.g. `Playing …`, `Listening to …`, or nothing) → **the running process is an old build**.
- The bot shows **Offline** → the process is not running at all. This is not a code problem.

### 1.2 Run `/help` — the command total must be real

Run `/help` in any channel.

- **Expected:** an **ephemeral** embed titled `⚡ Aura Bot v2.0 — Command Suite & Documentation` whose description reads `Enterprise Discord Bot loaded with **N primary slash commands**.`, listing every registered command grouped by category (Security & Moderation, Economy & Systems, Management & Staff, Information & Utility, Fun & Games, AI & Chat, Tickets & Support, Voice & Temp Channels, Reminders & Events, and a `🧩 More Commands` catch-all that only appears when there are uncategorised commands).
- `N` is read from the **live command registry** (`client.commands.size`). It is never a hardcoded number. If the running build is current, `N` must be **68**.
- If `N` is lower than 68 → the process is running an **older build** (commands were added after that process started).
- If `/help` is **not in the picker at all** → the build predates it. Redeploy (§6).
- A `⚠️ Aura Bot — Help Unavailable` embed means the help renderer itself threw. That is a real bug — report it (§7).

### 1.3 Run `/doctor` — the health report

Run `/doctor` (requires **Manage Server**; it is hidden from members who lack it).

**Expected:** an **ephemeral** embed titled `🩺 Aura Doctor` containing these fields, in this order:

| Field | What to read | Healthy value |
|---|---|---|
| 🤖 Bot | version • bot tag • gateway ping | `v2.0.0 • <Bot#0000> • <n>ms` |
| ⏱️ Uptime | how long the process has been up | any duration |
| 👥 Guild Members | member count + whether the bot member is cached | `N • bot member cached` |
| 🔧 Build | `v<version> · <commit> (<branch>) · built <ISO timestamp>` | the commit of the code you expect to be live |
| 🗄️ Database | `Connection:` and `Schema query:` | `OK` / `OK` |
| ⚡ Redis | `Status:` | `ready` |
| 🧠 AI | `Available:` + provider | `yes` + provider name, or `no` + reason |
| 📦 Commands | `N commands registered` + `Missing core:` | `71 commands registered` and `All core commands present` |
| 🛡️ Permissions | bot role position + `Missing:` | `Missing: none — all critical permissions granted` |
| 🎯 Intents | MessageContent / GuildMembers / GuildPresences + member-cache proxy | `MessageContent` and `GuildMembers` = `requested` |

The core-command probe list is fixed in `apps/bot/src/commands/utility/doctor.js`: `help, ping, ban, kick, warn, mod, settings, stats`. A non-empty `Missing core:` list means the process is an old build.

**The `🔧 Build` field is the decisive signal.** It prints the git commit, branch and build date of the code the process is actually running. Compare that commit with the commit you deployed. If they differ → redeploy.

### 1.4 Decision table

| Observation | Verdict | Action |
|---|---|---|
| Status `over Aura Servers \| /help` + `/help` shows 68 + `/doctor` shows 68 + `All core commands present` | **Current build** | Continue to §2 |
| `/help` or `/doctor` is missing from the picker | **Old build** | Redeploy (§6), then re-run §1 |
| `/help` shows fewer than 68 | **Old build** | Redeploy (§6), then re-run §1 |
| `/doctor` → `Missing core: …` | **Old build** | Redeploy (§6), then re-run §1 |
| Status text is not `over Aura Servers \| /help` | **Old build** | Redeploy (§6), then re-run §1 |
| Bot is Offline | **Process not running** | Start / restart the process, then re-run §1 |
| `/doctor` shows `Database: FAILED` or `Schema query: FAILED` | **Current build, broken DB** | §5 |
| `/doctor` shows `Redis: …` not `ready` | **Current build, Redis down** | §5 |

---

## 2. Five-minute smoke path

Run these **in order, in a normal text channel** of your test guild. They cover one command from each family and give the widest coverage per second. Do not skip `/doctor` — it is last on purpose, so you see the health report after the other nine have touched the DB.

| # | Command | Expected visible outcome | If it fails |
|---|---|---|---|
| 1 | `/help` | Ephemeral embed `⚡ Aura Bot v2.0 — Command Suite & Documentation`, description `Enterprise Discord Bot loaded with **68 primary slash commands**.` and one field per category. A `🌐 Web Dashboard` link button appears **only if `DASHBOARD_URL` is set**. | §1.2 |
| 2 | `/ping` | Public embed `🏓 Pong!` with three fields: **WebSocket Latency** (`<n>ms`), **Roundtrip Latency** (`<n>ms`), **Uptime** (a relative timestamp like `3 hours ago`). | §5 |
| 3 | `/userinfo` | Public embed with **🆔 User ID**, **🤖 Bot Account**, **📅 Created**, and — for a member cached by the bot — **📥 Joined Server**, a **Status** line, **Nickname** and **Roles**. A member who is not cached simply has no Joined/Status fields (not a failure). | §5 |
| 4 | `/serverinfo` | Public embed `🏰 <guild name>` with member / voice / channel counts, boost tier and features. | §5 |
| 5 | `/rank` | Either a **PNG rank card**, or a text embed with **🏆 Rank**, **📈 Level**, **⭐ Total XP**, **📊 Progress**. On a **fresh server with no XP row yet** the expected result is the "no data" info embed — that is correct behaviour, not a failure. | §5 |
| 6 | `/daily` | Public embed titled `<currency emoji> Daily Points Claimed!` with the amount received, the 🔥 streak and the **New Balance**. Running it a second time in the same day returns `⏳ Daily reward resets in **Xh Ym**.` | §5 |
| 7 | `/suggest submit content:Add a music channel` | **Before setup** the expected result is `⚠️ Suggestions are not enabled in this server. Ask an admin to run /suggest admin setup.` — this is the correct, expected outcome for a fresh guild. **After** an admin runs `/suggest admin setup channel:#suggestions`, `submit` posts a public `💡 New Suggestion` embed with 👍/👎 buttons and an `🆔 ID` field. | §5 |
| 8 | `/remind set duration:10m content:Smoke test` | Ephemeral embed `⏰ Reminder Set` with a relative time (`in 10 minutes`) and a footer `ID #<n>`. Then `/remind list` shows it. | §5 |
| 9 | `/settings view` | Ephemeral embed `⚙️ Aura Settings` with 16 fields (🌐 Language, ⭐ Premium, 📥 Welcome, 📤 Farewell, 📈 Leveling, 🛡️ Anti-Nuke, 🎫 Tickets, 🤖 AI AutoMod, 💬 AI Chat, 📋 Mod Log, 📋 Audit Log, 📋 Staff Log, 📋 Voice Log, 🎭 Auto Role, 📨 Inv. Track, 🔧 Tkt Support). Requires **Manage Server**. | §5 |
| 10 | `/doctor` | Ephemeral `🩺 Aura Doctor` embed with the 10 fields listed in §1.3. **Read `🔧 Build`, `📦 Commands` and `🗄️ Database` first.** | §1.3, §5 |

**Smoke path verdict.** All ten PASS → the bot process is up to date, the DB is reachable, and the command registry is intact. Continue with the full matrix (§3) if you want per-command coverage.

---

## 3. Full command matrix (71 commands)

**How to read the columns.**

- **User perm.** — the permission the *invoking member* must hold. Derived from `userPermissions` / `default_member_permissions` / legacy `permissions` on the command module. `Administrator` and `Manage Server` are the same Discord bit.
- **Bot perm.** — the permission the *bot* must hold **in the channel where the command is run** (from `botPermissions`). If the bot lacks it, the bot now names the missing permission instead of failing with a generic error.
- **AI?** — `Yes` = the command calls the AI provider and returns an AI-unavailable error without one. `Opt` = AI only for one option/subcommand.
- **Premium?** — `Yes` = the command declares `premiumTier > 0` and the router refuses it below that tier.
- **DB / setup** — the rows or configuration the command reads/writes.
- **dmp note** — any command with `default_member_permissions` is **hidden by Discord from members who lack that permission**. "Not visible in the picker" is the **expected** behaviour for those commands, not a bug. Each such row says so.

---

### 3.1 Admin — `apps/bot/src/commands/admin` (7)

| Command | Category | What it does | Subcommands / required options | User perm. | Bot perm. | AI? | Premium? | DB / setup | Expected result | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/aesthetic` | Admin | Skinnable Aesthetic Engine: Customize bot emojis | `success_emoji` (string, optional), `error_emoji` (string, optional) | Administrator | Send Messages, Embed Links | No | No | `GuildSettings.customEmojis` | Ephemeral `✨ Server aesthetics updated!` with the new icons. If neither option is given: `⚠️ Provide at least one of success_emoji or error_emoji to update.` | **dmp → hidden from members without Administrator.** |
| `/deliver` | Admin | Secure DM Delivery System for Private Resources | `user` (user, **req**), `item` (string, **req**) | Administrator | Send Messages, Embed Links | No | No | None — pure Discord DM | Ephemeral `✅ Securely delivered item to @user via Direct Message.` | If the target has DMs closed: `❌ Could not deliver to @user. their DMs might be closed.` **dmp → hidden from non-admins.** |
| `/neural` | Admin | Access the Aura Neural Control Center | sub `analyze`, sub `shield` | Administrator | — | Yes (`analyze`) | No | None (reads channel history) | Ephemeral `🧠 Neural Channel Analysis` or `🛡️ Aura Neural Shield Status` | `analyze` needs at least one non-bot message in the channel, else `📭 Not enough recent human activity…`; without AI it replies `❌ Neural Core is offline (AI not configured).` **dmp → hidden from non-admins.** |
| `/reactionrole` | Admin | Manage reaction role bindings for messages | sub `add` (`message_id` str **req**, `emoji` str **req**, `role` role **req**, `channel` channel, `type` str choices `toggle`/`add_only`/`remove_only`/`unique`), sub `remove` (`message_id`, `emoji`, `role` **req**), sub `list` (`message_id`), sub `clear` (`message_id` **req**), sub `sync` (`message_id` **req**) | Manage Roles | Manage Roles | No | No | Reaction-role binding rows | `✅ Reaction Role Added`, `🔗 Reaction Role Bindings`, `✅ Reactions Synced` | **dmp → hidden from members without Manage Roles.** |
| `/security` | Admin | Advanced Anti-Nuke, Raid Shield & Verification (Wicks/Vetox style) | sub `status`, sub `lockdown` (`action` str **req** choices `on`/`off`, `force` bool), sub `whitelist` (`user` user, `role` role) | Administrator | — | No | No | `GuildSettings.antiNukeConfig` + Redis lockdown flag | Ephemeral `🛡️ Server Security Shield Status` listing Anti-Nuke, Anti-Raid, Verification, Whitelist, Lockdown | `lockdown` actually changes channel permissions — see §3.9 `/lockdown`. `/security backup` is intentionally **not** registered. **dmp → hidden from non-admins.** |
| `/tpanel` | Admin | Open the Visual Ticket Configurator | — | Administrator | Manage Channels | No | No | `GuildSettings.ticket*` | Ephemeral `🎫 Aura Ticket Configuration` panel that **writes the real configuration**: toggle button, category select, log-channel select, add/remove support role | The controls write the same columns as `/settings tickets` (ticketEnabled, ticketCategoryId, ticketLogChannelId, ticketSupportRoles). The bot needs **Manage Channels** — without it the panel replies `❌ I need the Manage Channels permission in <#…> to do that.` and renders no controls. **dmp → hidden from non-admins.** |
| `/onboarding` | Admin | Show how much of Aura is configured for this server, and what to set up next | — | Manage Guild | Manage Guild | No | No | `GuildSettings` (read-only) | Ephemeral `🧭 Aura Setup` checklist: ✅ / ⚠️ / ❌ per feature, the bot's own missing permissions, and the first thing to fix | Read-only — it never writes. Points at `/settings …`, `/verify setup` and `/tpanel` for the missing pieces. **dmp → hidden from members without Manage Server.** |

### 3.2 AI — `apps/bot/src/commands/ai` (6)

| Command | Category | What it does | Subcommands / required options | User perm. | Bot perm. | AI? | Premium? | DB / setup | Expected result | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/ai-permissions` | AI | [Professional] AI role permission analysis & suggestion | `role` (role, **req**), `purpose` (string, optional) | Manage Roles | Manage Roles | Yes | No | Writes a role-permission proposal | `🧠 Neural Role Analysis — <role>` plus a `Permission Diff` field | **dmp → hidden from members without Manage Roles.** Needs a working AI provider. |
| `/aimod` | AI | [Staff] Analyze a message with AI moderation | `message` (string, **req**), `depth` (string, choices `quick` / `deep`) | Moderate Members | Moderate Members | Yes | No | None — analysis only | `🛡️ AI Moderation Analysis` embed with category, severity and the recommended action | `deep` runs the full Gemini analysis; `quick` runs the moderation model. **dmp → hidden from members without Moderate Members.** |
| `/ask` | AI | Ask the AI assistant anything | `question` (string, **req**), `ephemeral` (bool, optional) | — | — | Yes | No | None | An AI answer embed — public unless `ephemeral:true` | Works in DMs (`guildOnly` is false). Without a provider the AI-unavailable error is returned. |
| `/chat` | AI | Have a conversation with the AI (remembers context) | sub `message` (`text` string **req**), sub `clear`, sub `history` | — | — | Yes | No | None (context is in-memory) | `💬 Recent Conversation` embed; `clear` drops the context, `history` replays it | Works in DMs. Needs a working AI provider. |
| `/summarize` | AI | Summarize long text with AI | `text` (string, **req**), `words` (int, 50–300, optional) | — | — | Yes | No | None | `📝 AI Summary` embed | Works in DMs. |
| `/translate` | AI | Translate text between languages using AI | `text` (string, **req**), `to` (string, **req**, 11 choices: en, ar, fr, de, es, ja, zh, ru, tr, id) | — | — | Yes | No | None | `🌐 Translation — <language>` embed | Works in DMs. |

### 3.3 Fun — `apps/bot/src/commands/fun` (2)

| Command | Category | What it does | Subcommands / required options | User perm. | Bot perm. | AI? | Premium? | DB / setup | Expected result | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/avatar` | Fun | View a high-resolution version of a users avatar | `target` (user, optional) | — | — | No | No | None | `👤 <user>'s Avatar` embed with PNG / JPG / WEBP links | Works in DMs. |
| `/meme` | Fun | Generate a random meme from AI neural core | — | — | — | Yes | No | None | `🎭 Neural Meme Generator` embed with the generated text | Without AI: `❌ AI offline.` Works in DMs. |

### 3.4 Games — `apps/bot/src/commands/games` (2)

| Command | Category | What it does | Subcommands / required options | User perm. | Bot perm. | AI? | Premium? | DB / setup | Expected result | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/blackjack` | Games | Play a game of Blackjack against Aura AI | `bet` (int, **req**, 10–1,000,000) | — | — | No | No | `Economy` row for the player | `🎴 Blackjack — <STATUS>` embed with the hand and the new balance | The bet is deducted from the player's balance; a balance that is too low produces an error embed. |
| `/slots` | Games | Spin the Aura Slots | `bet` (int, **req**, 10–1,000,000) | — | — | No | No | `Economy` row for the player | `🎰 Aura Slots` embed with the reels and the new balance | Same bet rules as `/blackjack`. |

### 3.5 General — `apps/bot/src/commands/general` (1)

| Command | Category | What it does | Subcommands / required options | User perm. | Bot perm. | AI? | Premium? | DB / setup | Expected result | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/help` | General | View Aura Bot features, active modules, and documentation. | `category` (string, optional; choices `moderation`, `economy`, `management`, `utility`, `games`, `ai`, `tickets`, `voice`, `events`, `more`) | — | — | No | No | None | Ephemeral `⚡ Aura Bot v2.0 — Command Suite & Documentation` with the real total `loaded with **68 primary slash commands**` and one field per category | The total comes from the live registry. A `🌐 Web Dashboard` button appears **only** when `DASHBOARD_URL` is a valid http(s) URL. |

### 3.6 Management — `apps/bot/src/commands/management` (3)

| Command | Category | What it does | Subcommands / required options | User perm. | Bot perm. | AI? | Premium? | DB / setup | Expected result | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/apply` | Management | Submit a staff or moderator application | sub `start` (`form` string, optional), sub `status` | — | Send Messages | No | No | `ApplicationForm` + `StaffApplication` rows | `start` opens a modal; `status` returns `📋 Application Status` | `start` only has content when an application form is configured — with no open form there is nothing to show. `status` works with no rows: `You have not submitted an application in this server yet.` |
| `/staff` | Management | Staff management and performance tracking | sub `duty`, sub `stats` (`target` user, optional) | — | Manage Messages | No | No | Staff shift records | `👥 Staff Statistics — <user>` | `duty` starts/ends a shift. |
| `/ticket` | Management | Multi-panel support ticket system (TicketTool style) | sub `panel` (`channel` channel **req**, `title` string), sub `close` (`reason` string), sub `claim`, sub `transcript` | — | Manage Channels | No | No | Ticket rows | `✅ Ticket Panel Dispatched`, `🔒 Ticket Closing`, `🙋 Ticket Claimed`, `📄 Ticket Transcript Generated` | `panel` posts a button panel into the given channel. |

### 3.7 Moderation — `apps/bot/src/commands/moderation` (17)

| Command | Category | What it does | Subcommands / required options | User perm. | Bot perm. | AI? | Premium? | DB / setup | Expected result | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/ban` | Moderation | Ban a member | `user` (user, **req**), `reason` (string), `delete_days` (int, 0–7), `silent` (bool) | Ban Members | Ban Members | No | No | Moderation case + warning | `🔨 Banned from <guild>` DM to the target, plus a confirmation embed | The bot's role must be above the target's highest role. **dmp → hidden from members without Ban Members.** |
| `/case` | Moderation | Manage moderation cases | sub `view` (`id` int **req** ≥1), sub `reason` (`id` int **req**, `reason` string **req**), sub `delete` (`id` int **req**) | Moderate Members | Moderate Members | No | No | `ModerationCase` | `📋 Case #<id>` embed, `📝 Case #<id> Updated` | **dmp → hidden from members without Moderate Members.** |
| `/clear` | Moderation | Bulk delete messages | `amount` (int, **req**, 1–100), `user` (user, optional), `bots` (bool, optional) | Manage Messages | Manage Messages | No | No | None | Confirmation embed reporting how many messages were deleted | Only messages newer than 14 days can be bulk-deleted by Discord. **dmp → hidden from members without Manage Messages.** |
| `/history` | Moderation | View moderation history | `user` (user, **req**), `page` (int ≥1, optional) | Moderate Members | Moderate Members | No | No | `ModerationCase` | Paged list of past cases for that user | **dmp → hidden from members without Moderate Members.** |
| `/kick` | Moderation | Kick a member | `user` (user, **req**), `reason` (string, optional) | Kick Members | Kick Members | No | No | Moderation case | `👢 Kicked from <guild>` DM to the target, plus a confirmation embed | **dmp → hidden from members without Kick Members.** |
| `/lockdown` | Moderation | Emergency server lockdown — lock or unlock all text channels | `action` (string, **req**, choices `lock` / `unlock`), `force` (bool, optional) | Administrator | Manage Channels, Manage Roles | No | No | Redis lockdown flag (1 h TTL) + optional audit-log post | `🚨 EMERGENCY SERVER LOCKDOWN ENABLED` / `🔓 Server Lockdown Lifted` | **Destructive:** it removes Send Messages from @everyone in **every** text channel. Always run `/lockdown action:unlock` afterwards. **dmp → hidden from non-admins.** |
| `/mod` | Moderation | Execute moderation actions on a server member. | sub `warn` (`target` user **req**, `reason` string **req**), sub `timeout` (`target` user **req**, `minutes` int **req** 1–40320, `reason` string **req**), sub `ban` (`target` user **req**, `reason` string **req**) | Moderate Members | Moderate Members | No | No | Moderation case + warning | Ephemeral confirmation plus a public follow-up | The `ban` subcommand additionally requires the **invoking member** to hold Ban Members (checked inside the handler). **dmp → hidden from members without Moderate Members.** |
| `/modstaff` | Moderation | Staff Performance Analytics & Shift Tracker | sub `shift` (`action` string **req**, choices `start` / `end`), sub `stats` | Manage Messages | — | No | No | Staff shift records | `📊 Staff Analytics Report` | **dmp → hidden from members without Manage Messages.** |
| `/note` | Moderation | Add a private moderator note to a user (not visible to the user) | `user` (user, **req**), `content` (string, **req**) | Moderate Members | Moderate Members | No | No | `ModerationCase` (type `note`) | `📝 Note Added` | **dmp → hidden from members without Moderate Members.** |
| `/role` | Moderation | Role management utilities | sub `add` (`user` user **req**, `role` role **req**, `reason` string), sub `remove` (`user` user **req**, `role` role **req**, `reason` string), sub `all` (`role` role **req**), sub `bots` (`role` role **req**) | Manage Roles | Manage Roles, Manage Guild | No | No | None | `✅ Mass Role Complete` for `all` / `bots`; per-user confirmations for `add` / `remove` | The bot's role must be **above** the role it grants. **dmp → hidden from members without Manage Roles.** |
| `/slowmode` | Moderation | Set or remove slowmode in the current channel | sub `set` (`seconds` int **req** 0–21600, `reason` string), sub `off` | Manage Channels | Manage Channels | No | No | None | `⏱️ Slowmode Updated` | Acts on the channel the command is run in. **dmp → hidden from members without Manage Channels.** |
| `/softban` | Moderation | Softban to purge messages | `user` (user, **req**), `reason` (string), `delete_days` (int, 1–7) | Ban Members | Ban Members | No | No | Moderation case | `🔨 Banned from <guild>` DM to the target, plus a confirmation embed | **dmp → hidden from members without Ban Members.** |
| `/timeout` | Moderation | Timeout a member | `user` (user, **req**), `duration` (string, **req**), `reason` (string), `remove` (bool, optional) | Moderate Members | Moderate Members | No | No | Moderation case | `⏰ Timed Out in <guild>` DM to the target, plus a confirmation embed | **dmp → hidden from members without Moderate Members.** |
| `/unban` | Moderation | Unban a user by their Discord ID or tag | `user_id` (string, **req**), `reason` (string, optional) | Ban Members | Ban Members | No | No | Moderation case | `✅ Unbanned from <guild>` | Takes a **raw user ID**, not a @mention. **dmp → hidden from members without Ban Members.** |
| `/warn` | Moderation | Warn a member | `user` (user, **req**), `reason` (string, **req**) | Moderate Members | Moderate Members | No | No | `Warning` + moderation case | `⚠️ Warning in <guild>` DM to the target, plus a confirmation embed | **dmp → hidden from members without Moderate Members.** |
| `/warnings` | Moderation | View active warnings | `user` (user, **req**) | Moderate Members | Moderate Members | No | No | `Warning` | `📋 Warnings — <user>` embed | **dmp → hidden from members without Moderate Members.** |
| `/auditlog` | Moderation | View this server's Discord audit log (who changed what, and when) | `limit` (int 1–25, optional), `user` (user, optional), `action` (string, optional — e.g. `ban`, `kick`, `channel_create`, `role_create`) | Manage Guild | View Audit Log | No | No | None — reads the Discord API, not the database | Ephemeral embed listing each entry (action, target, executor, relative time) | An unknown `action` name is ignored instead of erroring. Without **View Audit Log** the bot replies with the missing-permission message. |

### 3.8 Premium — `apps/bot/src/commands/premium` (8)

| Command | Category | What it does | Subcommands / required options | User perm. | Bot perm. | AI? | Premium? | DB / setup | Expected result | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/credits` | Premium | View your premium Aura Profile Card & Points | `user` (user, optional) | — | — | No | No | `Economy` row | Profile embed with the credits, reputation and streak, plus profile buttons; a `banner_profile.png` attachment is included when that asset exists in the deployment | Falls back to placeholder values (credits / rep / streak) when the wallet row has no values yet. |
| `/daily` | Premium | Claim your daily Aura Credits reward | — | — | — | No | No | `Economy` row + **Redis** daily-claim key | Embed titled `<currency emoji> Daily Points Claimed!` — amount received, 🔥 streak (with bonus) and **New Balance** | The once-per-day gate lives in Redis (`daily:<user>:<guild>`); a second claim returns `⏳ Daily reward resets in **Xh Ym**.` If Redis is down the command errors — check `/doctor` → `⚡ Redis`. |
| `/rep` | Premium | Give a reputation point to another user | `user` (user, **req**) | — | — | No | No | `Economy` rows (sender + target reputation) | `✅ You gave a reputation point to <@user>!` with their new reputation count | Self-rep → `❌ You cannot give reputation to yourself.`; bots → `❌ Bots do not need reputation.`; a per-user cooldown returns `⏳ You can give another reputation point in **N hours**.` |
| `/richlist` | Premium | View the richest members in the server | — | — | — | No | No | `Economy` rows | `🏆 Richest Members - <guild name>` | Empty list on a fresh server. |
| `/tempchannel` | Premium | Create a temporary channel (Premium: 100) | sub `create` (`name` string **req**, `type` string choices `text` / `voice`, `duration` int 0–10080, `owner` user) | Manage Channels | Manage Channels | No | No — but it **costs 100 credits** | `TempChannel` + `Economy` | Confirmation embed naming the created channel | "Premium: 100" is a **credit cost**, not a premium-tier gate — `premiumTier` is 0. **dmp → hidden from members without Manage Channels.** |
| `/timedmsg` | Premium | Schedule recurring messages (Premium: 100) | sub `add` (`channel` channel **req**, `content` string **req**, `interval` int **req** 300–604800), sub `list`, sub `delete` (`id` int **req**) | Manage Guild | Send Messages | No | No — but it **costs 100 credits** | `TimedMessage` rows | `⏰ Timed Messages` list | "Premium: 100" is a **credit cost**, not a premium-tier gate. **dmp → hidden from members without Manage Server.** |
| `/transfer` | Premium | Transfer coins to another user | `user` (user, **req**), `amount` (int, **req** ≥1) | — | — | No | No | `Economy` rows | `✅ Transferred **N <currency>** to <@user> (Fee: X)` plus the sender's **Your Balance** | A transfer fee is deducted from the amount (`config.economy.transferFee`) — check the **Fee** value in the reply. |
| `/work` | Premium | Work to earn coins (4hr cooldown) | — | — | — | No | No | `Economy` row + **Redis** work-cooldown key | Embed (no title) reading `💼 You **<job>** and earned **N <currency> coins**!` | The 4-hour cooldown lives in Redis (`work:<user>:<guild>`); running it again returns `⏳ You can work again in **Xh Ym**.` |

### 3.9 Utility — `apps/bot/src/commands/utility` (18)

| Command | Category | What it does | Subcommands / required options | User perm. | Bot perm. | AI? | Premium? | DB / setup | Expected result | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/aura` | Utility | Aura AI Commands | sub `join`, sub `leave` | — | — | Yes (intent parsing) | No | None | `🎙️ Aura Voice Assistant — I have joined the voice channel and am now listening!` | Needs the optional `openai` package for Whisper transcription **and** View Channel / Connect / Speak for the bot in that voice channel. Without the package the transcription silently does nothing. |
| `/autoresponder` | Utility | Manage automatic replies when specific phrases are detected in messages | sub `add` (`trigger` string **req**, `trigger_type` string **req** choices `exact`/`contains`/`startsWith`/`regex`, `response` string **req**, `cooldown` int 0–3600, `use_ai` bool), sub `remove` (`id` int **req** ≥1), sub `list`, sub `toggle` (`id` int **req** ≥1), sub `edit` (`id` int **req** ≥1, `trigger` string, `response` string, `cooldown` int 0–3600) | Manage Guild | Manage Guild | Opt (`use_ai`) | No | Auto-responder rows | `✅ Auto-Responder Created` (with the id) / `🔗 Auto-Responders (N)` | A free-tier limit is enforced → `🚫 Free-tier limit reached`. A `regex` trigger is a ReDoS risk — prefer `contains`. **dmp → hidden from members without Manage Server.** |
| `/doctor` | Utility | Diagnose Aura Bot health in this server | — | Manage Guild | — | No | No | None — read-only probes | Ephemeral `🩺 Aura Doctor` with 10 fields (see §1.3) | **dmp → hidden from members without Manage Server.** Primary "is the live bot up to date?" probe. |
| `/invites` | Utility | Advanced Invite Tracker analytics (Invite Tracker style) | sub `stats` (`user` user, optional), sub `leaderboard`, sub `addbonus` (`user` user **req**, `amount` int **req** 1–10000) | — | Manage Guild | No | No | `InviteTrack` rows | `🏆 Top Server Inviters`, `📊 Invite Statistics for <user>`, `🎁 Bonus Invites Added` | `addbonus` additionally checks Manage Guild **inside** the handler. The tables stay empty unless invite tracking is enabled (`/settings invitetrack enabled:true`) or members joined through a tracked invite. |
| `/ping` | Utility | Check bot latency, uptime, and gateway heartbeat. | — | — | — | No | No | None | Public `🏓 Pong!` embed — WebSocket Latency, Roundtrip Latency, Uptime | No DB, no Redis. Works in DMs. |
| `/rank` | Utility | View your rank card | `user` (user, optional) | — | — | No | No | `UserProfile` row (XP) | A PNG rank card, or a text embed with 🏆 Rank / 📈 Level / ⭐ Total XP / 📊 Progress | With no XP row the expected result is the "no data" info embed. Card rendering uses `@napi-rs/canvas`. |
| `/leaderboard` | Utility | Server XP leaderboard | `page` (int ≥1, optional) | — | — | No | No | `UserProfile` rows | Paged leaderboard embed, 10 entries per page | Empty in a fresh server. |
| `/search` | Utility | Search anything with AI summary | `query` (string, **req**) | — | — | Yes | No | None | `🔍 <query>` embed with the AI answer | Without AI: `❌ AI not configured.` Works in DMs. |
| `/settings` | Utility | Configure Aura Bot | sub `view`; sub `language` (`lang` string **req** choices `en`/`ar`); sub `welcome` (`enabled` bool, `channel` channel, `card` bool); sub `farewell` (`enabled` bool, `channel` channel); sub `modlog` (`channel` channel **req**); sub `auditlog` (`channel` channel **req**); sub `leveling` (`enabled` bool, `channel` channel, `multiplier` number 0.1–5); sub `antinuke` (`enabled` bool **req**); sub `aimod` (`enabled` bool **req**); sub `aichat` (`channel` channel, `enabled` bool); sub `autorole` (`role` role **req**, `delay` int 0–86400); sub `tickets` (`enabled` bool, `category` channel, `support_role` role, `log_channel` channel); sub `invitetrack` (`enabled` bool **req**); sub `stafflog` (`channel` channel **req**); sub `voicelog` (`channel` channel **req**) | Manage Guild | Send Messages | No | No | `GuildSettings` — one row per guild | `view` → ephemeral `⚙️ Aura Settings` with 16 fields; any setter → `✅ Settings updated successfully.` | `view` creates the `GuildSettings` row on first use (`findOrCreate`). **dmp → hidden from members without Manage Server.** |
| `/stats` | Utility | Configure live server stats counter channels (👥 Members, 🟢 Online, 🤖 Bots) | sub `enable`, sub `disable`, sub `set` (`members` channel, `online` channel, `bots` channel), sub `view`, sub `refresh` | Manage Guild | — | No | No | `GuildSettings` counter-channel ids | `✅ Stats Enabled`, `🔄 Stats Disabled`, `✅ Counter Channels Set`, `📊 Server Stats Configuration` | The bot needs **Manage Channels** in the target voice channels to rename them. **dmp → hidden from members without Manage Server.** |
| `/suggest` | Utility | Submit, review and manage community suggestions | sub `submit` (`content` string **req**, 10–2000 chars); group `admin` → sub `setup` (`channel` channel **req**), sub `approve` (`id` int **req**, `note` string), sub `reject` (`id` int **req**, `note` string), sub `implement` (`id` int **req**), sub `list` (`status` string **req** choices `pending`/`approved`/`rejected`/`implemented`), sub `toggle` | — (the `admin` group checks Manage Server inside the handler) | Send Messages | No | No | `GuildSettings.suggestions*` + `Suggestion` rows | `submit` posts a public `💡 New Suggestion` embed with 👍/👎 buttons and an `🆔 ID` field; `admin list` shows `N <status> suggestion(s)` | `submit` returns `⚠️ Suggestions are not enabled in this server. Ask an admin to run /suggest admin setup.` until setup is done. The `admin` group without Manage Server replies `❌ You need Manage Server permission for this.` |
| `/userinfo` | Utility | Display detailed information about a user | `user` (user, optional) | — | — | No | No | `UserProfile` + counts of `ModerationCase` and `Warning` | Embed with 🆔 User ID, 🤖 Bot Account, 📅 Created, and for a cached member 📥 Joined Server, a Status line, Nickname and Roles | Guild-only. A member the bot has not cached simply has no Joined-Date / Status field. |
| `/roleinfo` | Utility | Display detailed information about a role | `role` (role, **req**) | — | — | No | No | None | `📊 Role: <role>` embed with member count, colour and permission list | Pure Discord API read. |
| `/serverinfo` | Utility | Display detailed information about this server | — | — | — | No | No | None | `🏰 <guild>` embed with member / voice / channel counts, boost tier and features | Guild-only. |
| `/verify` | Utility | Set up a verification gate so new members must prove they are human before gaining access | sub `setup` (`role` role **req**, `channel` channel), sub `panel`, sub `disable`, sub `view` | Administrator | Manage Roles | No | No | `GuildSettings.verification*` | `setup` → `✅ Verification Configured`; `panel` → posts a `🛡️ Verification Required` embed with a **Verify** button into the configured channel; `view` → `🛡️ Verification Configuration` | The bot's role must be **above** the verified role. `panel` without setup returns `⚠️ Run /verify setup first…`. **dmp → hidden from non-admins.** |
| `/voice` | Utility | Manage temporary voice channels | sub `setup` (`creator_channel` voice channel **req**, `category` category channel), sub `lock`, sub `unlock`, sub `name` (`name` string **req**), sub `limit` (`limit` int **req** 0–99), sub `ai` (`action` string **req** choices `start`/`stop`, `log_channel` text channel) | — | Manage Channels | Opt (`ai` subcommand) | No | `TempChannel` rows | `setup` → `🔊 TempVoice Initialized`; the room commands → `🔒 Your room is now Locked.` / `🔓 Your room is now Unlocked.` / rename / limit | `lock`/`unlock`/`name`/`limit` only work inside a temp room **you own** — otherwise `❌ This is not a temporary channel.` or `❌ Only the room owner can manage it.` The `ai` subcommand needs the optional `openai` package. |
| `/remind` | Utility | Manage your personal reminders | sub `set` (`duration` string **req**, 1 minute – 365 days, e.g. `10m`/`2h`/`3d`; `content` string **req** ≤500), sub `list`, sub `cancel` (`id` int **req** ≥1) | — | Send Messages | No | No | `Reminder` rows | `set` → ephemeral `⏰ Reminder Set` with a relative time and footer `ID #<n>`; `list` → pending reminders; `cancel` → confirmation | Max 25 pending reminders per user per guild. Delivery happens in the background cron job (original channel first, DM fallback). |
| `/profile` | Utility | Show a rich member profile card: level, XP, economy and moderation stats | `user` (user, optional — defaults to you) | — | — | No | No | `UserProfile`, `Economy`, moderation cases | Embed with level, XP, messages, voice minutes, reputation, balance and case count, plus a rendered card image when the native canvas module is available | Guild-only. The image is optional — the text embed always renders (the card degrades to text if the native module is missing). |

### 3.10 Shared systems — `packages/systems` (7)

| Command | Category | What it does | Subcommands / required options | User perm. | Bot perm. | AI? | Premium? | DB / setup | Expected result | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/bank` | Systems (economy) | Access your Aura Central Bank account | sub `balance` (`user` user, optional), sub `deposit` (`amount` int **req** ≥1), sub `withdraw` (`amount` int **req** ≥1) | — | — | No | No | `Economy` rows | `balance` → `📊 Aura Bank Statement` with the wallet and vault balances; `deposit` → `🏦 Vault Deposit Successful`; `withdraw` → `🏦 Vault Withdrawal Successful` | The `Economy` row is created on first use. |
| `/shop` | Systems (economy) | Browse the server shop | sub `browse`, sub `buy` (`id` int **req**, `quantity` int 1–10), sub `add` (`name` string **req**, `price` int **req** ≥1, `description` string, `role` role, `stock` int), sub `remove` (`id` int **req**) | — | — | No | No | `ShopItem` + `Inventory` rows | `🛒 Server Shop` list / `✅ Purchase Successful!` | `browse` on an empty shop shows an empty list. `add` / `remove` declare **no** user permission — do not expose them to untrusted members. |
| `/birthday` | Systems (birthday) | Birthday management | sub `set` (`day` int **req** 1–31, `month` int **req** 1–12, `year` int 1900–2025), sub `remove`, sub `check` (`user` user), sub `upcoming`, sub `configure` (`channel` channel, `role` role, `message` string, `enabled` bool) | — | Send Messages | No | No | Birthday rows + `GuildSettings` | `🎂 Birthday — <user>`, `🎂 Upcoming Birthdays`, `🎉 Happy Birthday, <user>!` | The `year` option is capped at **2025** by the builder — a later year is rejected by Discord. |
| `/customcmd` | Systems (custom commands) | Manage custom commands | sub `add` (`name` string **req**, `response` string **req**, `description` string, `ai_powered` bool, `cooldown` int 0–86400), sub `edit` (`name` string **req**, `response` string, `enabled` bool), sub `delete` (`name` string **req**), sub `list` (`page` int ≥1), sub `info` (`name` string **req**) | Manage Guild | Send Messages | Opt (`ai_powered`) | No | Custom-command rows | `📚 Custom Commands (N/limit)` list | An `ai_powered` custom command calls the AI provider when triggered. **dmp → hidden from members without Manage Server.** |
| `/giveaway` | Systems (giveaway) | Giveaway management [Premium] | sub `start` (`prize` string **req**, `duration` string **req**, `winners` int 1–20, `channel` channel), sub `end` (`id` string **req**), sub `reroll` (`id` string **req**, `count` int ≥1), sub `list` | Manage Guild | Send Messages | No | **Yes — tier 1** | Giveaway rows | `🎉 GIVEAWAY — <prize>` with an enter button, `🎉 GIVEAWAY ENDED`, `🎉 Giveaway Rerolled!`, `🎉 Active Giveaways` | On tier 0 the router refuses it with `⭐ Requires Premium Tier 1` and an "Unlock Premium" button. **dmp → hidden from members without Manage Server.** |
| `/poll` | Systems (polls) | Create an interactive poll | sub `create` (`question` string **req**, `option1` string **req**, `option2` string **req**, `option3` string, `option4` string, `option5` string, `duration` string, `anonymous` bool), sub `end` (`message_id` string **req**), sub `results` (`message_id` string **req**) | — | Send Messages | No | No | Poll rows | `📊 <question>` poll embed with vote buttons / `📊 Poll Results — <question>` | `option1` and `option2` are required; 3–5 are optional. |
| `/social` | Systems (social alerts) | Manage social media alerts [Premium] | sub `add` (`platform` string **req** choices `twitch`/`youtube`/`reddit`/`rss`/`twitter`/`instagram`/`tiktok`/`bluesky`/`kick`/`podcast`, `identifier` string **req**, `channel` channel **req**, `message` string, `ping` role), sub `remove` (`id` int **req**), sub `list`, sub `test` (`id` int **req**) | Manage Guild | Send Messages | No | **Yes — tier 1** | Social-alert rows | `📢 Social Alerts (N)` list; `test` posts `🧪 Test Post from <identifier>` | On tier 0 the router refuses it with `⭐ Requires Premium Tier 1`. **dmp → hidden from members without Manage Server.** |

---

## 4. Known-dark list

These features **cannot work in a plain guild** without extra setup. Each row gives the one-line reason and the fix. Do not report these as bugs.

| Feature | Why it is dark (one line) | Fix |
|---|---|---|
| **AI moderation** (auto-moderation of messages, `/aimod`, AI-written moderation cases) | The moderation model runs in the AI worker; the bot only consumes its verdicts, and without a worker no verdicts arrive — so no cases are written. | The bot now **embeds** the AI worker in-process (`apps/ai-worker/src/embedded.js`), so the normal single-process deployment works out of the box. Set `AI_WORKER_STANDALONE=true` **only** when a separate `npm run start:worker` service is running — otherwise nothing consumes the queue. **AI moderation is OFF by default** — it must be enabled per guild: `/settings aimod enabled:true`. |
| **AI chat commands** (`/ask`, `/chat`, `/summarize`, `/translate`, `/search`, `/meme`, `/neural analyze`, `/ai-permissions`, `ai_powered` custom commands) | No chat provider is configured, so `client.ai.isAvailable()` is false and the commands return the "AI not configured" error. | Set `GEMINI_API_KEY` **or** `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` (+ `AI_PROVIDER=cloudflare` to prefer Cloudflare), and keep `AI_ENABLED=true` (`AI_ENABLED=false` disables AI entirely). Confirm with `/doctor` → the `🧠 AI` field must read `Available: yes`. |
| **Voice transcription** (`/aura join`, `/voice ai start`, AVA wake-word commands) | Whisper transcription requires the optional `openai` package, which is not a dependency of the project — the dynamic import fails and no text is ever produced. | Install the optional package (`npm i openai`) and set `OPENAI_API_KEY`, **and** give the bot View Channel / Connect / Speak in the voice channel. |
| **Premium-tier commands** (`/giveaway`, `/social`) | The router compares the guild's `GuildSettings.premiumTier` against the command's `premiumTier` and refuses below it. | Raise the guild's premium tier in the database (`GuildSettings.premiumTier`). Until then the command answers `⭐ Requires Premium Tier 1` — that is the correct behaviour, not a failure. |
| **`/apply` and the staff-application flow** | The modal is built from a configured application form; with no `ApplicationForm` row there is nothing to render. | Create an application form (via the dashboard's application module, or a `ApplicationForm` row) before running `/apply start`. `/apply status` works regardless. |
| **`/verify`** (the captcha gate) | The gate needs a verification role to grant and a panel channel; without them the panel is not created. | Run `/verify setup role:@Member channel:#welcome` and then `/verify panel`. The bot's role must be **above** the verified role. |
| **`/lockdown` and the anti-nuke / anti-raid shield** (`/security`, `/settings antinuke`) | The anti-nuke subsystem needs its configuration (thresholds, whitelist, enabled flag) before it acts, and `/lockdown` needs a channel-permission pass the bot is allowed to perform. | Enable it with `/settings antinuke enabled:true`, whitelist your staff with `/security whitelist`, and give the bot Manage Channels + Manage Roles. Confirm with `/security status`. |
| **Temp voice** (`/voice setup`, `/tempchannel`, `/aura join`) | Temp voice needs a configured "Join to Create" trigger channel and a target category; the room commands additionally require you to be inside a room you own. | Create a voice channel, run `/voice setup creator_channel:#Create category:#Temp Voice`, then join the trigger channel to get a room. |
| **Dashboard-dependent features** (the `🌐 Web Dashboard` button in `/help`, the dashboard's own panels, the bot→dashboard health ping) | `DASHBOARD_URL` is not set, so the bot omits the button entirely and the monitor has no dashboard to poll. | Set `DASHBOARD_URL` to the dashboard's public https URL and restart the bot process. With it unset, `/help` shows **no** dashboard button — that is the expected behaviour. |
| **`/tpanel` buttons** | The three ticket buttons are a UI stub; they are not wired to persistent storage by design. | Use `/settings tickets …` for the real ticket configuration, or `/ticket panel channel:#support` for the user-facing panel. |
| **`/invites` statistics** | The invite tracker only records joins that arrive through a tracked invite; without tracking enabled the tables stay empty. | Enable `/settings invitetrack enabled:true` and re-invite a member, then re-check `/invites leaderboard`. |
| **Rank card / profile card images** (`/rank`, `/credits`) | The PNG rendering path uses `@napi-rs/canvas`; when it is unavailable the command degrades to a text embed. | Install the native dependency for the platform, or accept the text-embed fallback. |

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| **Command missing from the picker** | Either the command declares `default_member_permissions` — **Discord hides it from members who lack that permission**, which is expected — or the slash commands were never (re)deployed to this guild. | 1. Check the matrix: the row says "**dmp → hidden …**" → it is a permission gate, not a bug. 2. Otherwise redeploy: `npm run deploy -- --all-guilds` (§6). |
| **"The application did not respond"** | Discord's 3-second acknowledgement deadline was missed: the process is busy or blocked on the DB, or the Discord round-trip was too slow. | Check `/doctor` → `🗄️ Database` must read `OK` / `OK`. A dead DB blocks the command; a dead **Redis does not** (the cooldown gate fails open and only logs a warning) — but Redis down will still break `/daily`, `/work` and `/rep`. If the DB is healthy and the command still times out, the process is wedged — restart it. |
| **"column … does not exist"** | Schema drift: the Sequelize models expect a column the live Postgres schema does not have (the app was deployed without the matching migration). | Run `npm run test:db` — it compares every model against the live schema and names the exact missing columns. Then apply the matching migration (`npm run db:migrate`) and redeploy. |
| **"❌ An internal error occurred"** | Two different failures share this wording: a missing bot permission that the command did not declare (Discord answers 403), or an unhandled exception in the command body. | When the command **declares** `botPermissions`, the bot now **names** the missing permission instead of failing generically: `❌ I need the <Permission> in #channel to do that.` — grant exactly that permission to the bot's role **in that channel**, then re-run. If the message is the generic `❌ An internal error occurred…` (no permission named), it is an unhandled exception — report it verbatim (§7). |
| **Nothing happens in DMs** | The command is `guildOnly` and the router refuses it outside a guild: `❌ This command can only be used within a server.` | Run the command inside a guild. The commands that genuinely work in DMs are `/help`, `/ping`, `/ask`, `/chat`, `/summarize`, `/translate`, `/search`, `/avatar`, `/meme`. |
| **AI commands reply nothing / "AI not configured"** | No chat provider is configured, or AI is switched off. | Set `GEMINI_API_KEY` **or** `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`, and make sure `AI_ENABLED` is not `false`. Confirm with `/doctor` → `🧠 AI: Available: yes`. Restart the process after changing the environment. |
| **Moderation cases missing after AI moderation** | The AI path now writes a `ModerationCase` row for every applied action — but only when a verdict was actually applied. | Check `/case view id:<n>` (or `/case list` equivalent) to confirm the row exists. If no verdict was ever produced, the worker is not running (see §4, AI moderation) or the message was never flagged. The action matrix that decides the case type lives in `packages/systems/ai/aiModerationActions.js`. |
| **"⏳ Please wait Ns before using /x again"** | The Redis cooldown gate is active for that user + command. | Wait the stated time. Cooldowns are declared in milliseconds on the command and normalised to whole seconds by the router. A bot that restarted still keeps the cooldown in Redis. |
| **"This command is not loaded on the bot"** | The slash command is registered with Discord, but the running process has no such command — the process is an old build. | Redeploy the process (§6) and re-check `/help` and `/doctor`. |
| **"This command has been disabled by administrators"** | A `CommandSettings` row for this guild + command has `enabled = false`, or a role allow-list excludes you. | `/settings view` shows guild-level state; the per-command row is edited from the dashboard's Command Settings module. |
| **"You do not have the required role to use this command."** | Same `CommandSettings.allowedRoles` allow-list, this time for your member's roles. | Grant one of the allowed roles, or clear the allow-list from the dashboard. |
| **`/lockdown` locked you out** | Lockdown removes Send Messages from @everyone in every text channel. | `/lockdown action:unlock` (it works even from a locked channel because the bot's own permissions are unaffected), or `action:unlock force:true` if the tracker shows no active lockdown. |

---

## 6. Re-deploying the slash commands

Slash commands are registered with Discord, not with the running process. Changing the code does **not** change the picker; you must deploy again.

```bash
# 1. Dry run — prints every command that would be registered, makes NO Discord API call.
npm run deploy -- --dry-run

# 2. Guild-scoped deploy — INSTANT for that one guild.
npm run deploy -- --guild <GUILD_ID>

# 3. Every guild the bot is in — INSTANT per guild, plus a global deploy.
npm run deploy -- --all-guilds
```

- `--guild <ID>` writes the guild-scoped command set. **Guild-scoped commands appear immediately.**
- A plain `npm run deploy` (no flags) registers the **global** command set. **Global commands can take up to 1 hour to propagate.**
- `--all-guilds` does both: an instant guild-scoped deploy for every guild the bot has joined, and then a global deploy for the rest of Discord. This is the recommended command after a release.
- `--guild` also accepts `DISCORD_GUILD_ID` from the environment when the ID is omitted.

**Verify the registration against the code:**

```bash
node deploy/scripts/tests/check-live-registration.js
```

It compares what the repository defines with what Discord actually has registered — globally and per guild — and prints `missing from Discord` and `stale on Discord` command lists, plus a final `global in sync : YES|NO` / `guilds in sync : YES|NO` summary. It is read-only.

**Reminder:** redeploying the *commands* does not restart the *process*. If the running process is an old build, redeploy the process too, then re-run §1 (`/help` + `/doctor`).

---

## 7. Report format

When something fails, reply with exactly these fields. They are enough to reproduce the issue without you running anything else.

```
Command:        /exact command name and full arguments
                e.g. /settings modlog channel:#mod-logs
Guild:          <guild name> (<guild id>)
Channel:        #channel-name (the channel the command was run in)
Error text:     the EXACT message the bot sent, copied verbatim
                (include the embed title and the full description)
Expected?:      yes — did the bot show the embed described in the matrix?
                no  — what you expected to see instead
Your role perms: which of the command's User perm. you hold
                (e.g. Manage Server, Moderage Members, none)
Bot role perms:  the bot's permissions in that channel
                (Server Settings → Roles → <bot role> → Permissions)
When:           the date + time (local) the failure happened
Replied?:       did the bot reply at all? (silent / wrong embed / correct embed / error)
```

**Additional fields to include when the failure is in §1 (up-to-date check) or §4 (known-dark list):**

```
/help total:    the number of commands /help reported
/doctor Build:  the exact "🔧 Build" line
/doctor AI:     the exact "🧠 AI" line
/doctor Redis:  the exact "⚡ Redis" line
/doctor DB:     the exact "🗄️ Database" line
```

**Rules for a good report.**

- Copy the error text verbatim — do not paraphrase it. The exact wording identifies the code path.
- Say explicitly whether the bot showed the expected embed or a different one. "It did nothing" and "It showed the wrong embed" are different bugs.
- Do not report anything listed in §4 (known-dark) as a failure. If you believe a §4 item should work in your setup, say which setup step you completed.
- Do not report a command that is hidden from the picker because it declares `default_member_permissions` — those rows say "**dmp → hidden …**" in §3.
- One report per failing command. Do not bundle a whole page of commands into one report.
