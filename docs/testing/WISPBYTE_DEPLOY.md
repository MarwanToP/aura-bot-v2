# Wispbyte Deployment & Update Runbook

**Host:** Wispbyte (Pterodactyl-based game/Discord-bot hosting) — <https://wispbyte.com/client>
**Applies to:** `aura-bot-v2` (npm workspaces monorepo, `main`, `https://github.com/MarwanToP/aura-bot-v2.git`)

Every repo-side claim below was verified against the source in this working tree.
Claims about the Wispbyte panel itself come from the operator's report and could not
be independently verified — they are flagged as such.

---

## 1. What Wispbyte is / is not

**Is:** a Pterodactyl panel hosting game servers and Discord bots — a **server**
(container) with a web **Console**, **Files** manager, **Startup** settings and a
**GitHub** integration page. Cheap: free tier is **512 MB RAM, 1 GB disk, ~15–35 % CPU,
one free server per account**, and the server is **archived if you do not log into the
panel for ~2–4 weeks**.

**Is NOT** a VPS (no root, SSH, terminal, systemd, cron), **not a generic PaaS**
(**no public API** — `/api/client`, `/api/application`, `/client/api/servers/*/power`
all 404; staff confirm "we don't have API"; no build pipeline, no push-triggered
auto-deploy, no health-check-driven restart), and **not a container platform** (**no
Dockerfile / docker-compose support** — the repo's root `Dockerfile` (`node:20-alpine`)
and `docker-compose.yml` are **inert here**; do not "fix" them for this host). The
Node image is **glibc** (`parkervcp/yolks`), not alpine, so Alpine paths and `apk`
fixes do not apply.

### The 60-second summary of the deploy loop

> Change code locally → `git push` → **Wispbyte: GitHub page → Pull** →
> **Console → Restart** → watch the log for `AURA BOT IS NOW ONLINE!`.
>
> The default startup script runs `git pull` **only when `AUTO_UPDATE=1`**, so
> `AUTO_UPDATE=1` + **Restart** *is* the deploy. A green "changes pulled" message
> does **not** prove the files changed — see §5.

Default Node startup script on Wispbyte (verbatim):

```bash
if [[ -d .git ]] && [[ ${AUTO_UPDATE} == "1" ]]; then git pull; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/node /home/container/${JS_FILE}
```

`JS_FILE` selects the entry file (default `index.js`); it can also be set by
right-clicking a file in **Files → "Use on startup"**.

---

## 2. Topology decision

**Hard constraints:** (1) **One Discord bot per server** — a second gateway client on
the same server is a second bot, and enforcement **stops the server**.
`apps/bot/src/index.js` is the *only* file here that opens a Discord gateway; the
dashboard and the AI worker open none. (2) **512 MB RAM / 1 GB disk**, and **one free
server per account**.

### Recommended: 2 servers

| Server | Runs | Notes |
|---|---|---|
| **A — bot** | `apps/bot/src/index.js` only | The only gateway connection on the account. Keep it alone: it is the process that can get the server stopped. |
| **B — dashboard** | `apps/dashboard/src/server.js` (+ worker if not embedded) | No Discord gateway. Frees the bot server from Next.js/React memory and build pressure. |

The AI worker (`apps/ai-worker/src/index.js`) does **not** open a Discord gateway — it
talks only to Redis (`aura:ai:jobs`) and the Gemini API, and publishes results to the
`aura:moderation:actions` channel the bot subscribes to
(`apps/bot/src/handlers/actionSubscriber.js`). It may share a server with anything.

**Free-tier caveat:** the free plan allows **one** free server per account, so the
2-server split needs a paid second server. With only one free server, use the
alternative below.

### Alternative: 1 server (bot + dashboard + worker)

Legal — one gateway process. Tight on RAM and disk, and the only option on a free
plan. Use the **embedded worker** (default) so you run two Node processes, not three.

### Embedded vs. standalone worker

`apps/bot/src/index.js` starts the AI moderation worker **inside the bot process** by
default (`startEmbeddedWorker`, `apps/ai-worker/src/embedded.js`); set
`AI_WORKER_STANDALONE=true` to disable it when running the worker as its own process.
Embedded is recommended on Wispbyte: two processes instead of three, less RAM, one
fewer thing to keep alive. Standalone is only worth it if you want the worker
restartable independently — it does **not** reduce the number of Discord gateway
connections. Running **both** still drains the queue correctly (`BLPOP` is
destructive, so each job goes to exactly one consumer) but costs RAM for a second
consumer.

