"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  UserPlus,
  Ticket,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Megaphone,
  Gift,
  FileText,
  Settings2,
  BadgeCheck,
  HelpCircle,
  Ban,
  ChevronRight,
  Gem,
  CheckCircle2,
} from "lucide-react";
import QuickActionModal from "./QuickActionModal.jsx";

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

/* ────────────────────────────── static data ────────────────────────────── */

const METRICS = [
  {
    label: "Servers",
    value: 24,
    suffix: "",
    change: "+12%",
    note: "this week",
    color: "#7C5CFF",
    spark: [3, 4.1, 3.5, 5, 4.6, 6, 7.4],
  },
  {
    label: "Members",
    value: 128.4,
    decimals: 1,
    suffix: "K",
    change: "+8%",
    note: "this week",
    color: "#5B8CFF",
    spark: [4, 4.4, 3.9, 5.6, 5, 6.8, 7.8],
  },
  {
    label: "Commands",
    value: 28.7,
    decimals: 1,
    suffix: "M",
    change: "+11%",
    note: "this week",
    color: "#7C5CFF",
    spark: [3.6, 4, 4.6, 4.2, 5.6, 6, 7],
  },
  {
    label: "Uptime",
    value: 99.97,
    decimals: 2,
    suffix: "%",
    change: "30d average",
    neutral: true,
    color: "#39D98A",
    spark: [6, 6.2, 6, 6.4, 6.2, 6.5, 6.4],
  },
];

const ACTIVITY = {
  "7D": {
    labels: ["May 19", "May 20", "May 21", "May 22", "May 23", "May 24", "May 25"],
    members: [42, 47, 44, 58, 53, 63, 68.4],
    commands: [30, 33, 37, 34, 44, 47, 52.1],
    messages: [24, 27, 26, 33, 31, 37, 41.6],
  },
  "30D": {
    labels: ["Apr 26", "Apr 29", "May 2", "May 5", "May 8", "May 11", "May 14", "May 17", "May 20", "May 23", "May 25"],
    members: [28, 31, 30, 36, 41, 39, 47, 52, 55, 61, 68.4],
    commands: [19, 22, 24, 26, 31, 29, 34, 38, 42, 46, 52.1],
    messages: [15, 17, 16, 20, 24, 23, 27, 30, 33, 36, 41.6],
  },
  "90D": {
    labels: ["Mar 1", "Mar 10", "Mar 19", "Mar 28", "Apr 6", "Apr 15", "Apr 24", "May 3", "May 12", "May 21", "May 25"],
    members: [12, 15, 18, 17, 24, 29, 34, 42, 49, 58, 68.4],
    commands: [8, 10, 12, 11, 16, 19, 23, 28, 33, 40, 52.1],
    messages: [6, 7, 9, 8, 12, 15, 18, 22, 26, 31, 41.6],
  },
};

const SERIES_META = [
  { key: "members", label: "Members", color: "#7C5CFF", area: true, dots: true },
  { key: "commands", label: "Commands", color: "#5B8CFF", area: true, dots: true },
  { key: "messages", label: "Messages", color: "#58BFC5", area: false, dots: false },
];

const HEALTH_ROWS = [
  { label: "Security", value: 98, color: "#39D98A" },
  { label: "Performance", value: 91, color: "#5B8CFF" },
  { label: "Moderation", value: 96, color: "#7C5CFF" },
  { label: "Activity", value: 89, color: "#FF5C7A" },
];

const EVENTS = [
  { icon: UserPlus, color: "#39D98A", title: "New member joined", actor: "@CrystalWolf", time: "2 min ago" },
  { icon: Ticket, color: "#5B8CFF", title: "Ticket created", actor: "@Passport", time: "8 min ago" },
  { icon: AlertTriangle, color: "#FF5C7A", title: "Warning issued to user", actor: "@theSauerkraut", time: "14 min ago" },
  { icon: Sparkles, color: "#7C5CFF", title: "Server boosted", actor: "@polymorphicServer", time: "21 min ago" },
];

