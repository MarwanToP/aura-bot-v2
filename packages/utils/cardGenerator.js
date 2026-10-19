// ================================================================
//  AURA BOT v2.0 — Neural Card Generator (Canvas Engine)
// ================================================================
import { AttachmentBuilder } from 'discord.js';
import logger              from './logger.js';

// ─── Lazy native canvas loader ─────────────────────────────────────
// '@napi-rs/canvas' is a NATIVE module: on a host without a matching
// prebuilt binary (musl/alpine images, an unsupported platform, a broken
// install) importing it throws *while the module graph is evaluated*.
//
// A static import therefore has two failure modes, both fatal:
//   1. it aborts the whole boot chain
//      (index.js → events/messageCreate.js → levelingSystem, and
//       index.js → packages/systems/backgroundTasks.js → levelingSystem),
//   2. the command loader swallowed the import error, so a dozen commands
//      silently vanished while the deploy script still published them.
//
// The native module is therefore loaded lazily, exactly once per process,
// and every failure is contained: the loader resolves to `null` and the
// callers degrade to their text-only output.
const CANVAS_MODULE_ID = '@napi-rs/canvas';

// Operational kill switch: AURA_DISABLE_CANVAS=true forces the loader to
// behave as if the native module were unavailable (used to exercise the
// degraded path and to run on hosts where the native binding is unusable).
const CANVAS_DISABLE_ENV = 'AURA_DISABLE_CANVAS';

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);

/**
 * @returns {boolean} true when the kill switch forces the native module
 *                   to be treated as unavailable.
 */
export function isCanvasDisabled() {
  const raw = process.env[CANVAS_DISABLE_ENV];
  return typeof raw === 'string' && TRUTHY_VALUES.has(raw.trim().toLowerCase());
}

// Cached loader promise. `null` is a valid, cached result: a native module
// that failed to load once must not be retried on every card render.
let canvasPromise = null;
let disabledNoticeLogged = false;

/**
 * Loads the native canvas module exactly once per process.
 *
 * @returns {Promise<{createCanvas: Function, loadImage: Function}|null>}
 *          the native module, or `null` when it is unavailable/disabled.
 */
async function loadCanvasModule() {
  if (isCanvasDisabled()) {
    if (!disabledNoticeLogged) {
      disabledNoticeLogged = true;
      logger.info(`[Canvas] ${CANVAS_DISABLE_ENV} is set — native canvas disabled, cards fall back to text output.`);
    }
    return null;
  }

  if (!canvasPromise) {
    canvasPromise = import(CANVAS_MODULE_ID)
      .then((mod) => {
        if (!mod || typeof mod.createCanvas !== 'function' || typeof mod.loadImage !== 'function') {
          logger.warn('[Canvas] Native module loaded but exposes no createCanvas/loadImage — cards fall back to text output.');
          return null;
        }
        return mod;
      })
      .catch((err) => {
        logger.warn(`[Canvas] Native module unavailable (${err?.message || err}) — cards fall back to text output.`);
        return null;
      });
  }
  return canvasPromise;
}

// The avatar is fetched from Discord's CDN over the network. A slow or
// unreachable CDN must never leave the command hanging (no reply at all), so
// the fetch is bounded and falls back to a generated monogram.
const AVATAR_FETCH_TIMEOUT_MS = 2_500;

// ─── Native pipeline warm-up ─────────────────────────────────────
// @napi-rs/canvas initialises its native runtime lazily, and every one of
// those first touches is expensive. Measured on this machine:
//
//   import @napi-rs/canvas  4711ms   (native module load)
//   createCanvas()   #1        538ms   (#2: 1ms)
//   fillText()       #1       2620ms   (font registry)
//   encode('png')    #1        951ms   (#2: 12ms)
//   loadImage()      #1        690ms   (#2: 0ms)
//
// The card render used to pay that one-time cost *inside* the command, which
// made /bank balance the only command in the test harness that could take
// seconds — and under load a single createCanvas() was observed to take 7s,
// enough to push the interaction past the caller's timeout.
//
// Warming the pipeline once per process moves the cost to process start-up,
// where it belongs, and makes every later card render take a few
// milliseconds. The warm-up is best effort: it can never throw and it is
// bounded, so a broken canvas runtime can never block start-up.
const WARMUP_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// Upper bound for the warm-up. If the native runtime is stuck the
// import continues anyway; a card render then simply falls back to the
// monogram/timeout path.
const WARMUP_MAX_WAIT_MS = 5_000;

