# Aura Bot v2 — Deployment Checklist

Follow this top-to-bottom. Every step lists the exact command or portal path.
Paths are relative to the repository root.

---

## 1. Environment

```bash
cp .env.example .env      # then fill in every placeholder value
```

`.env.example` lists the variables the config schema reads
(`packages/config/src/env.js`) plus the ones the runtime picks up directly
(`packages/config/index.js`, `packages/logger/index.js`).

Minimum for a local run: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DATABASE_URL`,
`REDIS_URL`, `GEMINI_API_KEY`.

---

## 2. Discord Developer Portal — Privileged Gateway Intents

Portal: **Discord Developer Portal → your application → Bot → Privileged Gateway Intents**.

| Intent | Enable it | What breaks when it is OFF |
|---|---|---|
| **MESSAGE CONTENT** | yes | `message.content` is empty. AI moderation queues empty text (`apps/bot/src/events/messageCreate.js`), auto-responders and custom commands never match, and the worker analyses nothing. |
| **SERVER MEMBERS** | yes | `guildMemberAdd` / `guildMemberRemove` never fire → welcome/leave messages, auto-role on join and the anti-raid member counters stay dead (`apps/bot/src/index.js`). |
| **PRESENCE** | only if you use presence features | The portal toggle alone changes nothing — the gateway client in `apps/bot/src/index.js` does not request `GuildPresences`, so presence/activity events are never delivered and voice activity features cannot react to what a member is playing. |

The gateway client requests `MessageContent` and `GuildMembers`
(`apps/bot/src/index.js`); the bot cannot detect the portal switches itself —
`/doctor` only prints a reminder (`apps/bot/src/commands/utility/doctor.js`).

---

## 3. Bot permissions per feature family

Invite the bot to the server with the **bot** scope, then grant the permissions
each family needs. `Administrator` is not required and should not be used.

| Feature family | Permissions the bot needs |
|---|---|
| Moderation (ban, kick, timeout, cases, purge) | Ban Members · Kick Members · Moderate Members · Manage Roles · Manage Channels · View Audit Log |
| Roles (reaction roles, level roles, auto-role) | Manage Roles |
| Voice (temp voice, voice channels) | Manage Channels · Connect · Speak · Move Members |
| Tickets | Manage Channels · Manage Roles |
| Economy & leveling | Manage Roles |

`View Audit Log` is required by the anti-nuke system, which reads the Discord
audit log to tell a bot action apart from a moderator action
(`packages/systems/antinuke/antiNuke.js`).

---

## 4. Register the slash commands

```bash
npm run deploy -- --all-guilds     # instant per-guild + global
npm run deploy -- --guild <GUILD_ID>  # instant for one guild only
npm run deploy                     # global only
```

- Guild-scoped registration (`--guild <ID>` / `--all-guilds`) is **instant**.
- Global registration takes **up to 1 hour** to propagate to every guild.
- `--all-guilds` registers to every guild the bot has joined *and* globally.

Verify against the live Discord API:

```bash
node deploy/scripts/tests/check-live-registration.js   # code vs. what Discord actually has
node deploy/scripts/tests/test-live-runtime.js          # full live audit: gateway login, perms, DB, Redis, AI
```

Other live runtime checks (need real credentials in `.env`):

```bash
node deploy/scripts/tests/test-ai.js        # live Gemini moderation / chat round-trip
node deploy/scripts/tests/test-db-models.js # live DB schema vs. models
node deploy/scripts/tests/test-db-types.js  # live DB column type / PK drift
```

---

## 5. Verification gate

Run all four. The first is offline; the rest need live credentials.

```bash
npm run test:smoke      # offline: lint:syntax + audit:commands + test:commands
npm run test:db         # live DB model/schema integrity
npm run test:db:types   # live DB column type / primary-key drift
npm run test:live       # live runtime audit (gateway login, bot permissions, DB, Redis, AI)
```

Then start the stack and confirm all three services come up:

```bash
npm run dev             # bot + dashboard + AI worker
npm run dev:bot         # bot + AI worker only (no dashboard)
npm run start:all       # same set, production-style local run
```

Without the worker, `aura:ai:jobs` fills up and no moderation action is ever
applied — the bot publishes to `aura:moderation:actions` only when the worker
answers (`packages/redis/src/queue.js`, `apps/ai-worker/src/index.js`).

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Command missing in Discord | Command was never registered, or the global registration has not propagated yet | `npm run deploy -- --guild <GUILD_ID>` (instant) or wait up to 1 h for the global deploy; re-check with `node deploy/scripts/tests/check-live-registration.js` |
| `column ... does not exist` | The live database is older than the models | Run `npm run test:db` and `npm run test:db:types` to see the drift, then apply the pending migrations (`npm run db:migrate`, `npm run db:generate`) |
| No AI moderation happens | The AI worker is not running, or the queue is not being drained | `npm run dev` now starts the worker as a third process — confirm it boots and connects to Redis; also check `AI_ENABLED` and `GEMINI_API_KEY` in `.env` |
| Bot does not answer in DMs | The command is server-only (`guildOnly: true`) | Run the command inside a server; most economy, poll, giveaway and moderation commands are guild-only by design |
| Cooldown behaves oddly | Cooldowns are stored in Redis under `cooldown:<userId>:<commandName>` and are skipped entirely when Redis is unreachable (fail-open) | Check Redis connectivity. The single live slash-command path (`apps/bot/src/handlers/interactionHandler.js`) converts the millisecond `cooldown` value from the command file to whole seconds before storing it; there is no second cooldown path any more |
| Moderation alert is posted but nothing is deleted | The bot lacks Manage Messages in that channel, or the message is no longer fetchable | Grant Manage Messages in the channel, or check the bot's channel overwrites |

---

## Known dangerous helpers

These scripts change live state and are **not** part of `npm run test:smoke`.
Read them before running them — a typo can wipe the bot's command registrations.

| Script | What it does | Warning |
|---|---|---|
| `deploy/scripts/deployment/force-refresh-global-commands.js` | Clears the guild-scoped command overrides of every joined guild **and** the global command list, then re-registers the commands from the loader. | Guarded: it only prints the plan and changes nothing unless `--force` (or `--yes`) is passed. The command count is derived from the loader, never hardcoded — do not "fix" it back to a constant. |
| `deploy/scripts/deployment/cleanup-command-scopes.js` | Wipes the guild-level command overrides of every joined guild and re-registers a single global copy. | Destructive and **unguarded** — it wipes guild overrides on every run. Prefer `npm run deploy -- --all-guilds`. |
| `deploy/scripts/deployment/migrate.js` | Runs `sync({ alter: true })` against the database. | Refuses to run when `NODE_ENV=production` (it can silently drop columns that are not yet declared in the models). Apply reviewed SQL in production instead. |

`deploy/scripts/deployment/deploy-active-guilds.js` is a safe thin wrapper around
`deploy/scripts/deployment/deploy-commands.js --all-guilds` — it does not wipe
anything.

---

## Related

- `docs/testing/MANUAL_TEST_CHECKLIST.md` — hands-on slash-command walkthrough
- `docs/MIGRATION.md` — monorepo layout and first-run steps
- `docs/DEPLOY_NOW.md` — Koyeb / Render deployment
