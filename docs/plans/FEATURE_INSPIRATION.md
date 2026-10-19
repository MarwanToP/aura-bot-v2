# Competitor Feature Inspiration — Bot & Dashboard Ideas

> **Date:** 2026-10-16 · **Companion doc:** `FREE_VS_PREMIUM_PLAN.md` (2026-07-16)
> **Purpose:** Mine the 12 target competitor products for (a) bot-side features, (b) dashboard-side UX patterns, and (c) their free-vs-paid splits — then fold the best into Aura's roadmap.
> **Products:** MEE6 · ProBot · Dyno · Wicks · Ticket Tool · Invite Tracker · Security Bot · Appy · NotifyMe · TempVoice · Fizbo · Vetox
> **Status:** v2 — complete (12/12 products researched).

**Legend:** ⭐ = flagged for Aura roadmap (§15). Prices are as published Oct 2026, USD unless noted.

---

## 1. MEE6 — the incumbent all-in-one

**What it is:** Market leader (21M+ servers). Leveling, moderation, notifications. Broad communities + streamers.

**Bot features**
- Moderator: automod rulesets — bad words (per-role/channel allow/deny), repeated text, invites, external links, caps (70% default), mention/emoji spam + classic mod commands.
- Ticketing: panel builder (buttons/dropdowns), up to 10 manager roles, auto-created open/claimed/closed categories, transcripts (premium).
- Social alerts: Twitch, X, YouTube, Reddit, Instagram, RSS, Kick, Bluesky, TikTok, Podcasts — the whole category is premium.
- Levels/XP, Economy (web store up to 300 items), Achievements, Starboard, Birthdays, Giveaways, Polls, Reminders.
- Utilities: Search Anything, Embed Messages, Statistics Channels, Temporary Channels (join-to-create).
- Web3 niche plugins (NFT/crypto/gas trackers) — fun to know, not for Aura.

**Dashboard features**
- Plugin-list sidebar, one config page per plugin with master toggle.
- Leveling: XP-rate slider, level-up announcement routing, role rewards with "stack vs replace" logic + "remove on XP loss", no-XP roles/channels.
- Rank card designer: preset + custom color creator (free), custom backgrounds (premium).
- Embed Messages builder, bot personalizer (name/avatar), leaderboard vanity URL + Join button.
- Billing tab with invoices + **"move premium between servers"** tool.

**Free vs paid**
- Free: Search Anything, Achievements, Starboard, 1 reminder; minimal mod; ticketing without embeds.
- Premium: **≈$11.95–11.99/mo, ≈$89.90/yr**, lifetime SKU exists; **1 subscription = 1 server**; refunds 1 week.
- **Unbundled subscriptions:** MEE6 AI (imagine/write) · MEE6 AI Characters · MEE6 Pro (personal +50% XP, rank card everywhere).

