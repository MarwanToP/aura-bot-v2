"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Filter,
  AlertTriangle,
  Ban,
  UserX,
  Clock,
  ChevronLeft,
  ChevronRight,
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

/* ────────────────────────────── helpers ────────────────────────────── */

function timeAgo(minutes) {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m ago`;
  const h = minutes / 60;
  if (h < 24) return `${h < 10 ? h.toFixed(1) : Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/* ────────────────────────────── demo fallback data ────────────────────────────── */

/* Demo rows — used only when the cases API is unreachable or guildId is missing. */
const DEMO_CASES = [
  { caseId: 1042, type: "warn", user: "NovaStar", moderator: "Aurora", reason: "Spamming in #general", minutesAgo: 120, active: true },
  { caseId: 1041, type: "timeout", user: "pixelForge", moderator: "Aurora", reason: "Inappropriate language after a warning", minutesAgo: 300, active: true, duration: "1h" },
  { caseId: 1040, type: "kick", user: "ByteNomad", moderator: "Kai", reason: "Repeated violations of rule #3", minutesAgo: 1440, active: false },
  { caseId: 1039, type: "ban", user: "EchoVortex", moderator: "Kai", reason: "Raid participation — mass mention", minutesAgo: 2880, active: true },
  { caseId: 1038, type: "warn", user: "CodeWraith", moderator: "Aurora", reason: "Self-promotion in chat", minutesAgo: 4320, active: false },
  { caseId: 1037, type: "timeout", user: "LunaByte", moderator: "Kai", reason: "Excessive caps lock after a reminder", minutesAgo: 5760, active: false, duration: "10m" },
  { caseId: 1036, type: "warn", user: "MiraGlow", moderator: "Aurora", reason: "Unsolicited invite link in #general", minutesAgo: 8640, active: true },
];

const TYPE_CONFIG = {
  warn: { icon: AlertTriangle, color: "#FFB547", label: "Warn" },
  kick: { icon: UserX, color: "#58BFC5", label: "Kick" },
  ban: { icon: Ban, color: "#FF5C7A", label: "Ban" },
  timeout: { icon: Clock, color: "#5B8CFF", label: "Timeout" },
  unban: { icon: Ban, color: "#39D98A", label: "Unban" },
  softban: { icon: Ban, color: "#FF5C7A", label: "Softban" },
  timeout_remove: { icon: Clock, color: "#39D98A", label: "Timeout Removed" },
  note: { icon: FileText, color: "#8B93A7", label: "Note" },
};

/* Map an API case row (ModerationCase) into the table row shape. */
function normalizeCase(c) {
  const t = c.createdAt ? new Date(c.createdAt).getTime() : NaN;
  const created = Number.isFinite(t) ? t : Date.now();
  return {
    caseId: c.caseId ?? c.id,
    type: c.type,
    user: String(c.userId ?? "Unknown"),
    moderator: String(c.moderatorId ?? "Unknown"),
    reason: c.reason || "No reason provided",
    minutesAgo: Math.max(0, (Date.now() - created) / 60000),
    active: c.active !== false,
  };
}

/* ────────────────────────────── pieces ────────────────────────────── */

function MiniStat({ label, value, color, icon: Icon, index }) {
  const count = useCountUp(value, { duration: 700 + index * 90 });
  return (
    <div className="panel panel-hover p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="section-label">{label}</span>
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      </div>
      <div className="mt-2 text-2xl font-extrabold text-white tabular-nums">{Math.round(count)}</div>
    </div>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function LogViewer({ guildId }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [cases, setCases] = useState(DEMO_CASES);

  // Load real moderation cases; keep demo rows as fallback when unavailable.
  useEffect(() => {
    if (!guildId) {
      setCases(DEMO_CASES);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/guilds/${guildId}/cases`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setCases(Array.isArray(data) ? data.map(normalizeCase) : DEMO_CASES);
      } catch (err) {
        console.error("[LogViewer] Failed to load moderation cases:", err);
        if (!cancelled) setCases(DEMO_CASES);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  const filtered = cases.filter((c) => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        String(c.caseId).includes(q) ||
        c.user.toLowerCase().includes(q) ||
        c.moderator.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    totalCases: cases.length,
    activeWarnings: cases.filter((c) => c.type === "warn" && c.active).length,
    banCount: cases.filter((c) => c.type === "ban").length,
    kickCount: cases.filter((c) => c.type === "kick").length,
    timeoutCount: cases.filter((c) => c.type === "timeout").length,
  };

  const statCards = [
    { label: "Total Cases", value: stats.totalCases, color: "#7C5CFF", icon: FileText },
    { label: "Active Warnings", value: stats.activeWarnings, color: "#FFB547", icon: AlertTriangle },
    { label: "Timeouts", value: stats.timeoutCount, color: "#5B8CFF", icon: Clock },
    { label: "Kicks", value: stats.kickCount, color: "#58BFC5", icon: UserX },
    { label: "Bans", value: stats.banCount, color: "#FF5C7A", icon: Ban },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <FileText className="h-4 w-4" />
            </span>
            Moderation Logs & Audit Trail
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Every moderation action across Crystal Realm — live search, filters, and pagination.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={rise} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {statCards.map((s, i) => (
          <MiniStat key={s.label} label={s.label} value={s.value} color={s.color} icon={s.icon} index={i} />
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={rise}
        className="panel p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case ID, member, moderator, or reason…"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C5CFF]/50 transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          {["all", "warn", "timeout", "kick", "ban"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTypeFilter(t);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                typeFilter === t
                  ? "border-[#7C5CFF]/40 bg-[#7C5CFF]/10 text-[#B9A6FF]"
                  : "border-white/[0.07] bg-white/[0.02] text-slate-500 hover:text-slate-300"
              }`}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Cases table */}
      <motion.div variants={rise} className="panel overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Case #", "Type", "Member", "Moderator", "Reason", "Date", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.14em] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-slate-500">
                    No moderation cases match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const cfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.warn;
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={c.caseId}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                        #{c.caseId}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
                          style={{
                            borderColor: `${cfg.color}40`,
                            color: cfg.color,
                            background: `${cfg.color}12`,
                          }}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7C5CFF]/15 text-[10px] font-bold text-[#B9A6FF]">
                            {c.user[0]}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">{c.user}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {c.moderator}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-300 max-w-xs truncate">{c.reason}</td>
                      <td className="px-4 py-3.5 text-[10px] text-slate-500 font-mono whitespace-nowrap">
                        {timeAgo(c.minutesAgo)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            c.active
                              ? "bg-[#39D98A]/10 border-[#39D98A]/25 text-[#39D98A]"
                              : "bg-white/[0.03] border-white/[0.08] text-slate-500"
                          }`}
                        >
                          {c.active ? "ACTIVE" : "RESOLVED"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-white/[0.06]">
          <span className="text-[11px] text-slate-500">
            Showing {filtered.length} of {cases.length} cases
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400">Page {page}</span>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
