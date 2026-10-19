"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, Ban, UserX, Clock, AlertTriangle, Search } from "lucide-react";

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
    { label: "Total bans", value: cases.filter((c) => c.type === "ban").length, note: "all time", color: "#FF5C7A", icon: Ban },
    { label: "Active mutes", value: cases.filter((c) => c.type === "timeout" && c.active).length, note: "right now", color: "#5B8CFF", icon: Clock },
    { label: "Kicks (30d)", value: cases.filter((c) => c.type === "kick" && c.minutesAgo <= 30 * 24 * 60).length, note: "last 30 days", color: "#58BFC5", icon: UserX },
    { label: "Active warnings", value: cases.filter((c) => c.type === "warn" && c.active).length, note: "under review", color: "#FFB547", icon: AlertTriangle },
  ];
}

/* Demo stat cards — fallback only, kept in sync with DEMO_ACTIONS. */
const DEMO_STATS = [
  { label: "Total bans", value: 186, note: "all time", color: "#FF5C7A", icon: Ban },
  { label: "Active mutes", value: 4, note: "right now", color: "#5B8CFF", icon: Clock },
  { label: "Kicks (30d)", value: 32, note: "last 30 days", color: "#58BFC5", icon: UserX },
  { label: "Active warnings", value: 17, note: "under review", color: "#FFB547", icon: AlertTriangle },
];

function StatCard({ s, index }) {
  const count = useCountUp(s.value, { duration: 700 + index * 90 });
  const Icon = s.icon;

  return (
    <motion.div variants={rise} className="panel panel-hover p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="section-label">{s.label}</span>
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: s.color }} />
      </div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-white tabular-nums">
        {Math.round(count).toLocaleString("en-US")}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">{s.note}</div>
    </motion.div>
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

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Header */}
      <motion.div variants={rise}>
        <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
            <Shield className="h-4 w-4" />
          </span>
          Moderation
        </h2>
        <p className="mt-1.5 font-body text-xs text-slate-500">
          Recent actions, quick bans, and server safety tools for Crystal Realm.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={rise} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s, i) => (
          <StatCard key={s.label} s={s} index={i} />
        ))}
      </motion.div>

      {/* Action log */}
      <motion.div variants={rise} className="panel divide-y divide-white/[0.04] overflow-hidden">
        <div className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, moderator, or reason..."
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C5CFF]/50 transition-colors"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <ShieldCheck className="h-7 w-7 text-slate-700" />
            <p className="text-sm font-bold text-slate-400">No matching actions</p>
            <p className="text-[11px] text-slate-600">Try a different user, moderator, or reason.</p>
          </div>
        ) : (
          filtered.map((a) => {
            const cfg = ACTION_CONFIG[a.action] || ACTION_CONFIG.Warn;
            const Icon = cfg.icon;
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${cfg.color}1A`, color: cfg.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
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
              </div>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}
