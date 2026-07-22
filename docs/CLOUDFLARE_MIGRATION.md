# Cloudflare Migration (Railway -> Cloudflare Edge)

This repository includes two Cloudflare Workers:

1. **`aura-dashboard-edge`** — Edge proxy that serves the dashboard and proxies dynamic routes to your Node backend.
2. **`aura-ai-worker`** — Standalone Workers AI endpoint for chat completions and content moderation.

---

## Architecture

```
User -> Cloudflare CDN (aura-dashboard-edge)
          |
          ├── Static files (/index.html, /css, /js) -> Cloudflare Assets
          ├── WebSocket (/socket.io/*) -> Backend origin (upgrade supported)
          └── API + Auth (/api/*, /auth/*) -> Backend origin (Express)

Bot / Dashboard -> aura-ai-worker
                    ├── POST /chat     -> Workers AI (Llama 3.1)
                    ├── POST /moderate -> Workers AI (content moderation)
                    └── GET  /health   -> Status check
```

## What changed

- `wrangler.toml` (root) — edge worker config:
  - Entry: `website/cloudflare-worker.js`
  - Static assets: `website/public`
  - Dynamic passthrough: `/api/*`, `/auth/*`, `/socket.io/*`
  - WebSocket upgrade support for Socket.IO
  - Forwarding headers (`X-Forwarded-Host`, `X-Forwarded-Proto`, `X-Real-IP`)
- `aura-ai-worker/` — standalone AI worker:
  - `wrangler.toml` — worker config
  - `src/index.js` — REST API for chat + moderation via Workers AI
- npm scripts: `npm run cf:dev`, `npm run cf:deploy`
- Removed stale `src/index.py` (leftover Python bot template)

## Deployment: Dashboard Edge Worker

1. Install Wrangler: `npm i -D wrangler` (already in devDependencies)
2. Login: `npx wrangler login`
3. Set `BACKEND_ORIGIN` in `wrangler.toml` or via Cloudflare dashboard:
   ```
   BACKEND_ORIGIN = "https://dashboard-api.yourdomain.com"
   ```
4. Deploy: `npm run cf:deploy`
5. Point your domain (e.g. `panel.yourdomain.com`) to this Worker in Cloudflare DNS.
6. Update Discord OAuth callback to: `https://panel.yourdomain.com/auth/discord/callback`

## Deployment: AI Worker

1. Navigate to `aura-ai-worker/`:
   ```
   cd aura-ai-worker
   ```
2. Set environment variables (secrets recommended):
   ```bash
   npx wrangler secret put API_SECRET      # shared secret for auth
   npx wrangler secret put CF_API_TOKEN    # Cloudflare API token (if not using AI binding)
   npx wrangler secret put CF_ACCOUNT_ID   # your Cloudflare account ID
   ```
   Or use the AI binding (preferred — add to `wrangler.toml`):
   ```toml
   [ai]
   binding = "AI"
   ```
3. Deploy: `npx wrangler deploy`

### AI Worker API

All POST endpoints require `Authorization: Bearer <API_SECRET>` header.

**POST /chat**
```json
{
  "messages": [{ "role": "user", "content": "Hello" }],
  "system": "You are Aura, a helpful Discord bot.",
  "model": "@cf/meta/llama-3.1-8b-instruct",
  "maxTokens": 1000
}
```
Response: `{ "success": true, "content": "...", "provider": "cloudflare" }`

**POST /moderate**
```json
{
  "content": "message to check",
  "context": "deep"
}
```
Response: `{ "success": true, "violation": false, "category": "clean", ... }`

**GET /health**
```json
{ "status": "ok", "model": "@cf/meta/llama-3.1-8b-instruct", "hasAIBinding": false }
```

## Important Notes

- Keep your Node dashboard backend running somewhere reachable (VPS, Render, Fly.io, etc.).
- The edge worker handles WebSocket upgrades for Socket.IO — no special configuration needed.
- The AI worker can use either the Workers AI binding (`env.AI`) or the REST API — binding is faster and free of token cost.
- Once you later refactor backend APIs for full Worker-native runtime (D1, KV, Durable Objects), you can remove origin proxying.