---

## 3. Exact Wispbyte setup steps

### 3.1 Create the server

1. Client → **Create Server** → the **Node** egg/Node image.
2. **Startup** tab → set **Node version to 20 or 22**. Some images default to Node 19;
   `package.json` declares `engines.node >= 18.0.0` but the tree is only tested on
   20/22.
3. Note the **primary port** the panel allocates (Console → *Server info* → *Address*).
   **Wispbyte does not inject `PORT`** — set it yourself and bind the dashboard to it.

### 3.2 GitHub page → Clone

1. Server → **GitHub** page (or *Settings → GitHub Integration*, depending on panel
   version). **Repository URL:** `https://github.com/MarwanToP/aura-bot-v2.git` ·
   **Branch:** `main`
2. **Personal Access Token:** only needed for a private repo — a PAT with `repo` (read)
   scope, pasted into the integration page and stored by the panel.
3. Click **Clone** (initial `git clone` into the server root, `/home/container`).
4. **Verify:** open **Files** and confirm `package.json`, `apps/`, `packages/`,
   `deploy/`, `package-lock.json` are at the server root. A half-populated tree means
   the clone failed.

### 3.3 Startup settings

**Startup → Server Configuration** (environment variables). Required on every server: `NODE_ENV=production`, `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DATABASE_URL`, `REDIS_URL`, `GEMINI_API_KEY`, `AI_ENABLED=true`, `AUTO_UPDATE=1`. Dashboard server additionally: `PORT` (the panel's allocated port), `JWT_SECRET` (≥ 32 random chars), `DASHBOARD_URL`, `DOMAIN`, `CORS_ORIGINS` (comma-separated origins), `DISCORD_REDIRECT_URI` (`<public URL>/api/auth/callback`), `DISCORD_CLIENT_SECRET`. Optional / conditional: `AI_PROVIDER` + `AI_CHAT_MODEL` (default `gemini` / `gemini-1.5-flash`), and `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_KEY` + `CLOUDFLARE_API_TOKEN` only when `AI_PROVIDER=cloudflare`.

`packages/config/src/env.js` **exits the process** in production when `DISCORD_TOKEN` is missing/placeholder, when a default secret is detected, or when the Zod schema fails. Those are hard boot failures visible in the Console log.

`.env` alternative: the repo loads `.env` from the process cwd and from the repo root (`packages/config/src/env.js` → `resolve(__dirname, '../../../.env')`), so a `.env` uploaded to the **server root** works. But `.env` is gitignored, so it is **not** part of the clone and must be uploaded separately via **Files**. `dotenv` never overrides a real environment variable, so panel env vars win over the file.

**Startup → Startup Command / JS File:** set **JS File** = `apps/bot/src/index.js` for a bot server; for the dashboard server use a custom **Startup Command** (§4). Keep **`AUTO_UPDATE=1`** if you use the default startup command.

### 3.4 Start and verify

1. **Console → Start** (first run — not Restart).
2. Watch the Console log for `✅ AURA BOT IS NOW ONLINE!` and `🤖 Logged in as: <bot#tag>`, `[Health] Commands loaded: N`, and `🧠 [AI Worker] Embedded AI moderation worker started (queue: aura:ai:jobs).` (embedded mode only).
3. The bot sets a custom status: **`over Aura Servers | /help`** (`apps/bot/src/index.js`, `clientReady`).
4. In Discord run `/help` — the overview prints the live `client.commands.size` — and `/doctor` for the full report (Bot / Uptime / Guild Members / **Build** / Database / Redis / AI / Commands / Permissions / Intents).

---

## 4. Startup commands per topology

Copy-paste into **Startup → Startup Command**. All assume cwd is the server root
(`/home/container`).

> **Why `;` and not `&&` before a `&`:** in bash, `a && b & c & wait` backgrounds the
> whole `a && b` list and runs `c` in the *current* directory. `;` keeps each
> backgrounded command independent. `wait` must be last or the container exits and
> Pterodactyl restarts it in a loop.

### 4.1 Bot only (server A) — recommended

With the **default** startup script, set only `JS_FILE=apps/bot/src/index.js` and
`AUTO_UPDATE=1`. No custom command needed. Explicit equivalent if you want to own the
whole command:

```bash
cd /home/container; [ -d .git ] && [ "$AUTO_UPDATE" = "1" ] && git pull
/usr/local/bin/npm install; /usr/local/bin/node apps/bot/src/index.js
```

### 4.2 Dashboard only (server B)

```bash
cd /home/container; [ -d .git ] && [ "$AUTO_UPDATE" = "1" ] && git pull
/usr/local/bin/npm install; /usr/local/bin/node apps/dashboard/src/server.js
```

### 4.3 Dashboard + standalone AI worker (server B, worker not embedded)

```bash
cd /home/container; [ -d .git ] && [ "$AUTO_UPDATE" = "1" ] && git pull
/usr/local/bin/npm install; /usr/local/bin/node apps/ai-worker/src/index.js & /usr/local/bin/node apps/dashboard/src/server.js & wait
```

Set `AI_WORKER_STANDALONE=true` **on the bot server** so the bot does not also run the
embedded consumer.

### 4.4 One server: bot + dashboard + worker (embedded worker)

```bash
cd /home/container; [ -d .git ] && [ "$AUTO_UPDATE" = "1" ] && git pull
/usr/local/bin/npm install; /usr/local/bin/node apps/dashboard/src/server.js & /usr/local/bin/node apps/bot/src/index.js & wait
```

Only **one** Discord gateway connection here (the bot). The AI worker runs embedded
inside the bot process — do **not** set `AI_WORKER_STANDALONE=true` in this topology.

### 4.5 `npm install` and install scripts

- The startup script runs **`npm install`**, not `npm ci`. `package-lock.json` *is*
  committed so `npm ci` is available and more deterministic — but it deletes
  `node_modules` first, needing roughly **2× the dependency size** in free disk at
  once. On 1 GB prefer incremental `npm install`; use `npm ci` only with headroom.
- On some images **npm install scripts are blocked** (no `node-gyp`). The packages with
  install scripts here are `prisma` (preinstall), `@prisma/client` (postinstall →
  `prisma generate`) and `esbuild` (install). `prisma` / `@prisma/client` are only
  needed for `npm run db:migrate` / `db:generate`; the runtime DB layer is **Sequelize**
  (`packages/database/models.js`) and `packages/database/src/client.js` imports
  `@prisma/client` lazily with a warning fallback — the bot boots without a generated
  Prisma client. `@napi-rs/canvas` ships **prebuilt binaries** via
  `optionalDependencies` (e.g. `@napi-rs/canvas-linux-x64-gnu`) with no install
  script, so it works on glibc Linux without a compiler. A "compiled against a
  different Node version" load error is a missing prebuilt binary, not an
  install-script problem.

---

## 5. How to update to a new version

**Happy path:** (1) locally `git add` / `git commit` / `git push origin main`;
(2) Wispbyte → server → **GitHub** page → **Pull**; (3) **Console → Restart** (with
`AUTO_UPDATE=1` the startup script pulls itself — pulling manually first makes the log
easier to read); (4) watch the Console for `AURA BOT IS NOW ONLINE!` and a new
`[Health] Commands loaded: N`.

### The stale-build problem (read before trusting a green pull)

**Symptom:** "Git pull not pulling latest changes… it just says changes pulled when
they are not being pulled at all." A green success message **does not** mean the files
on disk changed.

**Verification procedure (mandatory after any pull that should have changed code):**
(1) **Files** → open the changed file → check the actual content, do not trust the
pull message. (2) If the content is the old version: delete the changed file(s) in
**Files**, re-upload the correct file(s) manually, then **Console → Stop** and **Start**
(Stop → Start is more reliable than Restart for a half-applied pull). (3) Confirm
which build is actually live (table below).

| Signal | Where | What it proves |
|---|---|---|
| `/doctor` → **🔧 Build** | Discord, ephemeral reply | `v<version> · <commit> (main) · built <timestamp>` — the **short commit SHA** of the checkout on the server (`packages/utils/buildInfo.js` → `git rev-parse --short HEAD`). The authoritative "is my commit live?" check. |
| Bot status | Profile / member list | `over Aura Servers \| /help` — confirms the bot is connected, **not** which build. |
| `/help` | Discord | The overview prints the **live** `client.commands.size`. A changed count means a changed build. |
| Boot log | Console | `[Health] Commands loaded: N` and `✅ AURA BOT IS NOW ONLINE!`. |

---

## 6. Re-deploying slash commands after a code change

**Slash commands are NOT deployed by the hosting platform.** Wispbyte has no CLI and
no API, so registration must run from a machine that has the token. With a populated
`.env` on that machine:

```bash
npm run deploy -- --all-guilds      # instant per-guild + global
npm run deploy -- --guild <GUILD_ID> # instant for one guild only
npm run deploy                        # global only
```

- `--guild <ID>` → **instant**, guild-scoped. The fast path for a fix you need live.
- `--all-guilds` → instant in every guild the bot has joined **and** global.
- Global-only registration **propagates for up to 1 hour**; new global commands are
  not visible in a guild immediately. `npm run deploy -- --dry-run` lists the commands
  without touching Discord.

**A code change also requires a bot restart** on Wispbyte — a restart re-reads the
command files but does **not** re-register them with Discord. Registration is the
separate step above. Verify registration against the live Discord API:

```bash
node deploy/scripts/tests/check-live-registration.js   # code vs. what Discord has
node deploy/scripts/tests/test-live-runtime.js          # live audit: gateway, perms, DB, Redis, AI
npm run test:db                                         # DB schema vs. models
npm run test:db:types                                   # DB column type / PK drift
```

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Panel says "changes pulled" but the code is old | Stale build — the pull reported success without changing the files | Verify in **Files** → delete + re-upload the changed files → **Stop → Start** → re-check the `/doctor` **🔧 Build** SHA (§5) |
| `EACCES: permission denied, mkdir '/home/container/node_modules'` | The container user (uid 999) does not own a root-created `node_modules` / `.npm` | **Startup → Reset to Default → Save**; in **Files** delete `node_modules` and `.npm`; start again; create `.local` and `.cache` by hand if npm still complains |
| `ENOSPC: no space left on device` (panel still shows space) | Disk quota exhausted — the panel figure and the enforced quota disagree | Delete `node_modules` and re-install; remove old `logs/` archives (winston rotates to `logs/aura-*.log` + zips, `maxFiles: 14d`/`30d`); move the dashboard to server B; see §8 |
| Bot shows "online" in the panel but does nothing | Crash loop — Pterodactyl auto-restarts the process, so the server looks up | Read the **Logs** page, not just Console. Usual causes: placeholder secrets (the process exits in production by design), wrong `DISCORD_TOKEN`, DB/Redis unreachable |
| `client.login()` hangs, never reaches `AURA BOT IS NOW ONLINE!` | Free nodes share an outbound IP and Discord rate-limits it (429 on identify) | Wait for the limit to expire, retry later, reduce other traffic from the same IP; a paid/unique IP removes this class of failure |
| `application did not respond` (Discord) | Gateway handshake timed out — same shared-IP rate limiting, or the host is CPU-starved (15–35 % CPU) | Retry; check the Logs page for a 429; move to a host with more CPU |
| `column "..." does not exist` | The live PostgreSQL schema is older than the models | Run `npm run test:db` **and** `npm run test:db:types` locally against the same `DATABASE_URL` to see the drift, then apply reviewed SQL (see `docs/testing/DEPLOYMENT_CHECKLIST.md`); `npm run db:migrate` refuses to run with `NODE_ENV=production` |
| AI moderation is silent (no action ever applied) | The `aura:ai:jobs` queue is not being drained | Check the boot log for `🧠 [AI Worker] Embedded AI moderation worker started`. If `AI_WORKER_STANDALONE=true`, a standalone worker **must** be running. Also check `AI_ENABLED` and `GEMINI_API_KEY` |
| Dashboard not reachable at the panel address | Wrong `PORT`, or `PORT` ignored | The dashboard honours `PORT` **only when `NODE_ENV=production`** — otherwise it hard-codes 3001 (`apps/dashboard/src/server.js`). Set `NODE_ENV=production` and `PORT=<panel port>`. `httpServer.listen(PORT)` binds all interfaces, so no host change is needed |
| Dashboard UI blank but the API works | The Next.js production build is missing: `.next/` is gitignored, so a fresh clone has no build | Run `npm run build -w apps/dashboard` on the server (or build elsewhere and upload `apps/dashboard/.next/`). Without it `nextApp.prepare()` throws, the log shows `⚠️ Next.js prepare fallback`, and only the API routes work |
| The server was **stopped** by the panel | A second Discord gateway client on the same server (one-bot-per-server rule) | Ensure only one process runs `apps/bot/src/index.js` on the account. The dashboard and the AI worker open **no** gateway and are safe to co-host |

---

## 8. Capacity notes (free tier: 512 MB RAM, 1 GB disk, ~15–35 % CPU)

Measured on the development machine (Windows, `node_modules` present):

| Item | Size |
|---|---|
| Tracked working tree | ~16 MB (414 files) |
| `.git` pack | ~103 MB |
| **Full `node_modules` (incl. dev deps)** | **~1.2 GB** |
| Production dependency closure (358 packages, no dev deps) | ~560 MB |
| Largest entries | `next` ~135 MB, `@prisma` ~81 MB, `@napi-rs` ~37 MB, `prisma` ~29 MB, `@discordjs` ~22 MB |

Linux numbers differ (platform-specific optional deps resolve per OS) but the order of
magnitude holds. **The 1 GB disk does not comfortably fit this repo:** a clone (~120 MB
of `.git` plus source) plus a full `npm install` (including dev deps) exceeds 1 GB.
The free tier is therefore realistically **bot-only** (`apps/bot` + `packages/*`, no
dashboard, no `next` build) — the bot's production closure alone is already several
hundred MB. `npm install` (not `npm ci`) at every start keeps the disk from doubling;
the dashboard's `next build` output adds further hundreds of MB and needs real CPU (the
15–35 % CPU quota is not enough for a Next.js production build); `logs/` grows over
time (winston daily rotation, 20 MB per file, 14/30 days retained, zipped) so delete
old archives periodically; and you must **log into the panel every ~2–4 weeks** or the
server is archived.

