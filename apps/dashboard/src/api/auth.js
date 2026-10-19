import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../../../packages/config/src/env.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Discord requires the redirect URI used in the authorize URL and in the token
// exchange to be byte-identical. In dev, honor an explicitly-configured
// localhost URI, otherwise pin to the local dashboard (next dev runs on 3000);
// production honors DISCORD_REDIRECT_URI.
const DISCORD_REDIRECT_URI =
  env.NODE_ENV !== 'production' && !env.DISCORD_REDIRECT_URI.includes('localhost')
    ? 'http://localhost:3000/api/auth/callback'
    : env.DISCORD_REDIRECT_URI;

// Where the browser lands after a successful login. In dev, honor a localhost
// DOMAIN, otherwise pin to the local dashboard; production honors DOMAIN.
const POST_LOGIN_URL =
  env.NODE_ENV !== 'production' && !env.DOMAIN.includes('localhost')
    ? 'http://localhost:3000/'
    : `${env.DOMAIN}/`;

// 1. Redirect to Discord OAuth2 Authorization Page with CSRF State Token
router.get('/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  });

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds&state=${state}`;
  res.redirect(discordAuthUrl);
});

// 2. Discord OAuth2 Callback Endpoint
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies?.oauth_state;

  res.clearCookie('oauth_state');

  if (!code) {
    return res.status(400).json({ error: 'Missing OAuth authorization code' });
  }

  if (!state || !savedState || state !== savedState) {
    return res.status(403).json({ error: 'CSRF validation failed: Invalid or missing state parameter' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Exchange Authorization Code for Token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to fetch OAuth token');
    }

    const userController = new AbortController();
    const userTimeout = setTimeout(() => userController.abort(), 10000);

    // Fetch User Profile from Discord API
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: userController.signal,
    }).finally(() => clearTimeout(userTimeout));

    const userData = await userResponse.json();

    // Generate Encrypted Session Token
    const sessionToken = jwt.sign(
      {
        id: userData.id,
        username: userData.username,
        avatar: userData.avatar,
      },
      env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    // Set HttpOnly Cookie
    res.cookie('aura_session', sessionToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(POST_LOGIN_URL);
  } catch (error) {
    console.error('❌ Discord OAuth Callback Error:', error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// 3. Get Authenticated Session Profile
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// 4. Logout Session
router.post('/logout', (req, res) => {
  res.clearCookie('aura_session');
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
