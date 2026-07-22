# Cloudflare End-to-End Integration Runbook

This runbook executes a full Cloudflare onboarding for your website edge/CDN path and validates it with DNS + HTTP diagnostics.

## What is automated

- Zone lookup/creation (Cloudflare API)
- DNS records (apex + `www` proxied, `origin` DNS-only)
- SSL/TLS and HTTPS hardening baseline
- Basic WAF custom rule (managed challenge on common probe paths)
- Cache baseline settings
- Validation (DNS, HTTPS, `cf-ray`, `/cdn-cgi/trace`, cache headers, latency)

## Prerequisites

- You already have Wrangler logged in (`npx wrangler whoami`)
- Domain you own (example: `example.com`)
- Origin URL/host (your current Railway app URL or server hostname)

## Step 1 - Provision Cloudflare zone + settings

```bash
npm run cf:zone:setup -- YOUR_DOMAIN https://YOUR_ORIGIN_HOST
```

Optional flags:
- `--account-id <id>`
- `--ssl strict` (only after origin cert for your custom domain is valid)

Example:

```bash
npm run cf:zone:setup -- mysite.com https://aura-dashboard-production-8c2e.up.railway.app
```

## Step 2 - Update registrar nameservers (manual)

Take the two nameservers printed by step 1 and set them at your registrar.

Cloudflare zone status stays `pending` until this is done.

## Step 3 - Wait for propagation

- Typical: a few minutes to a few hours
- Can take up to 24 hours depending on registrar/TLD

## Step 4 - Verify integration and performance

```bash
npm run cf:zone:verify -- YOUR_DOMAIN ns1.cloudflare.com,ns2.cloudflare.com
```

This checks:
- NS resolution
- A/CNAME resolution
- HTTPS response and `cf-ray`/Cloudflare headers
- `/cdn-cgi/trace` diagnostics (`colo`, TLS, HTTP protocol)
- Proxy vs origin latency snapshot (`origin.YOUR_DOMAIN` comparison)

## Step 5 - Update application URLs

After cutover, update these env vars to your custom domain:
- `DASHBOARD_URL=https://YOUR_DOMAIN`
- `DISCORD_CALLBACK_URL=https://YOUR_DOMAIN/auth/discord/callback`
- `DASHBOARD_CORS_ORIGIN=https://YOUR_DOMAIN`

And update Discord OAuth redirect in Discord Developer Portal.

## Notes on DDoS and firewall

- HTTP DDoS mitigation is automatically active at Cloudflare edge once traffic is proxied.
- Script includes one baseline WAF rule and enables core security settings.
- Add app-specific custom WAF/rate limits after baseline if needed.
