# Aura Bot Website — Completion Checklist

Single source of truth for finishing the Aura Bot **website** (public landing page + dashboard).
This is the Discord bot site, not the photography portfolio. Update this file instead of
creating new checklists. `docs/PROJECT.md` is a stale milestone plan (it references
`shared/` and `dashboard/app/api`, which do not exist) and is not maintained here.

**Statuses:** Not started · In progress · Blocked · Verified
(Verified = implemented and the listed test method passed. Anything not run stays unverified.)

_Last updated: 2026-10-21 (run 1)_

---

## Current state

- Landing page and dashboard are now separate routes: `/` and `/dashboard`.
- Dashboard UI has about 30 panel components. Most were **not yet audited** in depth (see "Audit coverage").
- Highest-priority remaining issue: **W-02** — the Control Panel shows invented data and fake success toasts.

## Tasks

| ID | Priority | Area / files | Expected result | Test method | Status |
|----|----------|--------------|-----------------|-------------|--------|
| W-01 | P2 core pages/nav | `app/page.js`, `app/dashboard/page.js`, `app/dashboard/layout.js`, `components/LandingPage.jsx`, `api/auth.js`, `context/AuthContext.jsx` | `/` serves only the landing page; `/dashboard` serves only the dashboard (noindex); landing CTAs go to `/dashboard`; dashboard logo goes to `/`; login lands on `/dashboard`; logout lands on `/` | Production build lists both routes; `next start` + HTTP checks (see log) | **Verified:** route separation, server-rendered output, page metadata. **Not verified:** landing CTA, dashboard logo and logout clicks, and the post-login redirect (no browser; OAuth needs credentials — see W-09, W-12) |
| W-02 | P3 non-functional controls | `components/ControlPanel.jsx`, routed from `app/dashboard/page.js` for tabs `automation`, `notifications`, `polls`, `control-logs` | No fabricated data. Replace hard-coded logs ("Aurora", "Kai", "Crystal Realm"), the "LIVE"/"All systems monitored" labels and the four buttons that toast fake success with an honest not-connected state, or wire real data | Open each of the four tabs signed in with a real guild; confirm nothing invented is shown | Not started |
| W-03 | P2 core pages/nav | `components/Sidebar.jsx` (`SECTIONS`), `app/dashboard/page.js` (`TAB_TITLES`, tab switch) | Every module in the agreed scope has a sidebar entry and its own page, or a documented limitation. Today Poll, Notification, Auto Moderation, Anti-Nuke, Server Stats, Role have no sidebar entry or are aliases of another panel; Token and Remove have no equivalent | Click through every sidebar item; compare with the module map below | Not started — needs scope decision for Token and Remove |
| W-04 | P1 build/deploy | root `package.json`, `Dockerfile`, `.github/workflows/*.yml`, `apps/dashboard/package.json` | A documented, working production path for the dashboard: build step exists and runs, build tooling (`tailwindcss`, `postcss`, `autoprefixer`) is available when it runs. Today: no root `build` script, CI never runs `next build`, the Dockerfile uses `npm install --omit=dev` and `npm start` (bot only) | Clean checkout → documented commands → dashboard serves `/` and `/dashboard` | Blocked — needs a decision on where the dashboard runs (WispByte runs `node` on a 512 MB server; Cloudflare is the planned edge) |
| W-05 | P1 build | `app/layout.js` (`next/font/google` Inter + Poppins) | `next build` succeeds without reaching Google Fonts (self-hosted fonts) | `next build` with no network access | Not started |
| W-06 | P5 a11y / links | `components/LandingPage.jsx` | Navigating CTAs are real links, not buttons; footer links `#privacy` and `#terms` and the social `href="#"` icons point to real pages/URLs or are removed | Keyboard-only walkthrough; broken-link check | Not started |
| W-07 | P3 lint | `components/TempLinkSettings.jsx:68`, `eslint.config.js` | No `FormData is not defined` warning (browser globals configured for dashboard code) | `npx eslint .` shows 0 warnings | Not started |
| W-08 | P7 debt | root `package-lock.json` | `npm install` leaves the lockfile unchanged (`concurrently` and the dashboard dev dependencies currently differ from the lockfile) | `npm install` then `git diff --stat package-lock.json` is empty | Not started |
| W-09 | P4 auth/API | `api/auth.js`, `middleware/guildAuth.js`, `api/guilds.js` | Discord login, callback redirect to `/dashboard`, guild list filtered by manage permission, guild-scoped writes rejected for non-admins | Real Discord application credentials, bot token, database | Blocked — credentials not available in this environment |
| W-10 | P6 content | `app/dashboard/page.js`, `components/Sidebar.jsx` (`GUILDS_FALLBACK`), `ServerSettings.jsx` and others | Decide how signed-out visitors see `/dashboard`: sign-in gate, or labelled demo. Today they see invented servers ("Crystal Realm", "12,645 members") across panels, with only a banner saying demo data | Visit `/dashboard` signed out | Not started — needs decision |
| W-11 | P6 design | `globals.css`, `tailwind.config.js` (`glass` tokens), 22 `backdrop-blur`/`backdrop-filter` lines, `public/Neon Crystal Portal in Deep Space.png`, `app/layout.js` description | Reconcile the glassmorphism implementation with the brief (minimal, no excessive glass, no crystal decoration) only where it causes a demonstrable usability, consistency or contrast problem | Visual and contrast review at desktop, tablet, mobile | Not started — needs a browser (W-12) |
| W-12 | P5 responsive / a11y | whole site | Desktop, tablet, mobile layouts, focus states, contrast, console errors and failed requests checked | Headless browser + accessibility audit | Blocked — no browser available in the current environment |

