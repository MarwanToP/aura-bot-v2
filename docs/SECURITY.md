# Aura Bot v2 Security Hardening Runbook

## Security Architecture & Defenses

### 1. Environment & Secret Protection
- **Zod Startup Validation**: `packages/config/` validates all required environment variables (`DISCORD_TOKEN`, `DATABASE_URL`, `REDIS_URL`, `GEMINI_API_KEY`, `JWT_SECRET`) prior to service boot.
- **Git Exclusions**: `.gitignore` strictly prevents committing API keys, tokens, or credentials.

### 2. Web API & Dashboard Security
- **OAuth2 State Verification**: Discord OAuth2 logins verify cryptographic `state` parameters to prevent CSRF attacks.
- **HttpOnly Cookies**: Session tokens are stored in `HttpOnly`, `SameSite=Lax` cookies.
- **Strict CORS & WebSockets**: CORS and Socket.io origins are strictly matching `ALLOWED_ORIGINS` (no wildcards `*`).
- **HTTP Headers & Rate Limiting**: `helmet` enforces security headers and `express-rate-limit` prevents brute-force traffic.

### 3. Database & Input Validation
- **SQL Injection Prevention**: Prisma ORM / parameterized queries eliminate raw SQL vulnerabilities.
- **Input Sanitization**: Zod validation schemas check all REST API payloads.

### 4. Discord Bot Security
- **Least Privilege**: Administrator permissions are checked before executing admin actions.
- **Atomic Rate Limiting**: Redis atomic counters enforce per-user/per-guild command cooldowns.

### 5. AI / Gemini Integration Guardrails
- **Prompt Injection Defense**: All user inputs are wrapped in strict `<user_query>...</user_query>` XML boundary tags before passing to Gemini 1.5 Flash.
- **Output Sanitization**: Control characters and malicious escape strings are stripped from AI output.
