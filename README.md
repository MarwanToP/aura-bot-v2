s# ✨ Aura Bot v2.0 — Enterprise Discord Bot + AI
### MEE6-class Features • Google Gemini AI

---

## 🤖 AI Features
| Feature | Description |
|---------|------------|
| `/ask`  | Ask GPT-4o or Claude any question |
| `/chat` | Persistent multi-turn AI conversation (remembers context) |
| `/imagine` | DALL-E 3 image generation |
| `/translate` | AI translation (10 languages incl. Arabic) |
| `/summarize` | AI text summarization |
| `/aimod` | Staff: analyze messages with AI moderation |
| 🤖 AI AutoMod | Auto-flag/delete messages using OpenAI Moderation API |
| 💬 AI Chat Channel | Designate a channel where AI responds to all messages |
| 📬 AI DMs | Responds to direct messages with conversation memory |
| 🎂 AI Birthdays | AI-generates personalized birthday messages |
| 🗳️ AI Polls | AI generates poll options from a topic |
| 👋 AI Welcome | AI-generated personalized welcome messages |

---

## 🆓 Free Features (MEE6 Parity)

### Moderation
`/ban` `/kick` `/timeout` `/warn` `/clear` `/softban` `/history` `/case` `/warnings` `/unwarn`
- AI-powered auto-moderation (flagging + logging)
- Points-based warning system with auto-escalation
- Ghost ping detection and logging
- Comprehensive audit logs (messages, voice, roles, channels)

### Leveling & XP
`/rank` `/leaderboard` `/xp`
- Message + voice XP with configurable multipliers
- Canvas-generated rank cards
- Level role rewards
- Weekly/monthly leaderboards

### Welcome & Onboarding
- Canvas welcome cards (avatar, username, member count, guild banner)
- AI-generated or custom welcome messages
- Auto-role assignment (with delay timer)
- Farewell messages

### Engagement
- Birthday system with announcements + birthday role
- Polls (basic — 50 per free tier)
- Starboard with configurable emoji + threshold
- Auto-responder (regex, contains, exact, startsWith)
- Invite tracking (who invited whom, fake detection)

### Utility
`/ask` `/translate` `/summarize` — AI powered
`/ticket open/close/claim` — Support tickets with HTML transcripts
`/birthday set/check/upcoming`
`/poll create`
`/invites`
`/help`

### Security
- Anti-nuke (threshold: 3 bans/10min, 2 channel deletes/5min)
- Anti-raid with ML-based join pattern scoring
- Emergency lockdown command
- Comprehensive audit logging with executioner tracking

---

## ⭐ Premium Features (MEE6 Parity)

| Feature | Free Limit | Premium Limit |
|---------|-----------|--------------|
| Automations | 50 | **Unlimited** |
| Custom Commands | 0 | **500** |
| Reaction Roles | 5 | **40** |
| Embed Messages | 3 | **500** |
| Timed Messages | 1 | **100** |
| Temp Channels | 3 | **100** |
| Economy Items | 0 | **300** |
| AI Requests/day | 20 | **Unlimited** |
| Giveaways | ❌ | ✅ Unlimited |
| Social Alerts | ❌ | ✅ All platforms |
| Ticket Transcripts | ❌ | ✅ HTML transcripts |
| AI AutoMod | Basic | ✅ Deep GPT-4o |
| Analytics Dashboard | ❌ | ✅ |

### Premium-Only Features
- **Giveaway system** — Multi-winner, role requirements, reroll
- **Economy** — Coins, shop (300 items), gambling, leaderboard, transfers
- **Social Alerts** — Twitch 🟣, YouTube 🔴, Reddit 🟠, RSS 📡, Twitter/X 🐦, Instagram 📷, TikTok 🎵, Bluesky 🦋, Kick 🎮, Podcast 🎙️
- **Custom Commands** — 500 commands with AI-powered responses option
- **Reaction Roles** — 40 roles, toggle/add/remove/unique types
- **Timed Messages** — 100 recurring messages
- **Temp Channels** — 100 voice/text with expiry
- **Automations** — Unlimited event-based workflows
- **Birthday Role** — Auto-assign + AI messages
- **Lockdown** — Emergency server freeze
- **Anti-Raid** — ML join pattern detection

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- OpenAI API key (for AI features)

### 2. Setup
```bash
git clone https://github.com/your-org/aura-bot.git
cd aura-bot-v2
npm install
cp .env.example .env
# Fill in .env with your tokens
```

