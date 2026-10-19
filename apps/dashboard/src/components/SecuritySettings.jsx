"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Bot,
  UserX,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Save,
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

/* ────────────────────────────── shared styles ────────────────────────────── */

const numberCls =
  "glass-input w-20 px-2 py-1.5 text-center font-mono text-xs text-white";

const rowCls =
  "flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3";

/* Verification modes accepted by the API (web | button | captcha). */
const MODE_LABELS = { web: "Web", button: "Button", captcha: "Captcha" };

/* Anti-nuke actions accepted by the API. */
const ACTION_LABELS = {
  quarantine: "quarantine",
  ban: "ban",
  kick: "kick",
  lockdown: "lockdown",
};

function toInt(raw, fallback = 0) {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      aria-label={enabled ? "Disable" : "Enable"}
      className={`toggle-track ${enabled ? "toggle-track-on" : ""}`}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

export default function SecuritySettings({ guildId }) {
  const [antiNuke, setAntiNuke] = useState(true);
  const [captchaGate, setCaptchaGate] = useState(true);
  const [minAccountAge, setMinAccountAge] = useState(7);
  const [antiBotJoin, setAntiBotJoin] = useState(true);
  const [massBanLimit, setMassBanLimit] = useState(5);
  const [massRoleDeleteLimit, setMassRoleDeleteLimit] = useState(3);
  const [quarantineRole, setQuarantineRole] = useState("@Quarantine");
  const [toast, setToast] = useState(null);

  /* real state — mirrors of the columns the dashboard API exposes */
  const [live, setLive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [unverifiedRoleId, setUnverifiedRoleId] = useState("");
  const [verificationMode, setVerificationMode] = useState("web");
  const [verificationRoleId, setVerificationRoleId] = useState("");
  const [antiNukeExtras, setAntiNukeExtras] = useState({
    maxChannelDeletions: 2,
    maxKicks: 3,
    action: "quarantine",
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  /* request guard — only the latest load may write state */
  const requestSeq = useRef(0);

  const loadSecurity = useCallback(async () => {
    const requestId = ++requestSeq.current;
    if (!guildId) {
      setLive(false);
      setRoles([]);
      return;
    }
    try {
      const [securityRes, verificationRes, rolesRes] = await Promise.allSettled([
        fetch(`/api/guilds/${guildId}/security`),
        fetch(`/api/guilds/${guildId}/verification`),
        fetch(`/api/guilds/${guildId}/roles`),
      ]);

      if (requestId !== requestSeq.current) return; // stale response from a previous guild

      /* One warning per load cycle, listing exactly which read failed. */
      const failures = [];
      let firstError = null;
      const failure = (label, res) => {
        failures.push(label);
        if (!firstError) {
          firstError =
            res.status === "rejected" ? res.reason : new Error(`HTTP ${res.value?.status}`);
        }
      };

      if (securityRes.status === "fulfilled" && securityRes.value.ok) {
        const data = await securityRes.value.json();
        if (requestId !== requestSeq.current) return;
        const cfg = data?.antiNukeConfig && typeof data.antiNukeConfig === "object" ? data.antiNukeConfig : {};
        setAntiNuke(data?.antiNukeEnabled === true);
        setMassBanLimit(toInt(cfg.maxBans, 0));
        setMassRoleDeleteLimit(toInt(cfg.maxRoleDeletions, 0));
        setAntiNukeExtras({
          maxChannelDeletions: toInt(cfg.maxChannelDeletions, 0),
          maxKicks: toInt(cfg.maxKicks, 0),
          action: ACTION_LABELS[cfg.action] ? cfg.action : "quarantine",
        });
        setAntiBotJoin(data?.antiRaidEnabled === true);
        setCaptchaGate(data?.verificationEnabled === true);
        setVerificationMode(MODE_LABELS[data?.verificationMode] ? data.verificationMode : "web");
        setVerificationRoleId(typeof data?.verificationRoleId === "string" ? data.verificationRoleId : "");
        setUnverifiedRoleId(typeof data?.unverifiedRoleId === "string" ? data.unverifiedRoleId : "");
        setLive(true);
      } else {
        failure("security settings", securityRes);
        setLive(false);
      }

      /* Minimum account age lives on the verification route (altAgeLimit). */
      if (verificationRes.status === "fulfilled" && verificationRes.value.ok) {
        const data = await verificationRes.value.json();
        if (requestId !== requestSeq.current) return;
        setMinAccountAge(toInt(data?.altAgeLimit, 7));
      } else {
        failure("the account-age limit", verificationRes);
      }

      if (rolesRes.status === "fulfilled" && rolesRes.value.ok) {
        const data = await rolesRes.value.json();
        if (requestId !== requestSeq.current) return;
        const list = Array.isArray(data?.roles) ? data.roles : [];
        setRoles(
          list
            .filter((role) => role && role.id)
            .map((role) => ({ id: String(role.id), name: String(role.name || role.id) }))
        );
      } else {
        failure("guild roles", rolesRes);
      }

      if (failures.length > 0) {
        console.warn(
          `[SecuritySettings] Failed to load ${failures.join(", ")} — showing demo data:`,
          firstError
        );
      }
    } catch (err) {
      if (requestId !== requestSeq.current) return;
      console.warn("[SecuritySettings] Failed to load security settings — showing demo data:", err);
      setLive(false);
    }
  }, [guildId]);

  useEffect(() => {
    loadSecurity();
    return () => {
      // Invalidate in-flight loads so a previous guild's response can't clobber state.
      requestSeq.current += 1;
    };
  }, [loadSecurity]);

  const modeLabel = MODE_LABELS[verificationMode] || "Web";
  const actionLabel = ACTION_LABELS[antiNukeExtras.action] || "quarantine";
  const shieldActive = live ? antiNuke || antiBotJoin : true;

  /* Real roles + a placeholder for a role id that no longer exists. */
  const roleOptions = useMemo(() => {
    const known = new Set(roles.map((r) => r.id));
    const extras =
      live && unverifiedRoleId && !known.has(unverifiedRoleId)
        ? [{ id: unverifiedRoleId, name: "Unknown role" }]
        : [];
    return [...roles, ...extras];
  }, [roles, unverifiedRoleId, live]);

  const saveSecurity = async () => {
    /* Guest demo: nothing is persisted anywhere, so keep the original local feedback. */
    if (!guildId) {
      showToast("Security settings saved — Crystal Realm is protected");
      return;
    }
    if (!live) {
      // No truthful config to write yet — never persist demo values over real settings.
      showToast("Couldn't load live settings — nothing was saved");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/security`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          antiNukeEnabled: antiNuke,
          antiNukeConfig: {
            maxChannelDeletions: antiNukeExtras.maxChannelDeletions,
            maxRoleDeletions: massRoleDeleteLimit,
            maxBans: massBanLimit,
            maxKicks: antiNukeExtras.maxKicks,
            action: antiNukeExtras.action,
          },
          antiRaidEnabled: antiBotJoin,
          verificationEnabled: captchaGate,
          verificationMode,
          verificationRoleId,
          unverifiedRoleId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Failed to save security settings");
        return;
      }

      /* The minimum account age is stored on the verification route. */
      const resVerification = await fetch(`/api/guilds/${guildId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altAgeLimit: minAccountAge }),
      });
      const verificationData = await resVerification.json().catch(() => ({}));
      if (!resVerification.ok) {
        showToast(verificationData.error || "Failed to save security settings");
        return;
      }

      showToast("Security settings saved — your server's protection is up to date");
      await loadSecurity();
    } catch (err) {
      console.warn("[SecuritySettings] Failed to save security settings:", err);
      showToast("Network error while saving security settings");
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
            className="glass-dropdown pointer-events-none fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-white"
          >
            <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="icon-tile icon-tile-green h-9 w-9 rounded-xl">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title">Security Shield &amp; Anti-Nuke Control</h2>
            <p className="card-sub mt-0.5">
              {live
                ? "Enterprise defense for your server — mass deletions, raids, and rogue admin actions."
                : "Enterprise defense for Crystal Realm — unauthorized bot invites, mass deletions, raids, and rogue admin actions."}
            </p>
          </div>
        </div>
        {live ? (
          <span className={`chip ${shieldActive ? "chip-green" : "chip-amber"}`}>
            <span
              className={`status-dot ${shieldActive ? "status-dot-online animate-pulse-dot" : "status-dot-idle"}`}
            />
            {shieldActive ? "Shield active" : "Shield paused"}
          </span>
        ) : (
          <span className="chip chip-green">
            <span className="status-dot status-dot-online animate-pulse-dot" />
            Shield active
          </span>
        )}
      </motion.div>

      {/* Main settings grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Anti-Nuke & mass action protection */}
        <motion.section variants={rise} className="glass-card glass-card-hover p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="icon-tile icon-tile-red h-9 w-9 rounded-xl">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Anti-Nuke Protection</h3>
                <p className="card-sub mt-0.5">
                  Automatically bans admins who attempt mass destruction.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Toggle enabled={antiNuke} onChange={(v) => setAntiNuke(v)} />
              <span className={`chip ${antiNuke ? "chip-green" : "chip-amber"}`}>
                {antiNuke ? "Protected" : "Paused"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 text-xs font-medium">
            <div className={rowCls}>
              <label htmlFor="mass-ban-limit" className="text-slate-300">
                Mass ban threshold <span className="text-slate-600">(per 10 sec)</span>
              </label>
              <input
                id="mass-ban-limit"
                name="massBanLimit"
                type="number"
                min="1"
                value={massBanLimit}
                onChange={(e) => setMassBanLimit(toInt(e.target.value, 0))}
                className={numberCls}
              />
            </div>

            <div className={rowCls}>
              <label htmlFor="mass-role-limit" className="text-slate-300">
                Mass role delete limit
              </label>
              <input
                id="mass-role-limit"
                name="massRoleDeleteLimit"
                type="number"
                min="1"
                value={massRoleDeleteLimit}
                onChange={(e) => setMassRoleDeleteLimit(toInt(e.target.value, 0))}
                className={numberCls}
              />
            </div>

            <div className={rowCls}>
              <span className="flex items-center gap-2 text-slate-300">
                <Bot className="h-3.5 w-3.5 shrink-0 text-[#F87171]" />
                {live ? "Anti-raid protection" : "Block unauthorized bot additions"}
                <span className={`chip ${antiBotJoin ? "chip-green" : "chip-amber"}`}>
                  {live ? (antiBotJoin ? "On" : "Off") : antiBotJoin ? "Blocking" : "Allowed"}
                </span>
              </span>
              <Toggle enabled={antiBotJoin} onChange={(v) => setAntiBotJoin(v)} />
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#FBBF24]/25 bg-[#FBBF24]/[0.07] p-3 text-[11px] leading-relaxed text-[#FCD34D]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FBBF24]" />
            <span>
              {live
                ? `Violations trigger the configured anti-nuke action: ${actionLabel}.`
                : "Violations quarantine the offender instantly and alert the @Admin Council in #mod-logs."}
            </span>
          </div>
        </motion.section>

        {/* Captcha verification gate */}
        <motion.section variants={rise} className="glass-card glass-card-hover p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="icon-tile icon-tile-blue h-9 w-9 rounded-xl">
                <Key className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">{live ? "Verification Gate" : "Captcha Verification Gate"}</h3>
                <p className="card-sub mt-0.5">
                  {live
                    ? `Require members to pass the ${modeLabel.toLowerCase()} gate before unlocking channels.`
                    : "Require a web or button captcha before unlocking channels."}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Toggle enabled={captchaGate} onChange={(v) => setCaptchaGate(v)} />
              <span className={`chip ${captchaGate ? "chip-green" : "chip-amber"}`}>
                {captchaGate ? "Enforced" : "Off"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 text-xs font-medium">
            <div className={rowCls}>
              <label
                htmlFor="min-account-age"
                className="flex items-center gap-2 text-slate-300"
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-[#4C7DFF]" />
                Minimum account age (days)
                <span className="chip chip-blue">{minAccountAge}d</span>
              </label>
              <input
                id="min-account-age"
                name="minAccountAge"
                type="number"
                min="0"
                value={minAccountAge}
                onChange={(e) => setMinAccountAge(toInt(e.target.value, 0))}
                className={numberCls}
              />
            </div>

            <div className={rowCls}>
              <label
                htmlFor="quarantine-role"
                className="flex items-center gap-2 text-slate-300"
              >
                <UserX className="h-3.5 w-3.5 shrink-0 text-[#4C7DFF]" />
                {live ? "Unverified role" : "Quarantine role name"}
              </label>
              {live ? (
                <div className="w-40">
                  <select
                    id="quarantine-role"
                    name="quarantineRole"
                    className="glass-select px-2.5 py-1.5 text-xs"
                    value={unverifiedRoleId}
                    onChange={(e) => setUnverifiedRoleId(e.target.value)}
                    disabled={roleOptions.length === 0}
                    title={
                      roleOptions.length === 0
                        ? "No roles could be loaded for this server"
                        : "Role given to members who have not passed verification"
                    }
                  >
                    <option value="">—</option>
                    {roleOptions.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  id="quarantine-role"
                  name="quarantineRole"
                  type="text"
                  value={quarantineRole}
                  onChange={(e) => setQuarantineRole(e.target.value)}
                  className="glass-input w-32 px-2.5 py-1.5 font-mono text-xs text-[#C4B5FD]"
                />
              )}
            </div>
          </div>

          <p className="mt-3 text-[10px] text-slate-500">
            {live
              ? "New joiners stay locked until they pass the verification gate. The verification mode is configured in the Verification tab."
              : "New joiners stay locked until they pass the gate in #support-desk."}
          </p>
        </motion.section>
      </div>

      {/* Action footer */}
      <motion.div variants={rise} className="flex justify-end border-t border-white/[0.06] pt-4">
        <button
          type="button"
          onClick={saveSecurity}
          disabled={live && saving}
          className="btn-primary"
        >
          <Save className="h-3.5 w-3.5" />
          {live && saving ? "Saving…" : "Save Security Settings"}
        </button>
      </motion.div>
    </motion.div>
  );
}
