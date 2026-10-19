// ================================================================
//  AI Moderation — Action Matrix (decision layer)
//
//  Sits between the AI Worker's moderation result and the enforcement
//  the bot actually applies (message removal, timeout, moderation case).
//  The subscriber (apps/bot/src/handlers/actionSubscriber.js) owns the
//  Discord side; this module owns the *rules*.
//
//  ── Verified Worker contract ────────────────────────────────────
//  apps/ai-worker/src/gemini/moderator.js asks Gemini for STRICT JSON:
//
//    {
//      "flagged": boolean,
//      "category": "none" | "toxicity" | "spam" | "phishing" | "harassment",
//      "severityScore": number (0 to 100),
//      "reason": "short explanation",
//      "recommendedAction": "none" | "warn" | "delete" | "timeout" | "ban"
//    }
//
//  and publishes `{ guildId, channelId, messageId, authorId, result }`
//  on the Redis channel `aura:moderation:actions`, where `result` is
//  that parsed JSON object.
//
//  ── Action matrix (single source of truth) ──────────────────────
//
//   recommendedAction | message deleted | timeout applied | ModerationCase.type
//   ------------------|------------------|-----------------|--------------------
//   none / unknown    | no               | severity >= 80  | timeout — only when
//                     |                  |                 | a timeout was applied
//   warn              | NO (kept)        | severity >= 80  | warn  (+ Warning row)
//   delete            | yes              | severity >= 80  | note  (no user penalty)
//   timeout           | yes              | yes (15m)       | timeout (+ duration)
//   ban               | yes              | yes (15m)       | warn  (+ Warning row)
//
//  Rationale for the non-obvious cells:
//   • 'warn' KEEPS the message. A warning is the reversible, non-destructive
//     sanction, so the user is sanctioned through the warning/case system
//     instead of having their content silently removed. Only 'delete',
//     'timeout' and 'ban' remove the message.
//   • 'delete' records a 'note' and not a 'warn': the message is gone but no
//     warning point is issued, so the user's warning counter stays clean.
//   • 'ban' NEVER bans. A ban is destructive and effectively irreversible
//     from an automated path, so the engine downgrades it to a
//     high-severity timeout plus a 'warn' case and asks a human to act.
//   • severityScore >= 80 keeps the legacy behaviour of timing out any
//     flagged message, on top of the recommended action.
//   • An explicit 'warn' recommendation always yields a 'warn' case so the
//     matching Warning row is written, even when the severity rule also
//     applies a timeout (the timeout is mentioned in the case reason).
// ================================================================

/** Legacy default timeout applied by the AI moderation engine (15 minutes). */
export const DEFAULT_AI_TIMEOUT_MS = 15 * 60 * 1000;

/** Any flagged message at or above this severity is timed out (legacy rule). */
export const SEVERITY_TIMEOUT_THRESHOLD = 80;

/** Discord's hard cap for a communication timeout (28 days). */
export const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

/** Recommended actions that remove the offending message. */
const REMOVING_ACTIONS = new Set(['delete', 'timeout', 'ban']);

/**
 * Normalizes `result.recommendedAction` to a known action string.
 * Anything unknown/empty is treated as 'none' (no enforcement).
 */
export function normalizeAiAction(result) {
  const raw = typeof result?.recommendedAction === 'string' ? result.recommendedAction.trim().toLowerCase() : '';
  return raw || 'none';
}

/**
 * Human readable duration, e.g. 900000 -> "15m", 3600000 -> "1h".
 */
export function formatAiDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(Number(ms) / 1000) || 0);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length) parts.push(`${totalSeconds}s`);
  return parts.join(' ');
}

/**
 * Resolves the timeout length for a guild.
 *
 * Default is 15 minutes. A per-guild override is read from GuildSettings
 * ONLY when the model actually declares such a column — today it does not
 * (GuildSettings exposes `aiModEnabled` / `aiModSensitivity` and no timeout
 * column), so no query is issued and the default is always used. If the
 * column is ever added (`aiModTimeout` / `aiModDuration`, interpreted as
 * MINUTES) it is picked up automatically without touching the schema here.
 */
export async function resolveAiTimeoutMs(client, guildId) {
  const model = client?.db?.models?.GuildSettings;
  if (!model) return DEFAULT_AI_TIMEOUT_MS;

  const attributes = model.rawAttributes || {};
  const overrideKey = ['aiModTimeout', 'aiModDuration'].find((key) => key in attributes);
  if (!overrideKey) return DEFAULT_AI_TIMEOUT_MS; // no such column -> fixed 15m default

  try {
    const settings = await model.findOne({ where: { guildId } });
    const minutes = Number(settings?.[overrideKey]);
    if (Number.isFinite(minutes) && minutes > 0) {
      return Math.min(minutes * 60 * 1000, MAX_TIMEOUT_MS);
    }
  } catch {
    // A failed settings lookup must never change the enforcement behaviour.
  }
  return DEFAULT_AI_TIMEOUT_MS;
}

/**
 * Turns a raw AI result into the enforcement plan.
 *
 * @param {object} result                 parsed `result` from the AI Worker
 * @param {object} [options]
 * @param {number} [options.timeoutMs]    timeout length to apply
 * @returns {{
 *   action: string, severity: number, deleteMessage: boolean, applyTimeout: boolean,
 *   timeoutMs: number, caseType: string|null, caseDuration: number|null,
 *   escalated: boolean, reason: string
 * }}
 */
export function resolveAiActionPlan(result, { timeoutMs = DEFAULT_AI_TIMEOUT_MS } = {}) {
  const action = normalizeAiAction(result);
  const severity = Number(result?.severityScore) || 0;

  const deleteMessage = REMOVING_ACTIONS.has(action);
  const applyTimeout = action === 'timeout' || action === 'ban' || severity >= SEVERITY_TIMEOUT_THRESHOLD;
  const escalated = action === 'ban'; // a ban is never executed automatically

  let caseType = null;
  let caseDuration = null;
  if (escalated) {
    // 'ban' -> recorded as a warning, the human decides what happens next.
    caseType = 'warn';
  } else if (action === 'warn') {
    // Always a 'warn' case so the Warning row is written.
    caseType = 'warn';
  } else if (applyTimeout) {
    caseType = 'timeout';
    caseDuration = timeoutMs;
  } else if (deleteMessage) {
    caseType = 'note';
  }

  const category = result?.category || 'uncategorized';
  const detail = result?.reason || 'No reason provided';
  let reason = `Neural Moderation [${category}]: ${detail}`;
  if (escalated) {
    reason += ' (AI recommended a ban — no ban applied, operator action required)';
  } else if (applyTimeout && caseType !== 'timeout') {
    reason += ` (${formatAiDuration(timeoutMs)} timeout applied)`;
  }

  return {
    action,
    severity,
    deleteMessage,
    applyTimeout,
    timeoutMs,
    caseType,
    caseDuration,
    escalated,
    reason,
  };
}