### 3. Discord App Setup
1. [Discord Developer Portal](https://discord.com/developers) → New Application
2. Bot tab → Enable all Privileged Gateway Intents
3. Copy token → `DISCORD_TOKEN`
4. Copy App ID → `DISCORD_CLIENT_ID`
5. OAuth2 → URL Generator → `bot + applications.commands`
6. Required permissions: `Administrator` (or specific permissions)

### 4. AI Setup (Optional but Recommended)
```bash
# In .env:
OPENAI_API_KEY=sk-...      # For GPT-4o + DALL-E + Moderation API
ANTHROPIC_API_KEY=sk-ant-... # Optional: Claude for reasoning
AI_PROVIDER=openai          # openai | anthropic | both
AI_ENABLED=true
```

### 5. Deploy & Run
```bash
# Deploy slash commands (instant guild deploy)
npm run deploy:guild -- YOUR_GUILD_ID

# Development
npm run dev

# Production (Docker recommended)
docker-compose up -d
```

---

## 📁 Project Structure
```
aura-bot-v2/
├── src/
│   ├── index.js                    # Sharding manager
│   ├── bot.js                      # Client + boot sequence
│   ├── commands/
│   │   ├── ai/         aiCommands.js          ← /ask /chat /imagine /translate /summarize /aimod
│   │   ├── moderation/ ban.js + moderationCommands.js + historyCommands.js
│   │   ├── admin/      settings.js + adminCommands.js + management.js
│   │   ├── support/    ticket.js
│   │   ├── utility/    utilityCommands.js (rank, leaderboard, help, lockdown)
│   │   └── premium/    premiumCommands.js (reactionrole, timedmsg, tempchannel, automation)
│   ├── events/
│   │   ├── ready.js interactionCreate.js messageCreate.js guildEvents.js
│   ├── handlers/
│   │   ├── commandHandler.js eventHandler.js
│   ├── systems/
│   │   ├── ai/           aiService.js         ← OpenAI + Anthropic unified
│   │   ├── leveling/     levelingSystem.js    ← XP + canvas rank cards
│   │   ├── welcome/      welcomeSystem.js     ← Canvas cards + AI messages
│   │   ├── tickets/      ticketSystem.js      ← Full ticket system
│   │   ├── economy/      economySystem.js     ← Coins, shop, gambling
│   │   ├── giveaway/     giveawaySystem.js    ← Giveaway management
│   │   ├── birthday/     birthdaySystem.js    ← Birthday tracking + AI
│   │   ├── polls/        pollSystem.js        ← Interactive polls + AI options
│   │   ├── socialAlerts/ socialAlerts.js      ← 10 platform monitors
│   │   ├── customcommands/ customCommands.js  ← 500 custom commands + AI
│   │   ├── antinuke/     antiNuke.js antiRaid.js
│   │   ├── logging/      loggingSystem.js inviteTracker.js
│   │   └── backgroundTasks.js                ← All cron jobs
│   ├── database/
│   │   ├── index.js    ← 23 Sequelize models
│   │   └── redis.js
│   ├── utils/
│   │   ├── embedBuilder.js i18n.js logger.js
│   └── locales/
│       ├── en.json ar.json
├── config/config.js                ← All tunable settings + tier limits
├── scripts/deploy-commands.js
├── Dockerfile docker-compose.yml
└── .env.example
```

---

## 🌐 Arabic / Bilingual Support
- Full RTL support in embeds
- Professional Modern Standard Arabic translations
- Arabic command aliases (`/حظر` `/طرد` `/تحذير` `/رصيد` `/عيد_ميلاد`)
- User-level language preference overrides guild default
- AI responds in Arabic when user language is set to Arabic
- Hijri date option for logging
- Regional timezones (Riyadh, Dubai, Cairo, London, New York)

---

## 📊 Performance
| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| Command response | <200ms p95 |
| AI response | <3s average |
| False positive (AI mod) | <5% |
| Translation quality | Professional grade |

---

## 🛠 Tech Stack
- **Discord.js v14** + Sharding
- **PostgreSQL** + Sequelize (23 models)
- **Redis** — caching, cooldowns, AI context, rate windows
- **OpenAI** — GPT-4o, DALL-E 3, Moderation API
- **Anthropic Claude** — Advanced reasoning (optional)
- **@napi-rs/canvas** — Welcome cards + rank cards
- **Express** — Dashboard API
- **Docker** — Production deployment

---

<p align="center">Built with ❤️ • Enterprise Discord Bot • AR + EN • Powered by OpenAI + Claude</p>
