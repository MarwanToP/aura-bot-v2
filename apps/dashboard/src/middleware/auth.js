import jwt from 'jsonwebtoken';
import { env } from '../../../../packages/config/src/env.js';

// Dev-only convenience auth. Requires an explicit ALLOW_DEV_AUTH=true opt-in
// and never applies in production, so no stray dev boot or env flag can
// silently mint a fake admin session.
export function isDevAuth() {
  return process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_AUTH === 'true';
}

export function requireAuth(req, res, next) {
  const devAuth = isDevAuth();
  const token = req.cookies?.aura_session || req.headers.authorization?.split(' ')[1];

  if (!token) {
    if (devAuth) {
      req.user = {
        id: '123456789012345678',
        username: 'DevAdmin',
        avatar: null,
        dev: true,
      };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing session token' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (err) {
    if (devAuth) {
      req.user = {
        id: '123456789012345678',
        username: 'DevAdmin',
        avatar: null,
        dev: true,
      };
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: Invalid or expired session token' });
  }
}