## Module map (agreed scope vs. current implementation)

"Audited" below means the routing was checked. Deeper checks (layout, validation, error and
empty states, backend integration) are **not done** unless stated.

| Requested module | Current panel | Notes |
|------------------|---------------|-------|
| Server Members | `MembersPanel` | Not audited in depth |
| Commands | `CommandSettings` | Backed by `api/commands.js`; not audited in depth |
| Remove | — | No equivalent found; meaning unclear |
| Automation | `ControlPanel` | **Placeholder with fake data** (W-02) |
| Token | — | No module; secrets handling needs a decision |
| Ticket | `TicketsCanvas` | Not audited in depth |
| Reaction / Role | `AutoRolesSettings` | One panel serves both |
| Welcome | `WelcomeSettings` | Not audited in depth |
| Verification | `modules/VerificationModule` | Not audited in depth |
| Giveaway | `GiveawaySettings` | No `/giveaway` slash command found; system code is in `packages/systems/giveaway` |
| Poll | `ControlPanel` | **Placeholder with fake data** (W-02); no poll module |
| Notification | `ControlPanel` | **Placeholder with fake data** (W-02); `SocialAlertsSettings` is separate |
| Moderation | `ModerationPanel` | Not audited in depth |
| Auto Moderation / Anti-Nuke / Security | `SecuritySettings` | One panel serves three tabs; bot has `/antinuke`, `/security` |
| Log | `LogViewer` | Not audited in depth |
| Voice | `TempVoiceSettings` | Not audited in depth |
| Analyze / Server Stats | `StatisticsSettings` | One panel serves both |
| Invite Tracker | `InviteSettings` | Not audited in depth |
| XP and Rewards | `LevelingSettings` | Not audited in depth |
| Leaderboard | `EconomySettings` | Shares a panel with Economy; no dedicated leaderboard page |
| Settings | `ServerSettings` | Not audited in depth |

## Audit coverage

Inspected this run: repo layout, README, CHANGELOG, manifests, Dockerfile, CI workflows,
`app/*`, `Sidebar.jsx` (navigation definition), `ControlPanel.jsx`, `LandingPage.jsx`
(structure, CTAs, links), `api/auth.js`, `api/guilds.js`, `middleware/*`, `server.js`.
**Not yet inspected:** the individual module panels, `api/modules.js` (2,231 lines),
`api/commands.js`, `api/stats.js`, `OverviewCanvas.jsx`, `Header.jsx`.

## Verification log

| Command / check | Result |
|-----------------|--------|
| `npm install` | Passed (546 packages). It rewrote `package-lock.json`; reverted (W-08) |
| `npm run lint:syntax` | Passed — 169 files (after changes) |
| `npm run audit:commands` | Passed — 71 commands, 0 errors, 0 warnings (before changes; bot code untouched) |
| `npm run test:commands` | Passed — 158 paths, 0 failed (before changes; bot code untouched) |
| `npx eslint .` | 0 errors, 1 warning (W-07); same after changes |
| `next build`, plain | **Failed** — Google Fonts unreachable from this sandbox (W-05) |
| `next build` with `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` (test-only font stub) | Passed before and after changes; after: routes `/` (9.5 kB), `/dashboard` (102 kB) |
| `next start` + HTTP | `/` → 200, landing markup only; `/dashboard` → 200, dashboard markup only, `noindex`; unknown path → 404 |
| Browser, responsive, accessibility, OAuth, `test:db`, `test:live` | **Not run** (W-09, W-12) |