**⭐ Steal for Aura**
- Unbundled monetization: server tools vs AI vs personal perks as separate SKUs (sit naturally on Aura's AI moat).
- Free "wow" modules as acquisition funnel (Starboard, Achievements).
- Premium transfer/move tool + invoices in billing tab.

---

## 2. ProBot — configurable multipurpose, best-in-class analytics

**What it is:** Highly configurable multipurpose (ProBot Inc). Image greetings, detailed logs, anti-raid for mid/large communities.

**Bot features**
- Welcome/Goodbye with image greeting cards (DM or channel), Auto Responder, Embed Messages.
- Level system (text XP), Auto-Roles (incl. **role-for-invite-source**, premium), Logs, Colors, Self-Assignable Roles (buttons/dropdowns, per-user role limits).
- Temporary Channels (join-to-create), **Temp Links** (expiring invites), Starboard, Automod (spam 5/5s, bad words via Discord AutoMod, duplicated/repeated text, invites).
- Anti-Raid (Tier 1/2): account-age thresholds (1wk/1mo/3mo), join-velocity (5–100 users), fill-time window, automated action.
- **VIP Protection** (premium): per-role limits on *staff* actions — ban/kick/channel changes — governor for insiders, not raiders.
- Tickets: button/dropdown panels, duplicate/edit panels, staff claim/close, per-panel config.

**Dashboard features**
- Per-command master switches + alias + allowed/disabled roles & channels + auto-delete behaviors (delete bot reply after 5s, delete invocation, delete reply with message).
- ⭐ **Ticket analytics page:** total/opened/closed, **average staff response time**, tickets-by-panel, 30-day daily chart — best example in the whole set.
- Embed builder with live preview + "edit a sent message" (retroactive edit).
- Premium page: edit premium bot presence/name/avatar/status, unique bot number (T2).
- Only lists servers where the user has Administrator.

**Free vs paid**
- Free: most modules (welcome, logs, levels, SAR, temp channels, automod basics, tickets, embeds).
- Tier 1 **≈$5/mo ($40/yr):** anti-raid Protection, temp links, invite-source auto-role, extra variables.
- Tier 2 **≈$10/mo ($80/yr):** + personalized custom bot, server statistics, Twitch/YouTube notifications, transferable ownership.
- Memberships (personal): Silver/Gold/Diamond — daily credits, reps, profile backgrounds.

**⭐ Steal for Aura**
- Ticket analytics (response time, by-panel, daily chart) — borrow wholesale for Aura's Tickets tab.
- VIP Protection (staff-permission governance) — pairs with Aura's Anti-Nuke module.
- Retroactive embed editing in the builder.
- Per-command toggles + auto-delete UX patterns.

---

## 3. Dyno — moderation powerhouse + Battle Pass

**What it is:** Long-running fully customizable moderation suite + web dashboard. Communities that prize automod rigor. Custom plan for big brands.

**Bot features**
- Moderation: ban/kick/mute/warn/softban/temprole/rolepersist, cases, notes, modlogs, modstats, duration-editing of timed punishments, lock/lockdown, purge, `diagnose`.
- Modules: Automod (custom responses, multiple log channels), Autodelete, Automessage, Autoresponder, Autoroles (with delay), Autoban, Autopunish, Custom Commands, Forms, Ticket Panels (linked panels, max-open-per-user, extra form fields, custom buttons), Giveaways, Reaction Roles, Embedder, Starboard.
- Premium modules: Autopurge, Slowmode, **Voice-Text Linking**, advanced Starboard, unlimited limits.
- Levels + Points (Standard+), Economy (Dyno Coins: daily/work/pay/vote) + **Dyno Battles** (game with decks/dungeons).
- Utility: joinable ranks, Tags, Highlights (keyword pings), AFK, reminders, polls, whois/serverinfo.

**Dashboard features**
- Commands tab: enable/disable via sliders (per command or per category), allowed/ignored roles & channels, Dyno Manager role overrides, **slash-command permission sync** button with hierarchy warnings.
- Premium badges in docs showing the exact plan needed per feature.
- Account → Servers → Premium page to activate/move subscriptions; gift links; nonprofit free premium.
- Public server directory (vote-to-highlight).

**Free vs paid**
- Free limits (transparent): 25 commands · 10 autoresponders · 3 giveaways · 3 forms · 3 reaction menus · 3 autoroles · 1 autodelete/automessage, etc.
- **Standard $49.99/yr (≈$4.17/mo):** tickets, levels, points, advanced automod/starboard, autopurge, slowmode, voice-text linking, unlimited limits.
- **Premium $59.99/yr (≈$5/mo):** adds YouTube/Twitch/Kick/TikTok/Reddit feeds.
- **Custom $99.99/yr (≈$8.33/mo):** fully hosted custom bot (own avatar/name/status).
- **Battle Pass (personal): $29.9–$79.9/yr** — global XP +1–3%, +80–100% coins, stamina, 32–100 profile banners.

**⭐ Steal for Aura**
- **Battle Pass**-style personal subscription (cross-server boosts + cosmetics) — second monetization rail.
- Free-tier limit tables on pricing page ("3 forms / 10 autoresponders…") — honest, upgrade-nudging.
- 9 pre-branded premium bots (Standard) vs bring-your-own-app (Custom) — tiered branding ladder.
- Discord-native billing + gift subscriptions.

---

## 4. Wicks — cheap polish + cheap custom-branded bot

**What it is:** Modern affordable bot (121K+ servers). ProBot-like polish at ~$6/mo incl. custom-branded bot.

**Bot features**
- Tickets: private support channels by category/department, claim/close/delete/add/copy-log/remind, member permissions, **Ticket Working Hours**, embed panel with 16:9 background art (premium), premium text commands.
- Applications: form builder (ordered questions, short/paragraph, required), on-accept DM + role, on-reject DM + role changes, review log channel, submission cooldown; premium = multiple forms with separate reviewer teams.
- Leveling: chat + voice XP, rank cards, `/rank`, top boards (all-time/today/week), `/setxp`, **season resets** (`/reset all`).
- AutoMod: bad words, spam, link filter (allowed-domain list), mention spam, mass caps, invites; per-rule exemption roles/channels; actions: block / alert / timeout.
- Protection: per-role limits on staff Ban/Kick/Role/Channel actions with responses (none/remove roles/kick/ban/warn/notify), trusted-bot IDs, **owner-only lock page**.
- Community: welcome (image cards; DM welcome premium), self-roles, color roles, Rules publishing, logs.
- Automation: Auto Reply (phrase → reply w/ image/embed, channel-scoped), Auto Lines, Auto Reactions, Embed Builder (premium).

**Dashboard features**
- Sidebar grouped by job: General / Moderation & safety / Community modules / Automation / Command reference / Premium.
- **Access levels per server:** Owner-only / Administrator / Manage Server; owner can lock out admins.
- Embed builder with live preview + **saved embeds reusable across modules** (with dependency warnings before delete).
- "Republish panel after redesign" guidance baked into docs; "Invite bot" button shown if the bot isn't in the server.

**Free vs paid**
- Free: basic moderation, single ticket setup, standard welcome, basic logging.
- **Premium $5.99/mo · $14.99/3mo · $24.99/6mo** — custom branded bot (or connect your own app), dedicated hosting, unlimited multi-department tickets, multi-form applications with reviewer teams, DM welcomes, Auto Lines + Auto Reactions, VIP support.
- 1 subscription = 1 server, transferable once per 24h, 14-day refunds.

**⭐ Steal for Aura**
- **Custom-branded bot at ~$6** — validate price sheet vs Aura's Enterprise ($9.99) with white-label.
- Ticket working hours + premium panel art = cheap-to-build premium polish.
- Applications + reviewer teams (couple with hiring/ticketing).
- Dashboard access levels (Owner/Admin/Manage-Server) — simple permissions UX worth copying.

---

## 5. Ticket Tool — the support-desk standard

**What it is:** "#1 Discord support bot" — 4.6M+ servers, 435M+ tickets. Private support channels, dashboard-first, enterprise-scale config depth.

**Bot features**
- Panels as embeds with buttons or emoji reactions; **dropdown-style** panels; **multipanels** (one panel can open others); command-style; **thread-style** tickets (threads instead of channels).
- Per-button permissions (disabled roles, support-staff-only buttons), custom emoji buttons.
- **Questionnaires/forms on open** (modals); fully templated ticket messages with variables.
- Claiming (premium): claim/unclaim, claiming limits.
- Lifecycle: add/remove users & roles, close/reopen, **escalation between panels/teams** (transfer to another department).
- Automations: auto-close/auto-delete inactive tickets; per-user ticket limits (global + per-panel); open/closed categories; overflow categories.
- HTML transcripts auto-sent to a transcript channel — **never stored on Ticket Tool servers** (privacy positioning).
- Logging; DM on create/close (premium); custom reactions (premium); per-panel integrations.

**Dashboard features**
- Per-server "manage servers" config: prefix, global ticket limit, blacklist, dashboard roles, custom bot profile.
- **Panel editor with 16+ sub-pages per panel:** General, Category, Ticket, Moderator, Permission matrix (per-role/user), Button, Messages, Escalate, Transcript, Logging, Automation, Limit, Claiming, Form, Integration, Panel Options.
- Style-specific pages (Dropdown / Thread / Command) + supported-variables reference.
- Send/resend panels from the dashboard; per-panel enable/disable.
- **Dashboard History** — audit log of every config change (trust + rollback).
- Statistics page; billing: transfer subscriptions between servers.

**Free vs paid**
- Free: unlimited panels, transcripts, support roles — but creation is **rate-capped at ~10 tickets/minute** on the public bot instance.
- **Premium $7.99/mo (docs: ≈$8 or $66/yr):** removes the rate cap, access to a faster premium-only bot instance, full message/embed customization (character limits removed), custom reactions, create/close DMs, ticket automation, claiming, premium support. Transferable between servers.

**⭐ Steal for Aura**
- **Rate-limit free tier** (everything visible, upgrade removes friction) — an alternative to hard feature gates for Aura's high-volume modules.
- Config-change audit log ("Dashboard History") — pairs with the template/merge safety UX from Vetox.
- Multipanels + escalation = multi-team support without extra bots.

---

## 6. Invite Tracker — growth analytics + invite rewards

**What it is:** Invite tracking + growth bot (1.5M+ servers) bundling invites, giveaways, verification, raid protection, message counting and tickets in one. Audience: growth/rewards communities, partnerships, creators.

**Bot features**
- Attribution formula: `total = regular − left − fake + bonus`; who-invited-whom; `/inviter`, `/invitedlist`, invite leaderboards.
- Fake-invite detection: tunable **"fake delay"** = account-age threshold (default 3 days, 0–300 configurable on premium); optional don't-count-rejoins.
- **Invite Labels:** tag invite codes (incl. vanity); auto-role on join via that code; `%invite_label%` variable; search joins per label — campaign tracking + routing in one.
- Rewards: invite-based roles (1 free / unlimited premium); message-count roles; add/remove fake invites; `/massban` (premium).
- Verification: button click, DM image captcha, or **website hCaptcha**; timeout 15–1800s with kick/ban/no-action; verified role; logs.
- Raid protection: detection & alerts (free); custom thresholds + automatic response (invite pause, verification gate, join gate), invite-credit freeze, one-click raid cohort ban, `/lockdown` (premium).
- **Honeypot channels** (1 free / 5 premium) with punishment tuning + trigger history.
- Giveaways (concurrent, templates, schedules, bonus entries, winners' roles); tickets with templates, claiming, escalation, **CSAT surveys**; join/leave messages + welcome banner designer; pinned leaderboards.

**Dashboard features**
- Modules: Overview, Administration, Verification, Raid Protection, Honeypot, Invite Tracking (fake delay, blacklists, hidden users, labels), Analytics, Server Reports, Leaderboard, Message Counting, Pin boards, Giveaways, Tickets, Join/Leave + banner builder, Bot Profile, Custom Bot, Account.
- **Analytics:** growth chart, net growth/joins/leaves, **retention**, join-source breakdown (invites vs vanity vs bots vs unknown), top inviters, **CSV export** of raw join/leave events, automatic weekly/monthly reports.
- **Public leaderboard** at a custom vanity link (`invite-tracker.com/leaderboard/<custom>`) showing latest invite + retention per inviter.

**Free vs paid**
- Free: 3 panels/templates, 1 automation, 30-day transcripts; 1 invite label; 3 blacklisted / 3 hidden users; 7/30-day analytics; 5 giveaways; 3 auto roles; 1 honeypot; 3-day raid history.
- **Premium €4.99/mo per server:** 25 panels/templates, 10 automations, unlimited transcripts; auto-close, escalation, opening hours, close-DM, advanced claiming, role actions, branding removal; 100 blacklisted users, role blacklists, configurable fake delay, unlimited labels; unlimited analytics + CSV + weekly reports; public/pinned leaderboards; 50 giveaways + templates/schedules; unlimited auto roles; automatic raid response + `/lockdown` + 5 honeypots; bot avatar/banner/bio.
- **Custom Bot €9.99/mo:** white-label bot, all premium, dedicated resources, faster tracking. 7-day refund.

**⭐ Steal for Aura**
- Public shareable leaderboard (vanity link) — a free growth loop for Aura itself.
- **Retention %** on invite leaderboards — invite quality, not just counts.
- Invite Labels (campaign tags + auto-role routing).
- Honeypots with trigger history; CSV export + scheduled reports for the Analytics tab.

---

## 7. Security Bot — anti-nuke/anti-raid specialist

**What it is:** Dedicated protection bot ("raiders, nukers and any type of damage"), 1M+ protected servers. Set-and-forget security with a dashboard.

**Bot features**
- **Anti-Nuke:** per-action limits (ban, kick, channel create/delete, role create/delete, add bots, give dangerous perms/roles, prune) in a fixed 10-minute window; per-action punishment (ban/kick/clear roles/…); owner + log-channel notifications.
- **Beast Mode:** a global server score; when the configured limit is hit, "the beast wakes up" for up to 60 min and instantly punishes *anyone* performing a dangerous action (strips all roles). Whitelist exemption + dashboard **Calm Down** button.
- **Anti-Raid:** score-based screening of every join — weighted factors (account age, no avatar, join speed/"join row"); triggering locks the server + punishes flagged users; bypass rules (Discord badges, account-created-before, age).
- Anti-Spam (premium): X messages per Y seconds → lock/clear/punish.
- Verification: unverified-role gating; one-click button, image CAPTCHA, or **web CAPTCHA verified on securitybot.gg** (customizable colors/length/difficulty); timeout actions; manual verify.
- **Whitelist:** users/roles/channels × action categories (ban-only, kick-only, bot-add, dangerous perms…).
- Moderation shortcuts (`/mute`, `/ban` without granting Discord perms); anti-nuke limits also constrain moderators. Rich logging (premium retention).

**Dashboard features**
- Category nav (Anti-Nuke, Beast Mode, Anti-Raid, Whitelist, Verification, Premium) with numeric tuning editors: per-action limit counters, per-factor raid scores, score limits, punishment dropdowns, bypass toggles.
- **Live Beast Mode status indicator** + Calm Down control.
- Whitelist management UI mirroring the commands (users/roles/channels × categories).
- End-user verification page (login → select server → solve CAPTCHA).
- Premium + Custom Bots management (instances, name/avatar/status).

**Free vs paid**
- Free: core anti-nuke, anti-raid basics, Beast Mode, verification (button/captcha/web), moderation tools, whitelist, logs.
- **Premium $3.49/mo per server:** anti-mention abuse, anti-vanity change, anti server rename/icon, anti role/channel rename, anti emoji delete/rename, anti invite delete, **anti-ghost-ping**, advanced anti-raid config, customizable verification, anti-spam; auto server recovery; 24/7 uptime guarantee.
- **Premium+ $11.99/mo:** custom bot name/avatar/status, white-label (no branding), multiple instances, higher rate limits, priority support. Patreon billing; 14-day refund.

**⭐ Steal for Aura**
- **Beast Mode** — a dramatic "server under attack" state with a dashboard widget + one-click stand-down. Perfect fit for Aura's Security/Anti-Nuke tabs.
- Score-based anti-raid with per-factor weights + bypass rules (legible tuning UI).
- Action-category whitelists (whitelist someone for bans only, not everything).
- The premium protection list itself (ghost-ping, vanity change, invite delete…) = a ready-made premium checklist.

---

## 8. Appy — applications/forms specialist

**What it is:** Free-to-use applications bot — forms, applications, tickets, giveaways, verification. 936K servers, 30.9M applicants. Staff recruitment, whitelists, clans.

**Bot features**
- **Modal-based forms:** text (open) + multiple-choice questions; apply via panels or `/apply`; submissions posted to a logging channel as embeds with **Accept/Deny buttons**; applicants DMed. No channel-per-applicant — scales to high-volume intakes.
- **Full role matrix per form:** accepted/denied roles, accepted/denied removal, required/restricted roles, ping roles.
- **Staff Threads** on each submission for staff discussion; application logging.
- Premium: submission history, cooldowns + time limits, **regex question validation**, up to 20 manager roles, custom completion/confirmation messages.
- Panels: multiple forms per panel or single; buttons or dropdown (premium); footer/image/color (premium).
- Also: polls (real-time, 9 options), tickets (panels/templates/transcripts/team roles/action-on-leave), giveaways, verification (website captcha free; button + in-Discord image captcha premium). Custom bot identity on the Custom plan.

**Dashboard features**
- Three-pane editors: sidebar / list of forms-or-panels / options pane.
- Form manager: create/edit/delete, **enable/disable to temporarily close** without deleting, question builder, role-action selectors, save.
- Panels editor: name, description, target channel, attach forms, send panel.
- Premium fields gated with **crown icons** inline (subtle upsell UX); premium tab per server (add/disable/transfer).
- Comparison-style pricing table listing all Free/Premium/Custom limits in one view.

**Free vs paid**
- Free: unlimited submissions; 2 forms; 10 questions/form; 1 application panel; 1 ticket panel; 2 ticket templates; 1 role action per type; 1 blocked/required role; 1 support role; 2 auto roles; 1 verified role; giveaways; website captcha; logging.
- Premium (tiers ×1/×3 servers): 200 forms, 100 questions, 50 panels, 20 role actions per type, 100 blocked/required roles, 20 manager roles, in-Discord verification, regex validation, cooldowns, submission history, full embeds. **Price not public** (rendered client-side).
- Custom Bot plan: full identity + premium. 24h refund; per-server activation (transferable).

**⭐ Steal for Aura**
- Channel-free modal application flow (one tidy embed per applicant + Accept/Deny).
- Staff Threads per application — keeps the review channel clean.
- Full role matrix as a first-class editor.
- Manager roles + cooldowns + regex = complete review governance.
- Crown icons on premium-only fields — inline upsell without nagging.

---

## 9. NotifyMe — social alerts done right

**What it is:** Social/live notification bot (388K+ servers). YouTube, TikTok, Twitter, Twitch, Kick alerts into Discord. Creator & gaming communities.

**Bot features**
- Go-live + new-upload alerts for 5 platforms; per-account channel, custom text, custom embed, role mention.
- **Message tags:** `{account}`, `{profile_pic}`, `{link}`, `{playable_link}`, `{ping_role}`, `{platform_icon}`, `{title}`, `{game}`, `{viewers}`.
- Custom bot name/avatar per server + "remove branding" (premium).
- Test-notification flow; permission diagnostics (greyed-out channels).
- Advertised delivery latency as a feature: Kick ~20s, X ~30s, YT/Twitch ~1m, TikTok ~2m (Advanced ~30s).
- Management API + dashboard permissions (premium).

**Dashboard features**
- Add-Account flow: platform dropdown → creator URL → channel (inline permission hints). Fully visual, no commands.
- **Customize Notifications:** embed popup with live Discord preview; **reusable embed presets assigned per account** — editing a preset updates every account using it.
- Per-field ⓘ tooltips showing which tags are valid there.
- Premium **server slots manager** — subscription = N movable server slots (gear menu per server).

**Free vs paid**
- Free: 40 accounts total (YouTube 10, TikTok 5, X 5, Twitch 10, Kick 10), no customization.
- Basic **$3.99/mo ($47.88/yr):** 2 servers, 150 accts/platform, custom embeds/bot, remove branding, API.
- Plus **$7.99/mo ($95.88/yr):** 4 servers, 800 accts/platform.
- Advanced **$15.99/mo ($191.88/yr):** 10 servers, unlimited, fast TikTok.
- (Docs show older $4.99/$9.99/$19.99 — verify at checkout.)

**⭐ Steal for Aura**
- Reusable embed presets + per-field tag tooltips — Aura's Notifications tab should work exactly like this.
- Premium as **server slots** (moveable) instead of a hard per-server sub.
- Latency transparency as marketing ("Aura alerts land in ~20s").

---

## 10. TempVoice — join-to-create, premium = cosmetics + moderation

**What it is:** The temp-voice specialist (Astro/VoiceMaster alternative). Channels spawn on join, die when empty.

**Bot features**
- Join creator → temp channel; owner suite `/voice`: name, limit, bitrate, region, privacy (lock/unlock/password), status, reset, delete, claim, transfer, invite/LFP, waiting room, thread creation.
- `/voice user`: trust/untrust/block/unblock/kick/invite (25 trusted + 25 blocked per channel).
- Interface Message: button control panel; in-voice chat interface.
- **Naming placeholders:** `{OWNER_*}`, `{NUMBER}` + {ROMAN/ALPHA/DIGIT}, `{ROLE_HIGHEST}`, `{RANDOM}`…; premium adds **`{ACTIVITY_*}`** (room name shows the game being played).
- Temp voice role, greeting messages, vote-kick %, censor names, age-restrict chat, moderation logging (premium).

**Dashboard features**
- Per-creator-channel editor: placeholder builder for names, user limit, category + **fallback categories** (when full), bitrate, position.
- Permissions page: access roles, permission sync, privacy mode, owner presets.
- Moderation page: toggles, mod-log channel, censor, age restriction, vote-kick %.
- Multi-language via Crowdin.

**Free vs paid**
- Free: 2 Creator Channels; unlimited temp rooms (core never paywalled); some commands vote-locked (top.gg).
- **Premium €4/mo:** custom interfaces, moderation logging, no vote locks, unlimited creators (1 server).
- **Your Own Branding €6/mo:** own hosted instance, custom name/icon/banner, activity placeholders.
- Platform limits: 500 channels/server, 50/category, 2,000 creates/day, 5-min rename cooldown.

**⭐ Steal for Aura**
- **White-label as a subscription tier** ("Your Own Branding") — supports Aura's Enterprise white-label plan.
- Activity-aware channel names (`{ACTIVITY_NAME}`) — delightful, cheap.
- Fallback categories + waiting rooms for capacity UX.
- Free keeps the core unlimited; paywall cosmetics/moderation — matches Aura's philosophy.

---

## 11. Fizbo — a games platform (not multipurpose anymore)

**What it is:** 20+ multiplayer in-chat games ("every night is game night"). Social engagement platform. (Note: the old multipurpose positioning from July notes is gone.)

**Bot features**
- 13 server games (Mafia, Roulette, Hide & Seek, Chairs, Death Wheel, Guess The Country/Draw/Word…) + 12 mini games (Fast Type, Find the Emoji…).
- `/play` in linked channels; join/leave buttons; per-channel enable + language + prefix.
- **Online Mode** (11 games): cross-guild matchmaking — struggling lobbies open to other servers (📡 toggle).
- **AI players** fill empty seats at human pace (capped vs real players).
- **Fizzy currency:** playing + daily streaks + weekly podium; taxed transfers (confirm-first); spend on in-game perks, cosmetics — even subscriptions.
- Weekly global leaderboards per game; points system + `/leaderboard`; free guild branding (bot wears the server's name/avatar); scheduled events.

**Dashboard features**
- Account overview: active servers, total players, games played, duration; per-server 7-day graph.
- Server overview: totals + subscription status + 7/30-day activity graph + game-type distribution.
- **Insights (Plus):** peak hour, engagement trend, **hour×day heatmap**, game popularity, top players (activity/starters/win rate), filterable history.
- **Image Editor (Plus):** canvas editor for game-start images/leaderboards; start image renders live countdown + player count + member list.
- Channel manager (link/unlink, webhooks, languages), auto-updating leaderboard channels, subscription transfer.

**Free vs paid**
- Free: all multiplayer games except Plus-exclusive, 1 game channel, lobbies ≤20, **ad before every game**, no addons/points/leaderboards.
- **Plus $7.99/mo or $47.99/yr (≈$4/mo):** addons, no ads, custom images, points/leaderboards, 2 channels, ~30 lobbies, Insights + Image Editor.
- **Premium $11.99/mo or $89.99/yr:** dedicated bot (name/avatar/banner), unlimited channels, 5 leaderboard channels, max lobbies (200), Premium-only modes.
- Paddle billing; 1 sub = 1 server (transferable); frequent promo discounts.

**⭐ Steal for Aura**
- Cross-guild matchmaking + AI seat-filling + auto-online — solves dead-server lobbies (gold for Aura's games/mini-games gap).
- Heatmap/peak-hour analytics — great engagement metrics for Aura's Analytics tab.
- Currency that can pay for subscriptions (Aura economy → premium bridge).
- Canvas cosmetics editor as premium theater.

---

## 12. Vetox — all-in-one with AI tier + templates

**What it is:** "Run your server with one bot instead of five" — moderation, leveling, tickets, applications, notifications, backups, AI. ~16.9K servers, 21 languages. Dashboard-first.

**Bot features**
- Moderation + punishment registry; **JoinGuard** anti-raid; anti-scam; **AI auto-mod** (context-aware, per-language toxicity, trust scores, image/scam detection); AI raid lockdown.
- Community: leveling (multipliers/reset schedules), welcomer, suggestions, giveaways, starboards, counting, 25 mini-games with points + store, color roles (templates, color-on-join), temp voice + voice mod roles.
- Roles: self-assignable, auto, delayed, sticky.
- Messages: embed builder, Components v2 layouts, auto-responders, auto-interactions, reminders.
- Social notifications: 8 platforms (Twitch, YouTube, Kick, Reddit, Bluesky, Steam, RSS, Podcasts).
- Tickets: panels, forms/modals, priority, DM on open, transcript on close, **ratings**, auto-close, archive, escalation, **business hours, SLA tracking, staff stats**.
- Applications: multi-stage workflows, multi-staff voting, review threads, interview channels, probation roles, multi-server membership requirement.
- **Backups:** up to 250, scheduled, change tracking + revert ("Time Machine").
- Streaks (freezes, milestone roles); Battle Pass (seasons, quests, prestige); profiles/Vito social layer + public API.

**Dashboard features**
- **Dashboard-first:** slash commands are for actions only; all setup in the web panel (reverse of command-configured competitors).
- Every feature behind a master switch + a "10 features always on" list.
- 11 category editors; template gallery (YouTube/Minecraft/milsim/esports server layouts) with full channel/role preview, **merge vs replace modes**, automatic safety backup, JSON export.
- Dashboard permissions; downgrades **clamp limits instead of deleting data**; analytics; command browser; backup manager.

**Free vs paid**
- Free Starter: mod + basic automod (1 punishment), basic leveling/welcomer/suggestions/giveaways, 3 ticket panels (200 active), 1 application panel (5 questions), 10 embeds, 25 auto-responders, 10 auto-interactions, 3 reminders, 15 backups (5MB), 21 languages. **No social notifications, no anti-raid, no AI.**
- Basic **$4.99/mo:** JoinGuard, all 8 notification platforms (10 slots each), advanced logs/leveling, more capacity.
- Max **$7.99/mo:** unlimited limits, custom bot appearance, dashboard permissions, priority support.
- **Black $17.99/mo:** AI tier — 10M tokens/mo, AI automod + 25 custom rules, AI server control; token top-ups. Annual up to −31%.
- Membership (personal): **$2.99–$14.99/mo** — XP multipliers 1.25–3x, badges, profile frames, API.

**⭐ Steal for Aura**
- Master switches + "always-on list" — clean module mental model for Aura's 25-tab sidebar.
- **Template gallery apply flow** (preview → merge/replace → auto backup) — the single best trust-building dashboard UX found.
- AI as the metered top tier incl. natural-language server setup ("create my leveling channels") — direct match for Aura's AI moat.
- **Downgrades clamp, never delete.**
- Dual monetization: server premium + personal membership.

---

## 13. Cross-cutting dashboard patterns — top 10 to copy

| # | Pattern | Seen at | How Aura applies it |
|---|---------|---------|---------------------|
| 1 | Master switch per module + "always-on" list | Vetox, ProBot | Add a top toggle per sidebar group; list always-on core |
| 2 | Template gallery w/ merge/replace + auto backup | Vetox | "Server Templates" (gaming/community/creator presets) |
| 3 | Ticket analytics (response time, by-panel, daily chart) | ProBot, Vetox | New "Tickets → Insights" panel |
| 4 | Live-preview builders + reusable presets | NotifyMe, ProBot, Wicks | Shared embed presets used by notifications/welcome/panels |
| 5 | Ticket working hours + staff SLA stats | Wicks, Vetox | Tickets premium polish |
| 6 | Per-command toggles + role/channel overrides + auto-delete | ProBot, Dyno | Commands tab already lists commands — add per-command settings |
| 7 | Per-server access levels (Owner/Admin/Manage) | Wicks, NotifyMe | Settings → Dashboard permissions (+ premium) |
| 8 | Rank card / canvas image editor | MEE6, Fizbo | XP & Rewards → card designer; welcome image editor |
| 9 | Premium slots/transfer/gift flows | NotifyMe, Dyno, MEE6 | Billing: move premium, gifts, server slots |
| 10 | Downgrade clamps + limit tables on pricing page | Vetox, Dyno, NotifyMe | Premium page redesign |

---

## 14. Monetization patterns summary

| Model | Who | Aura take |
|-------|-----|-----------|
| Server tier ($4–12/mo) | Everyone | Aura Pro $4.99 — unchanged |
| Personal membership ($2.5–15/mo) | Dyno Battle Pass, Vetox, ProBot, MEE6 Pro | **New rail (later):** Aura personal perks — XP boosts, badges, profile — works across servers |
| Metered AI top tier | Vetox Black ($17.99, 10M tokens) | Fits Aura AI moat — measurable, defensible |
| Custom-branded bot ($6–$100/yr) | Wicks $5.99, TempVoice €6, Dyno Custom $99.99/yr | Aura Enterprise already has branding — validate price |
| White-label instance | TempVoice "Your Own Branding" | Aura Enterprise white-label — already planned |
| Ads before free games | Fizbo | Not for Aura (keeps brand premium) |
| Rate-limit gating (free = capped, premium = uncapped) | Ticket Tool (~10 tickets/min) | Candidate for high-volume modules instead of hard feature gates |
| Unbundled subs (tools / AI / personal) | MEE6 | Long-term direction: Aura AI as separate add-on |

---

## 15. Aura roadmap deltas (discussion draft)

**July plan gaps — still valid:** `/verify` captcha gate · `/stats` counter channels · `/suggest` system · `/autoresponder` slash command.

**New candidates from this research:**

*Bot side*
1. **Applications module** — modal-based forms, full role matrix (accept/deny/remove/required/restricted/ping), staff threads, manager roles, cooldowns, regex validation (Appy, Wicks, Vetox) — **✅ v1 shipped (Oct 2026):** dashboard "Applications" tab (form builder + live preview + review inbox + stats), multi-form DB models (`ApplicationForm`/`StaffApplication`), `/apply start [form]` + real `/apply status`, per-form role matrix, cooldowns, review timestamps + reviewer role gate, DM notifications. Still open: staff threads, regex validation, multi-stage workflows.
2. **Ticket analytics + working hours + escalation/multipanels** — ProBot, Wicks, Ticket Tool
3. **Beast Mode + score-based anti-raid + action-category whitelists** — Security Bot
4. **Invite growth kit:** invite labels, retention %, public leaderboard with vanity link, honeypots, CSV export + scheduled reports — Invite Tracker
5. **Starboard + counting + achievements** — free funnel modules (MEE6, Dyno, Vetox)
6. **Mini-games / game night** with AI seat-filling + cross-guild rooms (Fizbo)
7. **Sticky/delayed roles + temp links** (Vetox, ProBot)
8. **AI auto-mod + natural-language setup** (Vetox Black) as metered AI tier
9. **Server backups with change tracking / Time Machine** (Vetox) — dashboard already has BackupSettings; check depth
10. **XP rank card designer + welcome image editor** (MEE6, Fizbo)
11. **Anti-ghost-ping / anti-vanity / anti-invite-delete protections** — ready-made premium checklist (Security Bot)

*Dashboard side*
1. Template gallery with merge/replace + safety backup (Vetox)
2. Reusable embed presets w/ live preview (NotifyMe/Wicks)
3. **Config-change audit log ("Dashboard History")** — trust + rollback (Ticket Tool)
4. Per-server access levels (Wicks)
5. Master switches per module group (Vetox)
6. Premium page: limit tables + slots/transfer/gifts (Dyno/NotifyMe/MEE6) + comparison table (Appy)
7. Crown icons on premium-only fields — inline upsell (Appy)

*Monetization*
1. Personal membership rail (Dyno/Vetox/ProBot pattern)
2. AI as separate metered add-on (Vetox/MEE6 pattern)
3. Custom branding price validation vs Wicks $5.99 / TempVoice €6 / Invite Tracker €9.99 / Security Bot $11.99
4. Consider rate-limit gating for high-volume free features (Ticket Tool model)

---

## Appendix — primary sources used

- MEE6: wiki.mee6.xyz (plugins, levels, moderator, ticketing), help.mee6.xyz (free vs premium), vibebot.gg, peakbot.pro, toolfi.ai (pricing)
- ProBot: docs.probot.io (modules, premium, memberships, dashboard), probot.io/pricing, engages.io compare, peakbot.pro
- Dyno: dyno.gg/premium, docs.dyno.gg (commands, premium, battle-pass)
- Wicks: wicks.bot/en + /en/pricing, docs.wicks.bot (setup, dashboard, automod, tickets, applications, protection, automation, leveling, premium)
- NotifyMe: notifyme.bot (guide, premium), docs.notifyme.bot (add-account, customize-notifications, message-tags, premium)
- TempVoice: tempvoice.xyz (+/premium), easy.tempvoice.xyz/help/premium, github.com/TempVoice/Documentation (limits)
- Fizbo: fizbo.gg (+/plus, /docs — overview, insights, image-editor, fizzy), top.gg listing
- Vetox: vetox.io (pricing/premium, pricing/membership, ai, templates), docs.vetox.io
- Ticket Tool: tickettool.xyz/premium (+ premium-display), docs.tickettool.xyz (dashboard/panel-configs pages, FAQ)
- Invite Tracker: invite-tracker.com/premium, docs.invite-tracker.com (tickets, invite-tracking, analytics, verification, leaderboard, administration), invite-forge.com comparison (prices)
- Security Bot: securitybot.gg (+ /premium), docs.securitybot.gg (premium, premium+, anti-nuke, anti-raid, verification, beast-mode, logs, whitelist)
- Appy: appy.bot (+ /premium), docs.appy.bot (applications-forms, panels, ticket-system, premium, FAQ), web.archive.org capture
