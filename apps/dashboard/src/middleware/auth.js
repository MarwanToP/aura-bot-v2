import jwt from 'jsonwebtoken';
import { env } from '../../../../packages/config/src/env.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.aura_session || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing session token' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired session token' });
  }
}