const COMMANDS = [
  { name: "/verify", uses: "6.42M", icon: BadgeCheck, color: "#7C5CFF", pct: 100 },
  { name: "/help", uses: "5.11M", icon: HelpCircle, color: "#5B8CFF", pct: 80 },
  { name: "/giveaway", uses: "4.21M", icon: Gift, color: "#39D98A", pct: 66 },
  { name: "/ticket", uses: "3.56M", icon: Ticket, color: "#FFB547", pct: 55 },
  { name: "/ban", uses: "2.91M", icon: Ban, color: "#FF5C7A", pct: 45 },
];

const PULSE = [
  { label: "Member growth", value: "+8.3%", up: true, good: true },
  { label: "Commands", value: "+11.2%", up: true, good: true },
  { label: "Boosts", value: "+15.7%", up: true, good: true },
  { label: "Reports", value: "−4.2%", up: false, good: true },
];

/* ────────────────────────────── pieces ────────────────────────────── */

function Sparkline({ data, color, id }) {
  const { line, fill } = useMemo(() => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 27 - ((v - min) / range) * 22;
      return [x, y];
    });
    const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
    const fill = `0,30 ${line} 100,30`;
    return { line, fill };
  }, [data]);

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polygon
        points={fill}
        fill={`url(#spark-${id})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.35 }}
      />
      <motion.polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
      />
    </svg>
  );
}

function MetricCard({ m, index }) {
  const count = useCountUp(m.value, { duration: 900 + index * 120 });
  const display =
    m.decimals > 0 ? count.toFixed(m.decimals) : Math.round(count).toLocaleString("en-US");

  return (
    <motion.div variants={rise} className="panel panel-hover relative p-4 flex items-center justify-between gap-3 min-h-[104px] overflow-hidden">
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold tracking-wide text-slate-400">{m.label}</span>
        <span className="mt-1 text-2xl font-extrabold tracking-tight text-white tabular-nums">
          {display}
          {m.suffix}
        </span>
        {m.change && (
          <span
            className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap ${
              m.neutral ? "text-slate-500" : "text-[#39D98A]"
            }`}
          >
            {!m.neutral && <ArrowUpRight className="w-3 h-3 shrink-0" />}
            {m.change}
            {!m.neutral && (
              <span className="hidden 2xl:inline text-slate-600 font-medium">· {m.note}</span>
            )}
          </span>
        )}
      </div>
      {m.spark && (
        <div className="w-[78px] h-[42px] shrink-0">
          <Sparkline data={m.spark} color={m.color} id={m.label.toLowerCase()} />
        </div>
      )}
    </motion.div>
  );
}

/* ── Activity Overview chart ─────────────────────────────────────────── */

const CW = 720;
const CH = 236;
const PAD = { l: 44, r: 14, t: 16, b: 22 };
const Y_MAX = 80;

const xAt = (i, n) => PAD.l + (i * (CW - PAD.l - PAD.r)) / (n - 1);
const yAt = (v) => PAD.t + (1 - v / Y_MAX) * (CH - PAD.t - PAD.b);

