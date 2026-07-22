# Cloudflare CDN Integration & Security Hardening Plan

This document outlines the sequential phases for integrating Cloudflare CDN, enhancing security, and optimizing performance for Aura Bot v2.0.

---

## Phase 1: Account Setup and Domain Registration
1.  **Account Creation**: Create a Cloudflare account using your business email.
2.  **Add Domain**: Add your primary domain (e.g., `aurabot.com`) via the Cloudflare Dashboard.
3.  **Audit Existing DNS**: 
    -   Export current DNS records from your registrar.
    -   Identify critical records: `A`, `AAAA`, `CNAME`, `MX`, `TXT`.
    -   **Pre-migration Checklist**: [Link to DNS Audit](#)

## Phase 2: DNS Migration and Nameserver Updates
1.  **Retrieve Nameservers**: Note the two assigned Cloudflare nameservers (e.g., `ashley.ns.cloudflare.com`).
2.  **Update Registrar**: Replace existing nameservers at your registrar with Cloudflare's.
3.  **Configure Records**:
    -   **Proxy Status**: Enable (Orange Cloud) for web traffic (`A`, `CNAME`).
    -   **TTL Settings**: 
        -   Transition: 300s (5 mins) for critical records.
        -   Post-migration: 3600s (Auto) for stable records.

## Phase 3: SSL/TLS Security Implementation
1.  **Encryption Mode**: Set to **Full (Strict)**.
2.  **Origin CA**: Generate a Cloudflare Origin Certificate and install it on your backend origin (Render/VPS).
3.  **Min TLS Version**: Set to **TLS 1.2**.
4.  **Automatic HTTPS Rewrites**: Enable to fix mixed content issues.
5.  **HSTS**: Enable with 6-month duration, including subdomains and preload.

## Phase 4: Security Hardening (WAF & Rate Limiting)
1.  **WAF Managed Rules**: Enable Cloudflare Managed Ruleset (OWASP).
2.  **Rate Limiting**:
    -   **Standard Pages**: 100 req/min per IP.
    -   **Auth Endpoints (`/auth/*`)**: 10 req/min per IP.
3.  **Bot Fight Mode**: Enable to challenge automated scrapers.
4.  **Zone Lockdown**: Restrict `/admin` or internal tools to specific IP ranges.
5.  **Browser Integrity Check**: Enable to block malformed user agents.

## Phase 5: Performance Optimization
1.  **Network**: Enable **HTTP/3 (QUIC)** and **0-RTT**.
2.  **Caching**:
    -   **Cache Level**: Standard.
    -   **Browser Cache TTL**: 4 hours for assets, 30 mins for HTML.
3.  **Content Optimization**:
    -   **Auto Minify**: HTML, CSS, JS.
    -   **Brotli**: Enable for better compression.
    -   **Polish**: Enable (Lossy/Lossless) for WebP optimization.
    -   **Rocket Loader**: Enable for faster JS rendering.

## Phase 6: Testing and Validation
1.  **DNS Propagation**: Verify via `whatsmydns.net`.
2.  **SSL Labs**: Target **A+** rating.
3.  **Performance**: Audit via GTmetrix/Lighthouse (Target 30%+ improvement).
4.  **Security Headers**: Verify `X-Content-Type-Options`, `X-Frame-Options`.
5.  **Load Testing**: Verify rate limits and DDoS responsiveness.

## Phase 7: Monitoring and Documentation
1.  **Analytics**: Monitor real-time traffic in Cloudflare Dashboard.
2.  **Health Checks**: Configure uptime alerts for `/api/health`.
3.  **Change Log**: Document every config change with justification.
4.  **Rollback Procedures**:
    -   **DNS Rollback**: Revert nameservers at registrar (Propagation: 2-24h).
    -   **Security Revert**: Disable WAF rules if legitimate traffic is blocked.
    -   **Bypass Cloudflare**: Set DNS records to "DNS Only" (Grey Cloud) to bypass proxy.

---

## Technical Appendix: Implementation Notes

### Security Headers (WAF/Transform Rules)
Ensure the following headers are set via Cloudflare Transform Rules or Origin:
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options`: `nosniff`
- `X-Frame-Options`: `DENY`
- `Referrer-Policy`: `strict-origin-when-cross-origin`

### Rate Limiting Logic
| Endpoint | Threshold | Action |
| :--- | :--- | :--- |
| `/*` (Global) | 100 req / 1 min | Block (1 hour) |
| `/auth/*` (Login) | 10 req / 1 min | Interactive Challenge |
| `/api/*` (API) | 50 req / 1 min | Block (15 mins) |

---
**Success Criteria Checklist:**
- [ ] Website loads through Cloudflare proxy.
- [ ] SSL Labs A+ rating achieved.
- [ ] 30% reduction in TTI (Time to Interactive).
- [ ] Rate limiting blocking excessive login attempts.
