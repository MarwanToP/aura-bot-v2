# Aura Bot v2.0 — Free vs Premium Plan

> Benchmark source: 12-bot competitive analysis (MEE6, ProBot, Dyno, Ticket Tool, ServerStats, Invite Tracker, Security, Appy, Mr Poll, NotifyMe, TempVoice, Fizbo)
> Date: 2026-07-16

---

## Executive summary

Aura already covers **~80% of the 12-bot feature matrix**. The main gaps are:
1. **No verification/captcha gate** (Security bot has it free)
2. **No standalone suggestion system** (Mr Poll has it free)
3. **No mini-games beyond blackjack/slots** (Fizbo has 20+ free)
4. **Stats channels exist in DB but no slash command exposes them** (ServerStats does free)
5. **No music** (Dyno has it free)

Aura's **unique moats** that justify premium pricing:
- Native bilingual EN/AR (no competitor does this)
- Built-in AI (Cloudflare/Gemini) — 7 commands
- All-in-one (mod + tickets + leveling + economy + AI + temp voice + antinuke)
- Aesthetic customization (`/aesthetic` — no other bot offers this)
- Web dashboard included free (MEE6 charges for advanced dashboard)

---

## Tier plan

### 🆓 Free (always)

| Category | Free allowance | Rationale (vs competitor) |
|---|---|---|
| **Moderation** | Unlimited | All 12 bots offer this free |
| **Auto-mod** | Unlimited | All 12 bots offer this free |
| **Welcome / farewell** | Unlimited | All 12 bots offer this free |
| **Auto-role** | Unlimited | All 12 bots offer this free |
| **Reaction roles** | 5 per server | Same as Appy free; MEE6 charges for any |
| **Custom commands** | 3 per server | Same as MEE6 free tier |
| **Tickets** | 1 panel, 50 tickets/mo | Ticket Tool charges $7.99 for unlimited |
| **Anti-nuke** | Enabled (basic) | Security bot charges $3.50 — we win |
| **Anti-raid** | Enabled | All 12 bots free |
| **Leveling** | Unlimited | MEE6 charges for XP rate/role rewards |
| **Economy** | Unlimited basics, 0 shop items | — |
| **Giveaways** | 1 active | — |
| **Polls** | 5 active | — |
| **Stats channels** | 3 channels | ServerStats offers core free |
| **Temp voice** | 3 channels | TempVoice bot charges to remove voting |
| **Birthday** | Unlimited | — |
| **AI commands** | 20 req/day | Comparable to Gemini free tier |
| **Languages** | EN + AR | Aura's unique moat |
| **Web dashboard** | Full access | MEE6 charges for advanced |
| **Logging** | All channels | — |
| **Invite tracking** | Enabled | Invite Tracker offers free |

### ⭐ Premium Tier 1 — $4.99/mo (Aura Pro)

| Category | Premium allowance | Beats competitor by |
|---|---|---|
| **Custom commands** | 100 | vs MEE6 free 3 |
| **Reaction roles** | 40 | vs MEE6 free 0 (only premium) |
| **Auto-responders** | 50 | ProBot charges for advanced auto-mod |
| **Embed messages** | 100 | ProBot charges for embed builder |
| **Tickets** | 10 panels, unlimited tickets | vs Ticket Tool $7.99 single-purpose |
| **Temp voice** | 100 channels | vs TempVoice bot paid |
| **Timed messages** | 100 | ProBot charges |
| **Economy shop items** | 300 | — |
| **Giveaways** | 100 active | ProBot free = 1 |
| **Social alerts** | 100 accounts | vs NotifyMe free 35 accounts |
| **AI requests** | 500/day | vs Gemini free 1500/day shared, but our model is more efficient |
| **Polls** | Unlimited | Mr Poll charges for advanced |
| **Anti-nuke** | Advanced (configurable thresholds) | Security bot free = basic only |
| **Aesthetic** | Custom emoji/colors/branding | **Aura exclusive** — no competitor offers this |
| **AI image gen** | 50/day | MEE6 charges for any image gen |
| **Voice AI** | Enabled (Aura voice assistant) | **Aura exclusive** |

### 💎 Premium Tier 2 — $9.99/mo (Aura Enterprise)

| Category | Tier 2 allowance | Notes |
|---|---|---|
| Everything in Tier 1 | Unlimited | |
| **Multi-server dashboard** | Manage up to 10 servers from one panel | Aimed at bot networks |
| **Custom bot branding** | Name + avatar | Fizbo offers this free, MEE6 charges $50+ |
| **Priority AI routing** | Higher rate limits, faster response | — |
| **Audit log API** | REST API to query logs | For compliance / power users |
| **White-label dashboard** | Embed dashboard on your own domain | **Aura exclusive** |
| **Dedicated support** | Discord channel response <4h | — |
| **SLA** | 99.9% uptime guarantee | — |