function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function ActivityChart({ timeframe, setTimeframe }) {
  const [hover, setHover] = useState(null);
  const data = ACTIVITY[timeframe];
  const n = data.labels.length;
  const xs = useMemo(() => data.labels.map((_, i) => xAt(i, n)), [n, data.labels]);
  const dense = n > 8;

  const series = SERIES_META.map((meta) => {
    const pts = data[meta.key].map((v, i) => [xs[i], yAt(v)]);
    const line = smoothPath(pts);
    const area = `${line} L ${pts[pts.length - 1][0]} ${CH - PAD.b} L ${pts[0][0]} ${CH - PAD.b} Z`;
    return { ...meta, pts, line, area };
  });

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CW;
    let best = 0;
    let bd = Infinity;
    xs.forEach((cx, i) => {
      const d = Math.abs(cx - x);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setHover(best);
  };

  const fmt = (v) => `${v.toFixed(1)}K`;

  return (
    <div className="panel panel-hover relative overflow-hidden p-5 flex flex-col">
      {/* ambient corner glow */}
      <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#7C5CFF]/[0.06] blur-3xl" />

      {/* Header */}
      <div className="relative flex flex-wrap items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Activity Overview</h3>
          <div className="flex items-center gap-4 mt-1.5">
            {SERIES_META.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[11px] text-slate-400 font-medium">{s.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Segmented control */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          {["7D", "30D", "90D"].map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf);
                setHover(null);
              }}
              className="relative px-3 py-1 text-[11px] font-bold rounded-[10px] cursor-pointer transition-colors"
            >
              {timeframe === tf && (
                <motion.span
                  layoutId="ao-segment-pill"
                  transition={{ type: "spring", stiffness: 520, damping: 40 }}
                  className="absolute inset-0 rounded-[10px] bg-[#7C5CFF]/15 ring-1 ring-inset ring-[#7C5CFF]/30"
                />
              )}
              <span className={`relative z-10 ${timeframe === tf ? "text-white" : "text-slate-500 hover:text-slate-300"}`}>
                {tf}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative mt-1">
        <svg
          viewBox={`0 0 ${CW} ${CH}`}
          className="w-full h-auto select-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="ao-area-members" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ao-area-commands" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5B8CFF" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#5B8CFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g key={timeframe}>
            {/* Grid + Y labels */}
            {[0, 20, 40, 60, 80].map((v) => (
              <g key={v}>
                <line
                  x1={PAD.l}
                  y1={yAt(v)}
                  x2={CW - PAD.r}
                  y2={yAt(v)}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray={v === 0 ? "0" : "3 5"}
                  strokeWidth="1"
                />
                <text
                  x={PAD.l - 10}
                  y={yAt(v) + 3.5}
                  fill="#4A5063"
                  fontSize="10.5"
                  textAnchor="end"
                  fontFamily="ui-monospace, monospace"
                >
                  {v === 0 ? "0" : `${v}K`}
                </text>
              </g>
            ))}

            {/* Areas */}
            {series
              .filter((s) => s.area)
              .map((s) => (
                <motion.path
                  key={`area-${s.key}`}
                  d={s.area}
                  fill={`url(#ao-area-${s.key})`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
                />
              ))}

            {/* Lines */}
            {series.map((s, si) => (
              <motion.path
                key={`line-${s.key}`}
                d={s.line}
                fill="none"
                stroke={s.color}
                strokeWidth={si === 0 ? 2.4 : 2}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.1 + si * 0.12 }}
              />
            ))}

            {/* Dots */}
            {series
              .filter((s) => s.dots)
              .map((s, si) =>
                s.pts.map(([x, y], i) => (
                  <motion.circle
                    key={`${s.key}-${i}`}
                    cx={x}
                    cy={y}
                    r={i === hover ? 4.6 : 3.1}
                    fill={s.color}
                    stroke="#0B0D12"
                    strokeWidth="1.5"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + si * 0.1 + i * 0.045, type: "spring", stiffness: 400, damping: 24 }}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  />
                ))
              )}

            {/* Hover crosshair */}
            {hover !== null && (
              <g>
                <line
                  x1={xs[hover]}
                  y1={PAD.t}
                  x2={xs[hover]}
                  y2={CH - PAD.b}
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="1"
                />
                {series.map((s) => (
                  <circle
                    key={`hv-${s.key}`}
                    cx={xs[hover]}
                    cy={s.pts[hover][1]}
                    r="4.5"
                    fill={s.color}
                    stroke="#0B0D12"
                    strokeWidth="2"
                  />
                ))}
              </g>
            )}
          </g>
        </svg>

        {/* X labels */}
        <div className="relative h-4 mt-1 mx-1">
          {data.labels.map((l, i) =>
            dense && i % 2 === 1 && i !== n - 1 ? null : (
              <span
                key={l}
                className="absolute -translate-x-1/2 text-[10px] text-slate-600 font-mono whitespace-nowrap"
                style={{ left: `${(xs[i] / CW) * 100}%` }}
              >
                {l}
              </span>
            )
          )}
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {hover !== null && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 rounded-xl border border-white/[0.08] bg-[#12141B]/95 backdrop-blur-md px-3 py-2 shadow-xl shadow-black/50"
              style={{ left: `${Math.min(86, Math.max(14, (xs[hover] / CW) * 100))}%` }}
            >
              <div className="text-[10px] font-bold text-slate-400 mb-1">{data.labels[hover]}</div>
              {series.map((s) => (
                <div key={`tip-${s.key}`} className="flex items-center gap-2 text-[11px] leading-5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-400">{s.label}</span>
                  <span className="ml-auto pl-3 font-bold text-white font-mono">
                    {fmt(data[s.key][hover])}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Server Health ───────────────────────────────────────────────────── */

function HealthCard() {
  const score = useCountUp(94, { duration: 1300 });
  const R = 50;
  const C = 2 * Math.PI * R;

  return (
    <div className="panel panel-hover relative overflow-hidden p-5 flex flex-col">
      <div className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#39D98A]/[0.05] blur-3xl" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white tracking-wide">Server Health</h3>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#39D98A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#39D98A] animate-pulse-dot" />
          HEALTHY
        </span>
      </div>

      <div className="flex items-center gap-5 flex-1">
        {/* Donut */}
        <div className="relative w-[124px] h-[124px] shrink-0">
          <svg viewBox="0 0 124 124" className="w-full h-full -rotate-90">
            <circle cx="62" cy="62" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
            <motion.circle
              cx="62"
              cy="62"
              r={R}
              fill="none"
              stroke="url(#health-ring-grad)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - 0.94) }}
              transition={{ duration: 1.5, ease: EASE, delay: 0.25 }}
            />
            <defs>
              <linearGradient id="health-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C5CFF" />
                <stop offset="55%" stopColor="#5B8CFF" />
                <stop offset="100%" stopColor="#39D98A" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-white tracking-tight tabular-nums">
              {Math.round(score)}%
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Score
            </span>
          </div>
        </div>

        {/* Rows */}
        <div className="flex-1 space-y-3 min-w-0">
          {HEALTH_ROWS.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08, duration: 0.4, ease: EASE }}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                <span className="truncate">{row.label}</span>
              </span>
              <span className="text-xs font-bold text-white font-mono tabular-nums">{row.value}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Recent Activity ─────────────────────────────────────────────────── */

function RecentActivityCard({ onNavigate }) {
  return (
    <div className="panel panel-hover relative p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white tracking-wide">
          Recent Activity
          <span className="w-1.5 h-1.5 rounded-full bg-[#39D98A] animate-pulse-dot" />
        </h3>
        <button
          onClick={() => onNavigate && onNavigate("logs")}
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 hover:text-[#7C5CFF] transition-colors cursor-pointer"
        >
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-1.5 flex-1">
        {EVENTS.map((ev, i) => {
          const Icon = ev.icon;
          return (
            <motion.div
              key={ev.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.35, ease: EASE }}
              className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/[0.03] transition-colors"
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${ev.color}1F`, color: ev.color }}
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-slate-200 truncate">{ev.title}</span>
                <span className="block text-[10px] text-slate-500 truncate">{ev.actor}</span>
              </span>
              <span className="text-[10px] text-slate-600 font-mono whitespace-nowrap">{ev.time}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Top Commands ────────────────────────────────────────────────────── */

function TopCommandsCard({ onNavigate }) {
  return (
    <div className="panel panel-hover relative p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white tracking-wide">Top Commands</h3>
        <button
          onClick={() => onNavigate && onNavigate("commands")}
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 hover:text-[#7C5CFF] transition-colors cursor-pointer"
        >
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-1 flex-1">
        {COMMANDS.map((cmd, i) => {
          const Icon = cmd.icon;
          return (
            <motion.div
              key={cmd.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.35, ease: EASE }}
              className="relative px-2.5 py-2 rounded-xl hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cmd.color}1A`, color: cmd.color }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="font-mono text-xs font-semibold text-slate-200 flex-1">{cmd.name}</span>
                <span className="text-xs font-bold text-slate-300 font-mono tabular-nums">{cmd.uses}</span>
              </div>
              {/* Relative usage bar */}
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: cmd.pct / 100 }}
                transition={{ delay: 0.3 + i * 0.07, duration: 0.6, ease: EASE }}
                style={{
                  backgroundColor: `${cmd.color}59`,
                  transformOrigin: "left",
                }}
                className="absolute bottom-0.5 left-[46px] right-2 h-[2px] rounded-full"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Nitro Boost ─────────────────────────────────────────────────────── */

function NitroBoostCard() {
  const boosters = useCountUp(1248, { duration: 1400 });
  const boostersDisplay = Math.round(boosters).toLocaleString("en-US");

  return (
    <div className="panel panel-hover relative overflow-hidden p-5 flex flex-col h-full">
      <div className="pointer-events-none absolute -top-20 -right-14 w-56 h-56 rounded-full bg-[#7C5CFF]/[0.07] blur-3xl" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white tracking-wide">Nitro Boost</h3>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#39D98A]">
          <ArrowUpRight className="w-3 h-3" />
          +15.7% this month
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        <motion.span
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 340, damping: 20 }}
          className="w-11 h-11 rounded-xl bg-[#7C5CFF]/12 border border-[#7C5CFF]/25 flex items-center justify-center shrink-0"
        >
          <Gem className="w-5 h-5 text-[#7C5CFF]" />
        </motion.span>
        <div>
          <div className="text-2xl font-extrabold text-white tracking-tight leading-none tabular-nums">
            {boostersDisplay}
            <span className="ml-1.5 text-xs font-medium text-slate-500">Boosters</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5 font-body">
            Community tier boosting this month
          </div>
        </div>
      </div>

      {/* Level progress */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
          <span className="text-white">Level 3</span>
          <span className="text-slate-500 font-mono">14 Boosts</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "88%" }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
            className="h-full rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#5B8CFF]"
          />
        </div>
      </div>

      {/* Recent boosters */}
      <div className="mt-auto pt-5 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-body">Recent boosters</span>
        <div className="flex items-center">
          {["#7C5CFF", "#5B8CFF", "#58BFC5", "#39D98A", "#FFB547"].map((c, i) => (
            <motion.span
              key={c}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              style={{ marginLeft: i === 0 ? 0 : -7, zIndex: 5 - i, background: `linear-gradient(135deg, ${c}, ${c}88)` }}
              className="w-6 h-6 rounded-full ring-2 ring-[#0B0D12] flex items-center justify-center text-[9px] font-bold text-white/90"
            >
              {["C", "P", "M", "S", "A"][i]}
            </motion.span>
          ))}
          <span className="ml-2 text-[10px] text-slate-600 font-mono">+9</span>
        </div>
      </div>
    </div>
  );
}

/* ── Quick Actions ───────────────────────────────────────────────────── */

function QuickActionsCard({ onNavigate, onAction }) {
  const actions = [
    { key: "command", label: "Create Command", icon: Terminal, color: "#7C5CFF", modal: "command" },
    { key: "ticket", label: "Create Ticket", icon: Ticket, color: "#5B8CFF", modal: "ticket" },
    { key: "giveaway", label: "Create Giveaway", icon: Gift, color: "#39D98A", modal: "giveaway" },
    { key: "broadcast", label: "Broadcast Message", icon: Megaphone, color: "#FFB547", modal: "broadcast" },
    { key: "servers", label: "Manage Server", icon: Settings2, color: "#58BFC5", navigate: "servers" },
    { key: "logs", label: "View Logs", icon: FileText, color: "#8B92A5", navigate: "logs" },
  ];

  return (
    <div className="panel panel-hover relative p-5 flex flex-col h-full">
      <h3 className="text-sm font-bold text-white tracking-wide mb-3.5">Quick Actions</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.button
              key={a.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.05, duration: 0.35, ease: EASE }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (a.navigate && onNavigate) onNavigate(a.navigate);
                else if (onAction) onAction(a);
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#7C5CFF]/25 text-left text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${a.color}1A`, color: a.color }}
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="truncate">{a.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Server Pulse strip ──────────────────────────────────────────────── */

function PulseStrip() {
  return (
    <div className="panel px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="inline-flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#39D98A] animate-pulse-dot" />
        <span className="text-[10px] font-bold tracking-[0.16em] text-slate-500 uppercase">
          Server Pulse
        </span>
      </span>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {PULSE.map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1.5 text-[11px]">
            {p.up ? (
              <ArrowUpRight className="w-3 h-3 text-[#39D98A]" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-[#39D98A]" />
            )}
            <span className="text-slate-500 font-body">{p.label}</span>
            <span className="font-bold text-slate-200 font-mono tabular-nums">{p.value}</span>
          </span>
        ))}
      </div>

      <span className="ml-auto text-[11px] text-slate-500 font-body hidden md:block">
        Everything looks <span className="text-[#39D98A] font-semibold">healthy</span>.
      </span>
    </div>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function OverviewCanvas({ onNavigate }) {
  const [timeframe, setTimeframe] = useState("7D");
  const [modalAction, setModalAction] = useState(null);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.success) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Real values for the metrics strip; guests / unavailable sources keep the demo values.
  // Stats-wired cards drop the demo change text and sparkline (they would be fabricated).
  const metrics = useMemo(() => {
    if (!stats) return METRICS;
    return METRICS.map((m) => {
      if (m.label === "Servers" && typeof stats.guildCount === "number") {
        return { ...m, value: stats.guildCount, change: null, note: null, spark: null };
      }
      if (m.label === "Members" && typeof stats.memberCount === "number") {
        const v = stats.memberCount;
        const live = { change: null, note: null, spark: null };
        if (v >= 1e6) return { ...m, ...live, value: v / 1e6, decimals: 1, suffix: "M" };
        if (v >= 1e4) return { ...m, ...live, value: v / 1e3, decimals: 1, suffix: "K" };
        return { ...m, ...live, value: v, decimals: 0, suffix: "" };
      }
      return m;
    });
  }, [stats]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
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
            className="fixed bottom-6 right-6 z-[90] panel px-4 py-3 flex items-center gap-2.5 text-xs font-semibold shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="w-4 h-4 text-[#39D98A]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 1 — Metrics */}
      <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.label} m={m} index={i} />
        ))}
      </motion.div>

      {/* Row 2 — Activity + Health */}
      <motion.div variants={rise} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <ActivityChart timeframe={timeframe} setTimeframe={setTimeframe} />
        </div>
        <div className="lg:col-span-4">
          <HealthCard />
        </div>
      </motion.div>

      {/* Row 3 — Recent Activity + Top Commands */}
      <motion.div variants={rise} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <RecentActivityCard onNavigate={onNavigate} />
        </div>
        <div className="lg:col-span-6">
          <TopCommandsCard onNavigate={onNavigate} />
        </div>
      </motion.div>

      {/* Row 4 — Nitro Boost + Quick Actions */}
      <motion.div variants={rise} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <NitroBoostCard />
        </div>
        <div className="lg:col-span-6">
          <QuickActionsCard
            onNavigate={onNavigate}
            onAction={(a) => setModalAction({ title: a.label, type: a.modal })}
          />
        </div>
      </motion.div>

      {/* Row 5 — Server Pulse */}
      <motion.div variants={rise}>
        <PulseStrip />
      </motion.div>

      {/* Quick action modal */}
      <QuickActionModal
        open={Boolean(modalAction)}
        action={modalAction}
        onClose={() => setModalAction(null)}
        onSuccess={showToast}
      />
    </motion.div>
  );
}
