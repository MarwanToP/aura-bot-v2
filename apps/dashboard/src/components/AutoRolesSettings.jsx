"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Clock,
  Shield,
  Save,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
} from "lucide-react";

/* ────────────────────────────── motion helpers ────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.03 } },
};

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/* ────────────────────────────── data ────────────────────────────── */

/* Guest-only demo roster. It is never rendered once live data is loaded. */
const SAMPLE_ROLES = [
  { id: "1128439813574934590", name: "Verified", color: "#39D98A" },
  { id: "1128439813574934591", name: "Unverified", color: "#8B92A5" },
  { id: "1128439813574934592", name: "Server VIP", color: "#FFB547" },
  { id: "1128439813574934593", name: "Moderator", color: "#5B8CFF" },
];

const DEMO_ROLE_ID = SAMPLE_ROLES[0].id;

/* The bot stores the delay in SECONDS and accepts 0..86400 (0 = assign on join). */
const MAX_DELAY = 86400;
const DEMO_MAX_DELAY = 300;

/* Discord snowflakes are 17–20 digits — anything else is rejected by the API. */
const SNOWFLAKE = /^\d{17,20}$/;
const FALLBACK_ROLE_COLOR = "#8B92A5";

/* Discord roles without a colour arrive as null — never let "null" reach the DOM. */
function roleColor(role) {
  return typeof role?.color === "string" && role.color ? role.color : FALLBACK_ROLE_COLOR;
}

function mapRole(role) {
  return {
    id: String(role?.id ?? ""),
    name: typeof role?.name === "string" && role.name ? role.name : "Unnamed role",
    color: roleColor(role),
    position: Number.isFinite(Number(role?.position)) ? Number(role.position) : 0,
    managed: Boolean(role?.managed),
  };
}

