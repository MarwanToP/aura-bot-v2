import crypto from 'crypto';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from '../../../../packages/config/src/env.js';

// 1a. Helmet HTTP Security Headers (CSP is set separately with a per-request nonce)
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
});

// 1b. Content Security Policy with a per-request nonce.
// Replaces the static CSP that relied on 'unsafe-inline' for scripts. The nonce
// is also exposed on the request/response so Next.js can apply it to the inline
// scripts it emits during server rendering (without it those scripts are blocked).
export const cspMiddleware = (req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  // React uses eval in development for enhanced debugging (e.g. rebuilding
  // server error stacks). Next.js docs: 'unsafe-eval' is required in dev and
  // must never be present in production.
  const isDev = process.env.NODE_ENV !== 'production';
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: https://cdn.discordapp.com`,
    `connect-src 'self' ${env.DOMAIN || 'http://localhost:3001'}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'self'`
  ].join('; ');
  res.locals.cspNonce = nonce;
  res.setHeader('Content-Security-Policy', csp);
  // Next.js reads the nonce from the request's CSP header when rendering.
  req.headers['content-security-policy'] = csp;
  next();
};

// 2. Strict CORS Verification
// Browsers attach an Origin header even to same-origin requests in CORS mode
// (e.g. font fetches) and to non-GET requests, so the server's own origin must
// never be gated. Foreign origins are still rejected before they reach a route.
export const corsMiddleware = cors((req, callback) => {
  const origin = req.headers.origin;
  let sameOrigin = false;
  if (origin) {
    try {
      sameOrigin = new URL(origin).host === req.headers.host;
    } catch {
      sameOrigin = false;
    }
  }
  const allowed = !origin || sameOrigin || (Array.isArray(env.CORS_ORIGINS) && env.CORS_ORIGINS.includes(origin));
  if (allowed) {
    callback(null, {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    });
  } else {
    callback(new Error('Blocked by CORS policy'));
  }
});

// 3. API Rate Limiting
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
