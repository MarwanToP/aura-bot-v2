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
  Download,
  Inbox,
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

/* Log severity per case type — derived, so the badge never invents a level. */
const TYPE_LEVEL = {
  ban: "error",
  softban: "error",
  kick: "warn",
  timeout: "warn",
  warn: "warn",
  unban: "info",
  timeout_remove: "info",
  note: "debug",
};

const LEVELS = {
  error: { label: "Error", cls: "chip chip-red" },
  warn: { label: "Warn", cls: "chip chip-amber" },
  info: { label: "Info", cls: "chip chip-blue" },
  debug: { label: "Debug", cls: "chip chip-violet" },
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

function MiniStat({ label, value, color, icon: Icon, index, tone }) {
  const count = useCountUp(value, { duration: 700 + index * 90 });
  return (
    <div className="kpi-tile flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-3">
        <span className="kpi-label">{label}</span>
        <span className={`icon-tile icon-tile-${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <div className="kpi-value tabular-nums">{Math.round(count).toLocaleString("en-US")}</div>
        <div className="mt-1.5 text-[11px] font-semibold" style={{ color }}>
          {label === "Total Cases" ? "Audit trail" : "Recorded events"}
        </div>
      </div>
    </div>
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
    { label: "Total Cases", value: stats.totalCases, color: "#A9C2FF", icon: FileText, tone: "violet" },
    { label: "Active Warnings", value: stats.activeWarnings, color: "#FCD34D", icon: AlertTriangle, tone: "amber" },
    { label: "Timeouts", value: stats.timeoutCount, color: "#A9C2FF", icon: Clock, tone: "blue" },
    { label: "Kicks", value: stats.kickCount, color: "#67E8F9", icon: UserX, tone: "cyan" },
    { label: "Bans", value: stats.banCount, color: "#FCA5A5", icon: Ban, tone: "red" },
  ];

  /* Export has no route behind it yet — the control stays disabled and says so. */
  const readOnlyHint = "Not manageable from the dashboard yet";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="section-label">Audit Trail</span>
          <h2 className="card-title mt-1.5 flex items-center gap-2.5 text-lg">
            <span className="icon-tile icon-tile-violet h-9 w-9">
              <FileText className="h-4 w-4" />
            </span>
            Moderation Logs &amp; Audit Trail
          </h2>
          <p className="card-sub mt-1.5 max-w-2xl">
            Every moderation action across Crystal Realm — live search, filters, and pagination.
          </p>
        </div>
        <button
          type="button"
          disabled
          title={readOnlyHint}
          className="btn-glass px-3.5 py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={rise} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {statCards.map((s, i) => (
          <MiniStat
            key={s.label}
            label={s.label}
            value={s.value}
            color={s.color}
            icon={s.icon}
            tone={s.tone}
            index={i}
          />
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={rise} className="glass-card flex flex-col items-stretch gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case ID, member, moderator, or reason…"
            className="glass-input py-2 pl-9 pr-3 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="glass-select w-full py-2 text-xs sm:w-48"
          >
            <option value="all">All Types</option>
            <option value="warn">Warn</option>
            <option value="timeout">Timeout</option>
            <option value="kick">Kick</option>
            <option value="ban">Ban</option>
          </select>
        </div>
      </motion.div>

      {/* Log stream */}
      <motion.div variants={rise} className="glass-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div>
            <span className="section-label">Event Stream</span>
            <h3 className="card-title mt-1">Audit Entries</h3>
          </div>
          <span className="chip chip-blue">{filtered.length} entries</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 pb-4">
            <EmptyState
              icon={Inbox}
              title="No matching entries"
              body="No moderation cases match your filters — try a different type or search term."
            />
          </div>
        ) : (
          <>
            <div className="hidden items-center gap-3 border-y border-white/[0.06] bg-white/[0.02] px-4 py-2.5 sm:flex">
              <span className="micro-label w-[4.5rem] shrink-0">Time</span>
              <span className="micro-label w-[4.75rem] shrink-0">Level</span>
              <span className="micro-label min-w-0 flex-1">Event</span>
              <span className="micro-label w-[5rem] shrink-0 text-right">State</span>
            </div>

            <div className="px-2 pb-2">
              {filtered.map((c, i) => {
                const cfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.warn;
                const Icon = cfg.icon;
                const level = LEVELS[TYPE_LEVEL[c.type] || "info"];
                return (
                  <React.Fragment key={c.caseId}>
                    {i > 0 && <div className="hairline" />}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-2 py-2.5 transition-colors hover:bg-white/[0.03]">
                      <span className="w-[4.5rem] shrink-0 font-mono text-[10px] text-slate-500">
                        {timeAgo(c.minutesAgo)}
                      </span>

                      <span className={`${level.cls} w-[4.75rem] shrink-0 uppercase tracking-wider`}>
                        {level.label}
                      </span>

                      <div className="min-w-[10rem] flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.color }} />
                          <span className="text-[11px] font-bold" style={{ color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span className="truncate text-[11px] font-bold text-white">{c.user}</span>
                          <span className="text-[10px] text-slate-500">by {c.moderator}</span>
                          <span className="font-mono text-[10px] text-slate-600">#{c.caseId}</span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">{c.reason}</p>
                      </div>

                      <span className="flex w-[5rem] shrink-0 justify-end">
                        <span className={c.active ? "chip chip-green" : "chip"}>
                          {c.active ? "Active" : "Resolved"}
                        </span>
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3.5">
          <span className="text-[11px] text-slate-500">
            Showing {filtered.length} of {cases.length} cases
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              title={page === 1 ? "Already on the first page" : undefined}
              className="btn-icon h-8 w-8 rounded-xl disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-xs text-slate-400">Page {page}</span>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              title="Next page"
              className="btn-icon h-8 w-8 rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