---

## Build priority (next 6 weeks)

### Week 1–2: Gaps to close (free features that competitors have)

These are **free-tier expectations** for any modern Discord bot. Aura is missing them.

| Priority | Feature | Reason | Est. effort |
|---|---|---|---|
| 🔴 P0 | **Verification/captcha gate** (`/verify setup`) | Security bot is the standard. Without it, Aura looks incomplete. | 2 days |
| 🔴 P0 | **Server stats channels** (`/stats setup`) | Already 90% in DB & background tasks, just need a slash command. ServerStats is 1 of 12 reference bots. | 0.5 day |
| 🟠 P1 | **Suggestion system** (`/suggest`, `/approve`, `/deny`) | Mr Poll's signature feature. Low cost, high adoption. | 1.5 days |
| 🟠 P1 | **Auto-responder** command | Currently only in events, no `/autoresponder add` slash command | 1 day |

### Week 3–4: Premium differentiators (what makes people pay)

| Priority | Feature | Reason | Est. effort |
|---|---|---|---|
| 🟠 P1 | **Voice AI improvements** (multi-language wake word) | Aura's signature moat — make it actually work well | 3 days |
| 🟠 P1 | **Custom aesthetic UI** (web-based embed designer) | Visual editor for welcome cards, ticket panels, mod embeds | 4 days |
| 🟡 P2 | **Reaction role UI** (web visual editor) | Compete with ProBot's premium UI | 2 days |
| 🟡 P2 | **Auto-mod rules engine** (visual builder) | Match Security bot's configurability | 3 days |

### Week 5–6: Polish + launch

| Priority | Feature | Reason | Est. effort |
|---|---|---|---|
| 🟢 P3 | **Premium tier payment** (Stripe/Lemon Squeezy) | Start collecting revenue | 2 days |
| 🟢 P3 | **Premium onboarding flow** (tier comparison page in dashboard) | Convert free users | 1 day |
| 🟢 P3 | **Uptime monitoring page** (public) | Trust signal | 1 day |
| 🟢 P3 | **Discord bot list submission** (top.gg, discordbotlist.com) | Acquisition | 0.5 day |

---

## Pricing rationale

| Tier | Price | Why this number |
|---|---|---|
| **Free** | $0 | Standard. All bots have a free tier. |
| **Pro** | $4.99/mo | Cheaper than ProBot ($5–10), Dyno ($5), MEE6 ($11.95), Ticket Tool ($7.99). We win on price AND features (we offer mod + tickets + AI in one bot at $4.99). |
| **Enterprise** | $9.99/mo | Still cheaper than MEE6's top tier ($11.95+), but aimed at bot networks / power users. White-label dashboard is the differentiator. |

**Annual discount:** 20% off (Pro = $47.88/yr, Enterprise = $95.88/yr)

---

## What makes Aura defensible

1. **AI native**: 7 AI commands. No competitor has this breadth.
2. **Bilingual EN/AR**: Only Aura. Solves a real market gap (MENA region = 500M+ Arabic speakers).
3. **All-in-one**: Mod + tickets + economy + leveling + temp voice + antinuke + AI in ONE bot. MEE6 charges $12+/mo to get close.
4. **Aesthetic system**: `customEmojis`, embed branding. Unique.
5. **Free web dashboard**: MEE6 charges for dashboard; we don't.
6. **Free tier of premium features**: Custom commands (3 free), auto-mod (unlimited free), reaction roles (5 free) — we beat MEE6's free tier on every dimension.

## What competitors can copy

- Reaction roles (commodity)
- Tickets (commodity)
- Custom commands (commodity)
- Polls/giveaways (commodity)

## What they can't easily copy

- AI integration (cost barrier)
- Arabic localization (effort barrier)
- Aesthetic system (design moat)
- Web dashboard (engineering moat)

---

## TL;DR

Ship these **4 features in the next 2 weeks** to be competitive with the 12-bot benchmark:
1. `/verify` — captcha gate
2. `/stats` — counter channels
3. `/suggest` — suggestion system
4. `/autoresponder` — slash command for the existing auto-responder

Then launch the **$4.99 Pro tier** to start revenue. The Pro tier bundles AI + aesthetic + advanced auto-mod + unlimited reaction roles — features that on MEE6/Dyno would cost $10–15/mo across multiple bots.

Within 6 weeks, Aura can credibly claim: "the only all-in-one Discord bot with built-in AI for under $5/mo."
