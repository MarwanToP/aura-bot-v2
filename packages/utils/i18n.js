// ================================================================
//  i18n — Multilingual Support
// ================================================================
import i18next          from 'i18next';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadLocale(locale) {
  try { return JSON.parse(readFileSync(join(__dirname, '../locales', `${locale}.json`), 'utf-8')); }
  catch { return {}; }
}

async function init() {
  await i18next.init({
    lng: process.env.DEFAULT_LANGUAGE || 'en',
    fallbackLng: 'en',
    resources: {
      en: { translation: loadLocale('en') },
      ar: { translation: loadLocale('ar') },
    },
    interpolation:    { escapeValue: false },
    returnNull:       false,
    returnEmptyString: false,
  });
}

function t(key, options = {}, locale = null) {
  return i18next.t(key, locale ? { ...options, lng: locale } : options);
}

async function getGuildLanguage(client, guildId) {
  if (!guildId) return 'en';
  try {
    const cached = await client.redis.get(`guild:lang:${guildId}`);
    if (cached) return cached;
    const { GuildSettings } = client.db.models;
    const s    = await GuildSettings.findOne({ where: { guildId } });
    const lang = s?.language || 'en';
    await client.redis.setex(`guild:lang:${guildId}`, 300, lang);
    return lang;
  } catch { return 'en'; }
}

/**
 * The language a user picked for one specific server.
 *
 * user_profiles is unique on (userId, guildId), so the row has to be read
 * with BOTH keys: a userId-only lookup returns an arbitrary server's row and
 * therefore a language the user never chose for this server. The Redis cache
 * key is scoped by guild for the same reason — one server's choice must not
 * leak into another. Without a guild there is no unambiguous row to read, so
 * the lookup is skipped and the caller falls back to the guild language.
 */
async function getUserLanguage(client, userId, guildId = null) {
  if (!userId) return null;
  const cacheKey = `user:lang:${guildId || 'global'}:${userId}`;
  try {
    const cached = await client.redis.get(cacheKey);
    if (cached) return cached === 'null' ? null : cached;
    const { UserProfile } = client.db.models;
    const p = guildId ? await UserProfile.findOne({ where: { userId, guildId } }) : null;
    const lang = p?.language || null;
    await client.redis.setex(cacheKey, 120, lang || 'null');
    return lang;
  } catch { return null; }
}

async function resolveLanguage(client, userId, guildId) {
  const u = await getUserLanguage(client, userId, guildId);
  if (u) return u;
  return getGuildLanguage(client, guildId);
}

function isRTL(locale) { return ['ar', 'he', 'fa', 'ur'].includes(locale); }

export default { init, t, getGuildLanguage, getUserLanguage, resolveLanguage, isRTL, raw: i18next };