let warmupPromise = null;

/**
 * Warms the native canvas pipeline exactly once per process.
 *
 * The native module is pulled in through the lazy loader, so this resolves
 * immediately (with a no-op) when the native runtime is unavailable.
 *
 * @returns {Promise<void>} resolves when the pipeline is warm (never rejects)
 */
export function warmupCardRenderer() {
  if (!warmupPromise) {
    warmupPromise = (async () => {
      try {
        const native = await loadCanvasModule();
        // Native module unavailable — there is nothing to warm up.
        if (!native) return;
        // Sync part: canvas creation, 2d context and font registry.
        const canvas = native.createCanvas(16, 16);
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('A', 2, 12);
        // Async part: PNG encoder and image decoder.
        await canvas.encode('png');
        await native.loadImage(Buffer.from(WARMUP_PNG_BASE64, 'base64'));
      } catch {
        // Best effort only — a card that cannot be rendered falls back to the
        // text statement instead of failing the whole command.
      }
    })();
  }
  return warmupPromise;
}

/** Runs `promise` but gives up after `ms` (used to bound the warm-up). */
function withDeadline(promise, ms) {
  let timer;
  const deadline = new Promise((resolve) => { timer = setTimeout(resolve, ms); });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

// Kick the warm-up off in the background. It is deliberately NOT awaited at
// module scope: importing this module must never block the boot and must
// never throw.
//
// The kick-off is deferred to the next event-loop turn on purpose. A dynamic
// import started *during* module evaluation is queued as a module job, and
// Node drains that queue before it resolves the importing module's promise —
// so kicking the native import off inline would still delay every importer
// (economySystem → the command loader → the bot's boot) by the whole native
// load time. Deferred, `import 'cardGenerator.js'` returns immediately and
// the pipeline still warms up long before the first card is rendered.
const warmupTimer = setTimeout(() => {
  warmupCardRenderer().catch(() => {});
}, 0);
// Never let the warm-up keep an otherwise idle process alive.
warmupTimer.unref?.();

// ─── Avatar loading ─────────────────────────────────────────────
// Decoded avatars are cached per URL for the lifetime of the process: the
// same avatar is rendered repeatedly (e.g. /bank balance and /credits for
// the same user) and every render would otherwise pay another network round-trip
// against Discord's CDN. The cache is bounded — a decoded 256×256 avatar is
// ~256 KB, so only a handful are kept around.
const AVATAR_CACHE_MAX = 16;
const avatarCache = new Map(); // url -> Image

/**
 * Loads the user's avatar image.
 *
 * - `data:` URIs are decoded locally (no network involved).
 * - `http(s):` URLs are fetched with a hard bound; on timeout / error the
 *   monogram fallback is used instead.
 *
 * @param {object} user
 * @param {{loadImage: Function}} native the lazily loaded native canvas module
 * @returns {Promise<Image|null>}
 */
async function loadAvatarWithFallback(user, native) {
  let url;
  try {
    url = user.displayAvatarURL({ extension: 'png', size: 256 });
  } catch {
    return null;
  }
  if (!url) return null;

  if (avatarCache.has(url)) return avatarCache.get(url);

  const isRemote = /^https?:\/\//i.test(url);
  const isData   = /^data:/i.test(url);
  if (!isRemote && !isData) return null;

  let image = null;

  if (isData) {
    // Local payload — decode it directly, there is nothing to fetch.
    try {
      image = await native.loadImage(url);
    } catch {
      image = null;
    }
  } else {
    // Fetch the bytes ourselves with an abort signal: on timeout the socket is
    // closed (no lingering handle keeps the process alive) and the whole step
    // stays hard-bounded, so a slow CDN can never stall a command.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AVATAR_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (res.ok) {
        const bytes = Buffer.from(await res.arrayBuffer());
        image = await native.loadImage(bytes);
      }
    } catch {
      image = null;
    } finally {
      clearTimeout(timer);
    }
  }

  // Only successful decodes are cached: a transient CDN failure must not
  // degrade every later card of that user for the rest of the process.
  if (image) {
    if (avatarCache.size >= AVATAR_CACHE_MAX) {
      avatarCache.delete(avatarCache.keys().next().value); // evict the oldest
    }
    avatarCache.set(url, image);
  }
  return image;
}