**The repo's `Dockerfile` and `docker-compose.yml` are ignored by Wispbyte.** They
remain valid for Docker-capable targets (Render, Fly.io, Railway, Dokploy, a VPS) —
they are simply never executed here. "The Dockerfile looks right" is not evidence that
the Wispbyte deployment is correct.

**Recommendation:** if the bot, the dashboard, and a standalone worker must all run
with headroom, move to a container PaaS or a VPS (Fly.io, Railway, Render, Dokploy, or
a plain VPS using the existing `Dockerfile` + `docker-compose.yml`). Wispbyte's free
tier suits **one bot process**; it is a poor fit for a three-service stack with a
Next.js build.

---

## 9. What I need from you

These can only be answered in the Wispbyte panel — I have no API, no SSH, and no
account access. Please answer each, ideally with a screenshot of the tab.

1. **Current plan** — free or paid? If free, is a **second server** even possible (the free tier allows one server per account)?
2. **Server name(s)**, and whether bot and dashboard go on the same server or split.
3. **Is the GitHub integration already configured**, and is the PAT still valid? A revoked or expired PAT makes **Pull** fail in exactly the stale-build way of §5.
4. **The panel's primary port** for the dashboard server (Console → *Server info* → *Address*). Wispbyte does not inject `PORT`, and the dashboard only honours it when `NODE_ENV=production`.
5. **Current Node version** on the Startup tab — 20/22, or the default 19?
6. **Is the 1 GB disk sufficient** after `npm install` on your server? Report the real free space in **Files** after the first successful install.
7. **Is a second (paid) server acceptable?** If not, is the **1-server topology** (§2, §4.4) acceptable with the dashboard on the same box as the bot?
8. **Is moving off Wispbyte acceptable?** If "no", we build for this host. If "yes", we will pick a target that supports the existing `Dockerfile`/`docker-compose.yml` and push-triggered deploys.
9. **Who owns the one-bot-per-server risk?** If a second bot already exists on the account, it must be stopped before this bot is deployed, or the platform will stop the server.

---

## Related

- `docs/testing/DEPLOYMENT_CHECKLIST.md` — full pre-deploy checklist (intents, permissions, verification gate)
- `docs/testing/MANUAL_TEST_CHECKLIST.md` — hands-on slash-command walkthrough
- `docs/DEPLOY_NOW.md`, `docs/RENDER_DEPLOYMENT.md` — container-based deployment (Koyeb / Render)
- `docs/MIGRATION.md` — monorepo layout and first-run steps
