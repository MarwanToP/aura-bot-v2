# Changelog

All notable changes to Aura Bot v2 are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] — 2026-10-19

The "make every command actually work" release. The bot now runs **71 slash commands**,
all verified by an offline execution harness, a live runtime audit and a real Discord
registration check.

### Fixed — why commands appeared broken

- **Slash commands were never (fully) published.** The live bot had 25 of 67 commands
  registered globally and **0** in the main guild. A deploy now publishes the exact set
  the runtime loads, and refuses to publish a partial tree.
- **Live database schema drift.** `application_forms` / `staff_applications` were missing
  11 columns and had the wrong `id` / `status` types, which broke `/apply` and the whole
  dashboard (`column "id" does not exist`). 21 missing model indexes were created; all 32
  models now match the live database (0 column / type / PK / index drift).
- **Runtime services were never attached.** `client.db`, `client.i18n`, `client.ai` and
  `client.logger` did not exist, so every command that touched the database or i18n
  failed. They are now attached at boot, with `i18n.init()` and `aiService.init()`.
- **Cooldown unit bug.** Cooldowns are declared in milliseconds but were applied as
  seconds — a 3000 ms cooldown became 50 minutes. Normalized, and the dead `cd:` key
  namespace removed.
- **Redis could hang the bot for 43 s** on a dead server, past Discord's 3 s deadline
  ("The application did not respond"). The client now fails fast, and the cooldown gate
  fails **open** after 1.5 s.
- **A placeholder `DISCORD_TOKEN` booted silently** — the process stayed alive and never
  connected. Placeholders are now fatal in production (dev still warns).
- **Missing bot permissions surfaced as a generic 403.** 34 commands now declare the
  permission they need, and the error names it: *"❌ I need the Manage Roles and Manage
  Channels permissions in <#…> to do that."*
- **Deprecated discord.js APIs removed** — `ephemeral: true` (76 sites) → `flags:
  MessageFlags.Ephemeral`, `fetchReply` → `withResponse`/`fetchReply`, `ready` →
  `clientReady`.
- **The AI worker was never started** by `npm run dev`. It now runs embedded in the bot
  process (one gateway connection per host) with SIGTERM handling, bounded retries and a
  dead-letter list, and can still be run standalone.
- **The syntax gate never checked a single bot file** (the skip rule matched any path
  containing "app"). It now skips only genuine JSX files.
- **The CI/CD pipeline always ended red** — a deploy step pointed at a directory that
  does not exist. Removed, and the pipeline now runs the full smoke gate before shipping.

### Fixed — correctness, safety and privacy

- Per-guild **command blacklist / disabled channels are now enforced** (they were dead
  code behind an unreachable router).
- **ReDoS**: auto-responder patterns are validated on write *and* re-validated at read
  time; a catastrophic pattern can no longer freeze the event loop.
- **SSRF**: social-alert identifiers are validated (https + per-platform host allow-list
  + private/loopback/link-local rejection) before any server-side fetch.
- **Mass-mention**: every reply that carries user content now sets `allowedMentions`.
- **Wallet race condition**: economy credits/debits are atomic (concurrent `/daily` no
  longer loses coins), and a purchase can no longer push a balance negative.
- **AI moderation is opt-in per guild** instead of implicitly ON for every guild that had
  no settings row (it was sending every message of every user to the model).
- **Un-acked buttons** (`poll:end`, `economy:gamble`, `economy:transfer`) no longer show
  *"This interaction failed"*.
- **Native canvas can no longer take the bot down**: `@napi-rs/canvas` is imported lazily
  and guarded, so a missing binary degrades to text output instead of killing the process.
- **Birthday announcements** now fire at 09:00 in each guild's own timezone.
- Prototype-pollution guards in the dashboard API, atomic guild-scoped suggestion votes,
  guild-scoped per-user language, real `/modstaff` statistics (no more invented numbers).

### Added

- **`/profile`** — a rich member profile (level, XP, messages, voice minutes,
  reputation, balance, moderation history) with a rendered card.
- **`/onboarding`** — an admin setup checklist that shows exactly how much of the bot is
  configured for the guild and what to run next.
- **`/auditlog`** — a real Discord audit-log viewer for moderators.
- **`/remind`** — one-shot reminders (own table, per-minute worker, DM fallback).
- **`/doctor`** — an in-bot health report (database, Redis, AI, commands, permissions,
  intents, build commit).
- **Bot-permission gates**, **named permission errors**, **build stamp** in `/doctor`
  (so a stale build is visible at a glance).
- **Verification tooling**: `test:commands` (offline harness that executes every command
  path and fails on a thrown error, a missing reply **or** a logged error), `test:db`,
  `test:db:types`, `test:live` (live gateway/DB/Redis/AI/registration audit) and
  `check-live-registration` (read-only diff of code vs Discord).
- **Deployment runbooks**: `docs/testing/DEPLOYMENT_CHECKLIST.md`,
  `docs/testing/MANUAL_TEST_CHECKLIST.md`, `docs/testing/WISPBYTE_DEPLOY.md`.

### Changed

- The deploy script and the registration checker now use the **same loader as the
  bot**, so "published" and "runnable" can no longer drift apart.
- `npm run dev` / `start:all` run bot + dashboard + AI worker; `concurrently` moved to
  runtime dependencies so containers can start them too.
- `/help` is generated from the live command set (no hardcoded list), and `/invites`,
  `/security`, `/lockdown`, `/mod`, `/tpanel`, `/modstaff` now show and change **real**
  data instead of placeholders.

### Action required after upgrading

1. Pull the new build and restart the bot process (the live bot is still running an old
   build).
2. Run `npm run deploy -- --all-guilds` to publish the current 71 commands.
3. Enable AI moderation per guild if you want it: `/settings aimod enabled:true`.

---

## [2.0.0]

Initial modular rewrite: Discord bot + Next.js dashboard + Gemini AI worker on an
npm-workspaces monorepo, with 57 slash commands, Sequelize + Prisma data layers,
Redis-backed queues and a moderation pipeline.