function clampDelay(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_DELAY, Math.round(n)));
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function AutoRolesSettings({ guildId }) {
  const [autoRoleId, setAutoRoleId] = useState(DEMO_ROLE_ID);
  const [autoRoleDelay, setAutoRoleDelay] = useState(0);
  const [roleSearch, setRoleSearch] = useState("");
  const [toast, setToast] = useState(null);
  /* outcome of the last load: { guildId, status: "real" | "failed" | "unavailable", roles } */
  const [outcome, setOutcome] = useState(null);
  const [saving, setSaving] = useState(false);

  const toastTimer = useRef(null);
  const showToast = (msg, kind = "ok") => {
    setToast({ msg, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /* request guard — only the latest load may write state */
  const requestSeq = useRef(0);

  /* real data — the humanized demo stays in charge for guests and for failed loads */
  const loadAutoRoles = useCallback(
    async (options) => {
      const requestId = ++requestSeq.current;
      const silent = Boolean(options?.silent);

      if (!guildId) {
        // Guest mode: no request at all, the demo markup is rendered as-is.
        setOutcome(null);
        setAutoRoleId(DEMO_ROLE_ID);
        setAutoRoleDelay(0);
        return;
      }

      if (!silent) setOutcome(null);

      let settings = null;
      let roles = null;
      let notDeployed = false;
      let failure = null;

      try {
        const res = await fetch(`/api/guilds/${guildId}/auto-roles`);
        if (res.status === 404 || res.status === 501) {
          // The route is not deployed for this backend yet — no invented data.
          notDeployed = true;
        } else {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          settings = {
            autoRoleId: data?.autoRoleId == null ? "" : String(data.autoRoleId),
            autoRoleDelay: clampDelay(data?.autoRoleDelay),
          };
        }
      } catch (err) {
        failure = err;
      }

      if (!notDeployed) {
        try {
          const res = await fetch(`/api/guilds/${guildId}/roles`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          roles = (Array.isArray(data?.roles) ? data.roles : [])
            .map(mapRole)
            // @everyone is the guild id itself and can never be handed out.
            .filter((role) => role.id && role.id !== String(guildId));
        } catch (err) {
          failure = failure || err;
        }
      }

      if (requestId !== requestSeq.current) return; // stale response from a previous guild

      if (notDeployed) {
        setOutcome({ guildId: String(guildId), status: "unavailable", roles: null });
        setAutoRoleId("");
        setAutoRoleDelay(0);
        return;
      }

      if (failure || !settings || !roles) {
        if (!silent) {
          // Nothing trustworthy for this guild yet — keep the humanized demo quietly.
          setOutcome({ guildId: String(guildId), status: "failed", roles: null });
          setAutoRoleId(DEMO_ROLE_ID);
          setAutoRoleDelay(0);
        }
        console.warn(
          "[AutoRolesSettings] Failed to load auto-role settings — showing demo data:",
          failure
        );
        return;
      }

      setOutcome({ guildId: String(guildId), status: "real", roles });
      setAutoRoleId(settings.autoRoleId);
      setAutoRoleDelay(settings.autoRoleDelay);
    },
    [guildId]
  );

  useEffect(() => {
    loadAutoRoles();
    return () => {
      // Invalidate in-flight loads so a previous guild's response can't clobber state.
      requestSeq.current += 1;
    };
  }, [loadAutoRoles]);

  /* Derived view model — guest mode keeps the exact demo values. */
  const current = outcome && outcome.guildId === String(guildId) ? outcome : null;
  const mode = !guildId ? "demo" : current ? current.status : "loading";
  const live = mode === "real";
  const unavailable = mode === "unavailable";
  const loading = mode === "loading";
  /* The humanized demo is only rendered for guests and for a failed load. */
  const demoPanel = mode === "demo" || mode === "failed";
  const activeRoleId = loading || unavailable ? "" : autoRoleId;
  const activeDelay = loading || unavailable ? 0 : autoRoleDelay;
  const roleList = live ? (current?.roles || []) : SAMPLE_ROLES;
  const selectedRole = roleList.find((r) => r.id === activeRoleId) || null;
  const filteredRoles = roleList.filter((r) =>
    r.name.toLowerCase().includes(roleSearch.toLowerCase())
  );

  /* The guest demo keeps its original 0–300s range; the live panel matches the bot. */
  const maxDelay = live ? MAX_DELAY : DEMO_MAX_DELAY;
  const delayPct = Math.max(0, Math.min(100, (activeDelay / maxDelay) * 100));
  /* Coarse steps once the delay grows, so the ± buttons stay usable over 24h. */
  const stepSize = live
    ? activeDelay >= 3600
      ? 300
      : activeDelay >= 600
        ? 60
        : activeDelay >= 60
          ? 15
          : 5
    : 5;

  const statusText = loading
    ? "Loading…"
    : unavailable
      ? "Unavailable"
      : activeRoleId
        ? "Active"
        : "Inactive";
  const statusTone =
    loading || unavailable ? "chip-amber" : activeRoleId ? "chip-green" : "chip-amber";
  const delayChipText = loading
    ? "Loading…"
    : unavailable
      ? "Unavailable"
      : `${activeDelay}s delay`;
  const delayValueText = live || (!loading && !unavailable) ? `${activeDelay}s` : "—";

  const saveDisabled = saving || unavailable || loading;
  const saveTooltip = unavailable
    ? "Auto-role settings aren't available for this server yet"
    : loading
      ? "Loading auto-role settings…"
      : "Saving auto-role settings…";

  const handleSave = async () => {
    if (!guildId) {
      // Guest demo: there is no server to persist to.
      showToast("Auto role settings saved");
      return;
    }
    if (unavailable) {
      showToast("Auto-role settings aren't available for this server", "error");
      return;
    }
    if (!live) {
      showToast("Couldn't load live settings — nothing was saved", "error");
      return;
    }
    try {
      setSaving(true);
      /* The API stores seconds and wants null (never "") to clear the role. */
      const roleId = SNOWFLAKE.test(activeRoleId) ? activeRoleId : null;
      const res = await fetch(`/api/guilds/${guildId}/auto-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoRoleId: roleId,
          autoRoleDelay: activeDelay,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error || "Failed to save auto-role settings", "error");
        return;
      }
      /* Re-read the route so only values the server actually stored are rendered. */
      await loadAutoRoles({ silent: true });
      showToast("Auto role settings saved");
    } catch (err) {
      console.warn("[AutoRolesSettings] Failed to save auto-role settings:", err);
      showToast("Network error while saving auto-role settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="glass-dropdown fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold"
          >
            {toast.kind === "error" ? (
              <AlertTriangle className="h-4 w-4 text-[#FBBF24]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            )}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-violet">
            <UserPlus className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[15px]">Auto Roles</h2>
            <p className="card-sub mt-0.5">
              Automatically assign a role to every new member when they join{" "}
              {demoPanel ? "Crystal Realm" : "this server"}.
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="btn-primary"
          disabled={saveDisabled || undefined}
          title={saveDisabled ? saveTooltip : undefined}
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left: the auto-role rule */}
        <div className="space-y-5">
          <motion.section variants={rise} className="glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="icon-tile icon-tile-blue h-9 w-9 rounded-[12px]">
                  <Shield className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="card-title">Auto-Role Rule</h3>
                  <p className="card-sub mt-0.5">Role granted on join, and how long Aura waits</p>
                </div>
              </div>
              <span
                className="toggle-track toggle-track-on cursor-not-allowed opacity-80"
                title="Auto-role assignment is always on for this server — it is managed from the bot"
                aria-hidden="true"
              >
                <span className="toggle-thumb" />
              </span>
            </div>

            {unavailable ? (
              <div className="empty-state mt-5">
                <span className="empty-state-icon">
                  <Shield className="h-4 w-4" />
                </span>
                <span className="empty-state-title">Auto-roles aren't available here</span>
                <span className="text-[11px]">
                  This server doesn't expose the auto-role settings API yet, so no role and no
                  delay were loaded.
                </span>
              </div>
            ) : loading ? (
              <div className="empty-state mt-5">
                <span className="empty-state-icon">
                  <Clock className="h-4 w-4" />
                </span>
                <span className="empty-state-title">Loading auto-role settings</span>
                <span className="text-[11px]">Fetching this server's roles and join rule…</span>
              </div>
            ) : (
              <>
                <div className="mt-5">
                  <span className="section-label mb-1.5 block">Rule status</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`chip ${statusTone}`}>{statusText}</span>
                    {selectedRole ? (
                      <span className="chip">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: roleColor(selectedRole) }}
                        />
                        {selectedRole.name}
                      </span>
                    ) : activeRoleId ? (
                      <span
                        className="chip chip-amber"
                        title="The configured role is no longer available in this server"
                      >
                        Role unavailable
                      </span>
                    ) : (
                      <span className="chip chip-amber">No role selected</span>
                    )}
                    <span className="chip chip-violet tabular-nums">{delayChipText}</span>
                  </div>
                </div>

                <label htmlFor="auto-role-search" className="mt-5 block">
                  <span className="section-label mb-1.5 block">Search role</span>
                  <input
                    id="auto-role-search"
                    type="text"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder="Type to filter roles..."
                    className="glass-input"
                  />
                </label>

                <div className="mt-4">
                  <span className="section-label mb-1.5 block">Select auto role</span>
                  {roleList.length === 0 ? (
                    <div className="empty-state mt-1 py-5">
                      <span className="empty-state-icon">
                        <Shield className="h-4 w-4" />
                      </span>
                      <span className="empty-state-title">No roles available</span>
                      <span className="text-[11px]">
                        This server has no role Aura can hand out on join.
                      </span>
                    </div>
                  ) : (
                    <div className="custom-scrollbar mt-1 max-h-48 space-y-1 overflow-y-auto pr-1">
                      {filteredRoles.length === 0 && (
                        <p className="px-1 py-3 text-[11px] text-slate-500">
                          No roles match “{roleSearch}”.
                        </p>
                      )}
                      {filteredRoles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setAutoRoleId(role.id)}
                          disabled={role.managed || undefined}
                          title={
                            role.managed
                              ? "Managed roles are assigned by Discord integrations and can't be set by Aura"
                              : undefined
                          }
                          className={`list-row w-full gap-3 px-3 py-2.5 text-left ${
                            activeRoleId === role.id
                              ? "border-[#7C5CFF]/40 bg-[#7C5CFF]/10"
                              : ""
                          }`}
                        >
                          <span
                            className="h-3 w-3 shrink-0 rounded-full border-2"
                            style={{
                              borderColor: roleColor(role),
                              backgroundColor: `${roleColor(role)}33`,
                            }}
                          />
                          <span className="truncate text-xs font-bold text-white">{role.name}</span>
                          {role.managed && <span className="chip chip-amber shrink-0">Managed</span>}
                          {activeRoleId === role.id && (
                            <span className="ml-auto shrink-0 chip chip-violet">Selected</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label htmlFor="auto-role-delay" className="section-label">
                      Assignment delay (seconds)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAutoRoleDelay(Math.max(0, activeDelay - stepSize))}
                        title="Shorten the delay"
                        aria-label="Shorten the delay"
                        className="btn-icon h-7 w-7 rounded-[9px]"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="chip chip-violet tabular-nums">{activeDelay}s</span>
                      <button
                        type="button"
                        onClick={() => setAutoRoleDelay(Math.min(maxDelay, activeDelay + stepSize))}
                        title="Lengthen the delay"
                        aria-label="Lengthen the delay"
                        className="btn-icon h-7 w-7 rounded-[9px]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="progress-track mt-3">
                    <div className="progress-fill" style={{ width: `${delayPct}%` }} />
                  </div>
                  <input
                    id="auto-role-delay"
                    type="range"
                    min={0}
                    max={maxDelay}
                    value={activeDelay}
                    onChange={(e) => setAutoRoleDelay(Number(e.target.value))}
                    className="mt-3 w-full cursor-pointer accent-[#7C5CFF]"
                  />
                  <p className="mt-2 text-[10px] text-slate-600">
                    Delay before the role is assigned. Set to 0 for instant assignment.
                  </p>
                </div>
              </>
            )}
          </motion.section>

          <motion.section variants={rise} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile-cyan h-9 w-9 rounded-[12px]">
                <Clock className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">What happens when a member joins?</h3>
                <p className="card-sub mt-0.5">The three steps Aura runs on every join</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="list-row items-start gap-3 px-3 py-2.5">
                <span className="chip chip-violet shrink-0">1</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">
                    A new member joins {demoPanel ? "Crystal Realm" : "the server"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Aura receives the guildMemberAdd event
                  </p>
                </div>
              </div>
              <div className="list-row items-start gap-3 px-3 py-2.5">
                <span className="chip chip-violet shrink-0">2</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">Wait {activeDelay} seconds</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Configurable delay so other automations can run first
                  </p>
                </div>
              </div>
              <div className="list-row items-start gap-3 px-3 py-2.5">
                <span className="chip chip-violet shrink-0">3</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">
                    Role{" "}
                    <span style={{ color: selectedRole ? roleColor(selectedRole) : undefined }}>
                      {selectedRole?.name || "Not selected"}
                    </span>{" "}
                    assigned
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Applied automatically — no staff action needed
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Right: info */}
        <div className="space-y-5">
          <motion.section variants={rise} className="glass-card p-5">
            <h3 className="card-title">Current Configuration</h3>

            <div className="mt-4 space-y-1.5">
              <div className="list-row justify-between gap-3 px-3 py-2.5">
                <span className="text-xs text-slate-400">Auto role</span>
                {selectedRole ? (
                  <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-white">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: roleColor(selectedRole) }}
                    />
                    <span className="truncate">{selectedRole.name}</span>
                  </span>
                ) : (
                  <span className="font-mono text-xs text-[#FBBF24]">Not configured</span>
                )}
              </div>
              <div className="list-row justify-between gap-3 px-3 py-2.5">
                <span className="text-xs text-slate-400">Delay</span>
                <span className="font-mono text-xs font-bold text-white tabular-nums">
                  {delayValueText}
                </span>
              </div>
              <div className="list-row justify-between gap-3 px-3 py-2.5">
                <span className="text-xs text-slate-400">Assigned this week</span>
                {demoPanel ? (
                  <span className="text-xs font-bold text-white">342 members</span>
                ) : (
                  <span
                    className="text-xs font-bold text-white"
                    title="Aura does not collect per-week auto-role assignment stats yet"
                  >
                    —
                  </span>
                )}
              </div>
              <div className="list-row justify-between gap-3 px-3 py-2.5">
                <span className="text-xs text-slate-400">Status</span>
                <span className={`chip ${statusTone}`}>{statusText}</span>
              </div>
            </div>
          </motion.section>

          <motion.section variants={rise} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile-amber h-9 w-9 rounded-[12px]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Pro Tips</h3>
                <p className="card-sub mt-0.5">Getting the most out of auto roles</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5">
              {[
                "Keep the Aura role above the auto role in the server hierarchy, or Discord will reject the assignment.",
                "Use a 5–10 second delay if a verification gate needs to complete first.",
                "Pair auto roles with reaction roles so members can self-assign extra roles.",
                "Stack multiple auto-role automations in the Modules Hub to cover event and partner communities.",
              ].map((tip, i) => (
                <li key={i} className="list-row items-start gap-2.5 px-3 py-2.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#7C5CFF]/60" />
                  <span className="text-xs leading-relaxed text-slate-400">{tip}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
