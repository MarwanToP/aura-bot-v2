"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield, ShieldCheck, Ban, UserX, Clock, AlertTriangle, Search, SlidersHorizontal, Inbox
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

/* Count-up hook (respects reduced motion) */
function useCountUp(target, { duration = 1100 } = {}) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVal(target);
      return;
    }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}

/* ────────────────────────────── data ────────────────────────────── */

function timeAgo(minutes) {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m ago`;
  const h = minutes / 60;
  if (h < 24) return `${h < 10 ? h.toFixed(1) : Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/* Demo rows — used only when the cases API is unreachable or guildId is missing. */
const DEMO_ACTIONS = [
  { id: 1, action: "Ban", user: "ByteNomad", mod: "Aurora", reason: "Raid participation across 3 channels", time: "2h ago" },
  { id: 2, action: "Kick", user: "MiraGlow", mod: "Kai", reason: "Repeated spam in #general", time: "5h ago" },
  { id: 3, action: "Mute", user: "EchoVortex", mod: "Kai", reason: "Mic spam during community game night", time: "1d ago" },
  { id: 4, action: "Warn", user: "LunaByte", mod: "Aurora", reason: "Self-promotion in #announcements", time: "2d ago" },
];

const ACTION_CONFIG = {
  Ban: { icon: Ban, color: "#FF5C7A" },
  Kick: { icon: UserX, color: "#58BFC5" },
  Mute: { icon: Clock, color: "#5B8CFF" },
  Warn: { icon: AlertTriangle, color: "#FFB547" },
  Timeout: { icon: Clock, color: "#5B8CFF" },
  "Timeout Removed": { icon: Clock, color: "#39D98A" },
  Unban: { icon: ShieldCheck, color: "#39D98A" },
  Softban: { icon: Ban, color: "#FF5C7A" },
  Note: { icon: ShieldCheck, color: "#8B93A7" },
};

/* Severity is derived from the action type — no extra data required. */
const SEVERITY = {
  Ban: { label: "Critical", cls: "chip chip-red" },
  Softban: { label: "Critical", cls: "chip chip-red" },
  Kick: { label: "High", cls: "chip chip-amber" },
  Mute: { label: "High", cls: "chip chip-amber" },
  Timeout: { label: "High", cls: "chip chip-amber" },
  Warn: { label: "Medium", cls: "chip chip-blue" },
  Note: { label: "Low", cls: "chip chip-cyan" },
  Unban: { label: "Low", cls: "chip chip-green" },
  "Timeout Removed": { label: "Low", cls: "chip chip-green" },
};

/* API case type (ModerationCase.type) → recent-action label. */
const TYPE_LABELS = {
  warn: "Warn",
  kick: "Kick",
  ban: "Ban",
  unban: "Unban",
  timeout: "Timeout",
  timeout_remove: "Timeout Removed",
  softban: "Softban",
  note: "Note",
};

/* Map an API case row (ModerationCase) into the recent-action row shape. */
function normalizeAction(c) {
  const t = c.createdAt ? new Date(c.createdAt).getTime() : NaN;
  const created = Number.isFinite(t) ? t : Date.now();
  const minutesAgo = Math.max(0, (Date.now() - created) / 60000);
  return {
    id: c.id ?? c.caseId,
    action: TYPE_LABELS[c.type] || "Warn",
    user: String(c.userId ?? "Unknown"),
    mod: String(c.moderatorId ?? "Unknown"),
    reason: c.reason || "No reason provided",
    time: timeAgo(minutesAgo),
    minutesAgo,
    type: c.type,
    active: c.active !== false,
  };
}

/* Stat cards derived from the same cases payload. */
function deriveStats(cases) {
  return [
    { label: "Total bans", value: cases.filter((c) => c.type === "ban").length, note: "all time", color: "#FF5C7A", icon: Ban, tone: "red" },
    { label: "Active mutes", value: cases.filter((c) => c.type === "timeout" && c.active).length, note: "right now", color: "#5B8CFF", icon: Clock, tone: "blue" },
    { label: "Kicks (30d)", value: cases.filter((c) => c.type === "kick" && c.minutesAgo <= 30 * 24 * 60).length, note: "last 30 days", color: "#58BFC5", icon: UserX, tone: "cyan" },
    { label: "Active warnings", value: cases.filter((c) => c.type === "warn" && c.active).length, note: "under review", color: "#FFB547", icon: AlertTriangle, tone: "amber" },
  ];
}

/* Demo stat cards — fallback only, kept in sync with DEMO_ACTIONS. */
const DEMO_STATS = [
  { label: "Total bans", value: 186, note: "all time", color: "#FF5C7A", icon: Ban, tone: "red" },
  { label: "Active mutes", value: 4, note: "right now", color: "#5B8CFF", icon: Clock, tone: "blue" },
  { label: "Kicks (30d)", value: 32, note: "last 30 days", color: "#58BFC5", icon: UserX, tone: "cyan" },
  { label: "Active warnings", value: 17, note: "under review", color: "#FFB547", icon: AlertTriangle, tone: "amber" },
];

function StatCard({ s, index }) {
  const count = useCountUp(s.value, { duration: 700 + index * 90 });
  const Icon = s.icon;

  return (
    <motion.div variants={rise} className="kpi-tile flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-3">
        <span className="kpi-label">{s.label}</span>
        <span className={`icon-tile icon-tile-${s.tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <div className="kpi-value tabular-nums">{Math.round(count).toLocaleString("en-US")}</div>
        <div className="mt-1.5 text-[11px] font-semibold text-slate-500">{s.note}</div>
      </div>
    </motion.div>
  );
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Icon className="h-5 w-5" />
      </span>
      <p className="empty-state-title">{title}</p>
      {body ? <p className="max-w-md text-[11px] text-slate-500">{body}</p> : null}
    </div>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function ModerationPanel({ guildId }) {
  const [search, setSearch] = useState("");
  const [cases, setCases] = useState(null); // null → demo fallback

  // Load real moderation cases; keep demo rows as fallback when unavailable.
  useEffect(() => {
    if (!guildId) {
      setCases(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/guilds/${guildId}/cases`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setCases(Array.isArray(data) ? data.map(normalizeAction) : null);
      } catch (err) {
        console.error("[ModerationPanel] Failed to load moderation cases:", err);
        if (!cancelled) setCases(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  const statCards = cases ? deriveStats(cases) : DEMO_STATS;

  const filtered = (cases ?? DEMO_ACTIONS).filter(
    (a) =>
      a.user.toLowerCase().includes(search.toLowerCase()) ||
      a.mod.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase())
  );

  /* Case actions have no route behind them yet — the controls stay disabled and say so. */
  const readOnlyHint = "Not manageable from the dashboard yet";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="section-label">Moderation</span>
          <h2 className="card-title mt-1.5 flex items-center gap-2.5 text-lg">
            <span className="icon-tile icon-tile-red h-9 w-9">
              <Shield className="h-4 w-4" />
            </span>
            Moderation
          </h2>
          <p className="card-sub mt-1.5 max-w-2xl">
            Recent actions, quick bans, and server safety tools for Crystal Realm.
          </p>
        </div>
        <button
          type="button"
          disabled
          title={readOnlyHint}
          className="btn-glass px-3.5 py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Case rules
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={rise} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s, i) => (
          <StatCard key={s.label} s={s} index={i} />
        ))}
      </motion.div>

      {/* Action log */}
      <motion.div variants={rise} className="glass-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div>
            <span className="section-label">Case Log</span>
            <h3 className="card-title mt-1">Recent Actions</h3>
          </div>
          <span className="chip chip-blue">{filtered.length} shown</span>
        </div>

        <div className="px-4 pb-3.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, moderator, or reason..."
              className="glass-input py-2 pl-9 pr-3 text-xs"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 pb-4">
            <EmptyState
              icon={Inbox}
              title="No matching actions"
              body="Try a different user, moderator, or reason."
            />
          </div>
        ) : (
          <div className="px-2 pb-2">
            {filtered.map((a, i) => {
              const cfg = ACTION_CONFIG[a.action] || ACTION_CONFIG.Warn;
              const Icon = cfg.icon;
              const severity = SEVERITY[a.action] || SEVERITY.Warn;
              return (
                <React.Fragment key={a.id}>
                  {i > 0 && <div className="hairline" />}
                  <div className="flex flex-wrap items-center gap-3 px-2 py-3 transition-colors hover:bg-white/[0.03]">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${cfg.color}1A`, color: cfg.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className={`${severity.cls} shrink-0 uppercase tracking-wider`}>{severity.label}</span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-xs font-bold" style={{ color: cfg.color }}>
                          {a.action}
                        </span>
                        <span className="text-xs font-bold text-white">{a.user}</span>
                        <span className="text-[10px] text-slate-500">by {a.mod}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">{a.reason}</p>
                    </div>

                    <span className="shrink-0 font-mono text-[10px] text-slate-600">{a.time}</span>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        disabled
                        title={readOnlyHint}
                        className="btn-glass px-2.5 py-1 text-[10px] font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        disabled
                        title={readOnlyHint}
                        className="btn-danger px-2.5 py-1 text-[10px] font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