/**
 * Generates a premium Aura Profile Card
 *
 * @returns {Promise<AttachmentBuilder|null>} the card, or `null` when the
 *          native canvas runtime is unavailable or the render failed. The
 *          caller is expected to fall back to its text statement.
 */
export async function generateAuraCard(user, data) {
  try {
    const native = await loadCanvasModule();
    // Native module unavailable → the caller falls back to the text statement.
    if (!native) return null;

    // The pipeline is normally already warm (see the warm-up above); this only
    // matters for the very first render in a process that skipped the warm-up.
    await withDeadline(warmupCardRenderer(), WARMUP_MAX_WAIT_MS);

    const canvas = native.createCanvas(800, 300);
    const ctx    = canvas.getContext('2d');

    // ── 1. Background & Styling ────────────────────────────────────
    const grad = ctx.createLinearGradient(0, 0, 800, 300);
    grad.addColorStop(0, '#0F0C29');
    grad.addColorStop(0.5, '#302B63');
    grad.addColorStop(1, '#24243E');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 300);

    // Subtle Aura Pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 300);
      ctx.stroke();
    }

    // ── 2. Avatar ──────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(100, 150, 70, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    const avatar = await loadAvatarWithFallback(user, native);
    if (avatar) {
      ctx.drawImage(avatar, 30, 80, 140, 140);
    } else {
      // Monogram fallback — the card still renders if the avatar is unavailable.
      ctx.fillStyle = '#BF5AF2';
      ctx.fillRect(0, 0, 140, 300);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((user.username || '?').charAt(0).toUpperCase(), 100, 178);
      ctx.textAlign = 'left';
    }
    ctx.restore();

    // Avatar Border
    ctx.strokeStyle = '#BF5AF2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(100, 150, 72, 0, Math.PI * 2, true);
    ctx.stroke();

    // ── 3. Text & Info ─────────────────────────────────────────────
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(user.username.toUpperCase(), 200, 100);

    ctx.fillStyle = '#A0A0A0';
    ctx.font = '16px sans-serif';
    ctx.fillText('NEURAL IDENTITY VERIFIED', 200, 125);

    // Stats Grid
    const stats = [
      { label: 'AURA POINTS', value: Number(data.balance || 0).toLocaleString(), x: 200 },
      { label: 'DAILY STREAK', value: `${data.streak || 0} DAYS`, x: 400 },
      { label: 'REPUTATION', value: Number(data.reputation || 0).toLocaleString(), x: 600 },
    ];

    stats.forEach(s => {
      ctx.fillStyle = '#BF5AF2';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(s.label, s.x, 180);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(s.value, s.x, 215);
    });

    // Footer Branding
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = 'italic 12px sans-serif';
    ctx.fillText('AURA INTELLIGENCE v2.1 // POWERED BY GEMINI', 200, 270);

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'aura-profile.png' });
  } catch (err) {
    // A canvas failure must never escape into a command — the caller falls
    // back to the plain text statement.
    logger.warn(`[Canvas] generateAuraCard failed: ${err?.message || err}`);
    return null;
  }
}
