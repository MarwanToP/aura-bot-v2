const DYNAMIC_PREFIXES = ['/api/', '/auth/', '/socket.io/'];
const DYNAMIC_EXACT = new Set(['/api', '/auth', '/socket.io']);

function isDynamicPath(pathname) {
  if (DYNAMIC_EXACT.has(pathname)) return true;
  return DYNAMIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function buildUpstreamUrl(requestUrl, origin) {
  const source = new URL(requestUrl);
  const target = new URL(origin);
  target.pathname = source.pathname;
  target.search = source.search;
  return target;
}

function sanitizeOrigin(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/**
 * Forward headers needed for the backend to reconstruct the original request.
 */
function buildUpstreamHeaders(request, url) {
  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  headers.set('X-Real-IP', request.headers.get('CF-Connecting-IP') || '');
  return headers;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── Static assets (served from Cloudflare) ─────────────
    if (!isDynamicPath(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    // ── Dynamic routes (proxied to backend) ────────────────
    const origin = sanitizeOrigin(env.BACKEND_ORIGIN);
    if (!origin) {
      return new Response(
        JSON.stringify({
          error: 'BACKEND_ORIGIN is not configured',
          hint: 'Set BACKEND_ORIGIN in Cloudflare Worker variables.',
        }),
        {
          status: 500,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        },
      );
    }

    const upstreamUrl = buildUpstreamUrl(request.url, origin);
    const upstreamHeaders = buildUpstreamHeaders(request, url);

    // ── WebSocket upgrade (Socket.IO) ──────────────────────
    const upgradeHeader = request.headers.get('Upgrade') || '';
    if (upgradeHeader.toLowerCase() === 'websocket') {
      return fetch(upstreamUrl.toString(), {
        headers: upstreamHeaders,
        method: request.method,
        redirect: 'manual',
      });
    }

    // ── Regular HTTP proxy ─────────────────────────────────
    const upstreamRequest = new Request(upstreamUrl.toString(), {
      method: request.method,
      headers: upstreamHeaders,
      body: request.body,
      redirect: 'manual',
    });

    return fetch(upstreamRequest);
  },
};
