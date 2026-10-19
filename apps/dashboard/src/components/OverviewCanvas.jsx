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
  Server,
  Users,
  Activity,
  Hand,
  ExternalLink,
  Rocket,
} from "lucide-react";
import QuickActionModal from "./QuickActionModal.jsx";
import AuraLogo from "./AuraLogo";
import { useAuth } from "../context/AuthContext";

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
    note: "vs. last 7 days",
    icon: Server,
    tile: "blue",
    color: "#4C7DFF",
    spark: [3, 4.1, 3.5, 5, 4.6, 6, 7.4],
  },
  {
    label: "Members",
    value: 128.4,
    decimals: 1,
    suffix: "K",
    change: "+8%",
    note: "vs. last 7 days",
    icon: Users,
    tile: "violet",
    color: "#7C5CFF",
    spark: [4, 4.4, 3.9, 5.6, 5, 6.8, 7.8],
  },
  {
    label: "Commands",
    value: 28.7,
    decimals: 1,
    suffix: "M",
    change: "+11%",
    note: "vs. last 7 days",
    icon: Terminal,
    tile: "cyan",
    color: "#22D3EE",
    spark: [3.6, 4, 4.6, 4.2, 5.6, 6, 7],
  },
  {
    label: "Uptime",
    value: 99.97,
    decimals: 2,
    suffix: "%",
    change: "30d average",
    neutral: true,
    icon: Activity,
    tile: "green",
    color: "#34D399",
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
  { key: "members", label: "Members", color: "#4C7DFF", area: true, dots: true },
  { key: "commands", label: "Commands", color: "#7C5CFF", area: true, dots: true },
  { key: "messages", label: "Messages", color: "#22D3EE", area: false, dots: false },
];

/* Per-series line recipe (blue → violet → cyan, as in the reference chart). */
const SERIES_CLASS = {
  members: "chart-line-blue",
  commands: "chart-line-violet",
  messages: "chart-line-cyan",
};

const HEALTH_ROWS = [
  { label: "Security", value: 98, color: "#34D399" },
  { label: "Performance", value: 91, color: "#4C7DFF" },
  { label: "Moderation", value: 96, color: "#7C5CFF" },
  { label: "Activity", value: 89, color: "#22D3EE" },
];

const EVENTS = [
  { icon: UserPlus, color: "#34D399", title: "New member joined", actor: "@CrystalWolf", time: "2 min ago" },
  { icon: Ticket, color: "#4C7DFF", title: "Ticket created", actor: "@Passport", time: "8 min ago" },
  { icon: AlertTriangle, color: "#F87171", title: "Warning issued to user", actor: "@theSauerkraut", time: "14 min ago" },
  { icon: Sparkles, color: "#7C5CFF", title: "Server boosted", actor: "@polymorphicServer", time: "21 min ago" },
];

const COMMANDS = [
  { name: "/verify", uses: "6.42M", icon: BadgeCheck, color: "#7C5CFF", pct: 100 },
  { name: "/help", uses: "5.11M", icon: HelpCircle, color: "#4C7DFF", pct: 80 },
  { name: "/giveaway", uses: "4.21M", icon: Gift, color: "#34D399", pct: 66 },
  { name: "/ticket", uses: "3.56M", icon: Ticket, color: "#FBBF24", pct: 55 },
  { name: "/ban", uses: "2.91M", icon: Ban, color: "#F87171", pct: 45 },
];

const PULSE = [
  { label: "Member growth", value: "+8.3%", up: true, good: true, icon: Users, tile: "blue" },
  { label: "Commands", value: "+11.2%", up: true, good: true, icon: Terminal, tile: "violet" },
  { label: "Boosts", value: "+15.7%", up: true, good: true, icon: Rocket, tile: "amber" },
  { label: "Reports", value: "−4.2%", up: false, good: true, icon: AlertTriangle, tile: "red" },
];

/* The Aura Discord invite (same link the bot itself ships with). */
const AURA_INVITE_URL = "https://discord.gg/aura";

/* ────────────────────────────── helpers ────────────────────────────── */

function formatMetricValue(m) {
  if (!m || typeof m.value !== "number" || !Number.isFinite(m.value)) return "—";
  const v = m.decimals > 0 ? m.value.toFixed(m.decimals) : Math.round(m.value).toLocaleString("en-US");
  return `${v}${m.suffix || ""}`;
}

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
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
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
        style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
      />
    </svg>
  );
}

/* ── KPI tile ───────────────────────────────────────────────────────── */

function KpiTile({ m, index }) {
  const count = useCountUp(m.value, { duration: 900 + index * 120 });
  const safe = Number.isFinite(count) ? count : 0;
  const display = m.decimals > 0 ? safe.toFixed(m.decimals) : Math.round(safe).toLocaleString("en-US");
  const Icon = m.icon;

  return (
    <motion.div variants={rise} className="kpi-tile group relative flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className={`icon-tile icon-tile-${m.tile}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="kpi-label truncate">{m.label}</span>
      </div>

      <div className="min-w-0">
        <div className="kpi-value tabular-nums">
          {display}
          {m.suffix}
        </div>

        <div className="mt-2 flex flex-col items-start gap-0.5">
          {m.change && !m.neutral && (
            <span className="delta-up">
              <ArrowUpRight className="h-3 w-3 shrink-0" />
              {m.change}
            </span>
          )}
          {m.change && m.neutral && <span className="delta-flat">{m.change}</span>}
          {m.note && (
            <span className="whitespace-nowrap text-[10px] font-medium text-slate-500">{m.note}</span>
          )}
        </div>
      </div>

      {m.spark && (
        <div className="pointer-events-none absolute bottom-3.5 right-4 h-[34px] w-[74px]">
          <Sparkline data={m.spark} color={m.color} id={m.label.toLowerCase()} />
        </div>
      )}
    </motion.div>
  );
}

/* ── Secondary pulse tiles ──────────────────────────────────────────── */

function PulseTile({ p }) {
  const Icon = p.icon;
  return (
    <motion.div
      variants={rise}
      className="glass-card glass-card-hover flex items-center gap-3 px-3.5 py-3"
    >
      <span className={`icon-tile icon-tile-${p.tile} h-9 w-9 rounded-[13px]`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="kpi-label truncate">{p.label}</div>
        <div
          className={`mt-1 flex items-center gap-1 text-sm font-extrabold tabular-nums ${
            p.good ? "text-[#34D399]" : "text-[#F87171]"
          }`}
        >
          {p.up ? (
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
          )}
          {p.value}
        </div>
      </div>
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
    <div className="panel panel-hover relative flex flex-col overflow-hidden p-5">
      {/* ambient corner glow */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#7C5CFF]/[0.08] blur-3xl" />

      {/* Header */}
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="card-title">Server Activity</h3>
          <p className="card-sub mt-1">Members, messages and commands over the last 7 days</p>
        </div>

        {/* Segmented control */}
        <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5">
          {["7D", "30D", "90D"].map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf);
                setHover(null);
              }}
              className="relative cursor-pointer rounded-[10px] px-3 py-1 text-[11px] font-bold transition-colors"
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

      {/* Legend */}
      <div className="relative mt-3 flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5">
        {SERIES_META.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span
              className="chart-legend-dot"
              style={{ backgroundColor: s.color, color: s.color }}
            />
            <span className="text-[11px] font-medium text-slate-400">{s.label}</span>
          </span>
        ))}
      </div>

      {/* Chart */}
      <div className="relative mt-1">
        <svg
          viewBox={`0 0 ${CW} ${CH}`}
          className="h-auto w-full select-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="ao-area-members" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4C7DFF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#4C7DFF" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="ao-area-commands" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <g key={timeframe}>
            {/* Grid + Y labels */}
            {[0, 20, 40, 60, 80].map((v) => (
              <g key={v}>
                <line
                  className="chart-grid-line"
                  x1={PAD.l}
                  y1={yAt(v)}
                  x2={CW - PAD.r}
                  y2={yAt(v)}
                  strokeDasharray={v === 0 ? "0" : "3 6"}
                />
                <text
                  className="chart-axis-label"
                  x={PAD.l - 10}
                  y={yAt(v) + 3.5}
                  textAnchor="end"
                  fontFamily="ui-monospace, monospace"
                >
                  {v === 0 ? "0" : `${v}K`}
                </text>
              </g>
            ))}

            {/* Soft glow under the area series */}
            {series
              .filter((s) => s.area)
              .map((s) => (
                <path
                  key={`glow-${s.key}`}
                  d={s.line}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="9"
                  strokeOpacity="0.1"
                  strokeLinecap="round"
                />
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
                className={SERIES_CLASS[s.key]}
                d={s.line}
                style={si === 0 ? { strokeWidth: 2.6 } : undefined}
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
        <div className="relative mx-1 mt-1 h-4">
          {data.labels.map((l, i) =>
            dense && i % 2 === 1 && i !== n - 1 ? null : (
              <span
                key={l}
                className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-slate-500"
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
              className="chart-tooltip pointer-events-none absolute top-0 z-20 -translate-x-1/2"
              style={{ left: `${Math.min(86, Math.max(14, (xs[hover] / CW) * 100))}%` }}
            >
              <div className="mb-1 text-[10px] font-bold text-slate-400">{data.labels[hover]}</div>
              {series.map((s) => (
                <div key={`tip-${s.key}`} className="flex items-center gap-2 text-[11px] leading-5">
                  <span
                    className="chart-legend-dot"
                    style={{ backgroundColor: s.color, color: s.color }}
                  />
                  <span className="text-slate-400">{s.label}</span>
                  <span className="ml-auto pl-3 font-mono font-bold text-white">
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

/* ── Server Health (donut) ──────────────────────────────────────────── */

function HealthCard() {
  const score = useCountUp(94, { duration: 1300 });
  const R = 52;
  const C = 2 * Math.PI * R;
  const STROKE = 13;
  const FILLED = 0.94;

  /* Each health row becomes a segment of the ring (94% of it is filled). */
  let acc = 0;
  const segments = HEALTH_ROWS.map((row) => {
    const frac = (row.value / 100) * FILLED;
    const seg = {
      ...row,
      len: Math.max(0, frac * C - 15),
      offset: -acc * C,
    };
    acc += frac;
    return seg;
  });

  return (
    <div className="panel panel-hover relative flex flex-col overflow-hidden p-5">
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#22D3EE]/[0.06] blur-3xl" />

      <div className="relative mb-1">
        <h3 className="card-title">Server Health</h3>
        <p className="card-sub mt-1">Live score across your core modules</p>
      </div>

      <div className="relative mt-2 flex flex-1 flex-col items-center gap-3">
        {/* Donut */}
        <div className="relative h-[124px] w-[124px] shrink-0">
          <svg viewBox="0 0 124 124" className="h-full w-full -rotate-90">
            <circle
              cx="62"
              cy="62"
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={STROKE}
            />
            {segments.map((s) => (
              <motion.circle
                key={s.label}
                cx="62"
                cy="62"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${s.len} ${C - s.len}`}
                style={{ filter: `drop-shadow(0 0 6px ${s.color}77)` }}
                initial={{ strokeDashoffset: s.offset + s.len }}
                animate={{ strokeDashoffset: s.offset }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold tracking-tight text-white tabular-nums">
              {Math.round(score)}%
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Score
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full min-w-0 flex-1 space-y-0.5">
          {HEALTH_ROWS.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08, duration: 0.4, ease: EASE }}
              className="list-row justify-between gap-2 px-2 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="chart-legend-dot"
                  style={{ backgroundColor: row.color, color: row.color }}
                />
                <span className="truncate text-xs text-slate-300">{row.label}</span>
              </span>
              <span className="shrink-0 text-xs font-bold text-white tabular-nums">{row.value}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Recent Activity / Recent Events ────────────────────────────────── */

function RecentEventsCard({ onNavigate }) {
  return (
    <div className="panel panel-hover relative flex h-full flex-col p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="card-title flex items-center gap-2">
          Recent Events
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#34D399]" />
        </h3>
        <button
          onClick={() => onNavigate && onNavigate("logs")}
          className="inline-flex cursor-pointer items-center gap-0.5 text-[11px] font-semibold text-slate-500 transition-colors hover:text-[#7C5CFF]"
        >
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 space-y-0.5">
        {EVENTS.map((ev, i) => {
          const Icon = ev.icon;
          return (
            <motion.div
              key={ev.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.35, ease: EASE }}
              className="list-row"
            >
              <span
                className="icon-tile h-8 w-8 rounded-[11px]"
                style={{
                  backgroundImage: `linear-gradient(150deg, ${ev.color}59 0%, ${ev.color}14 100%)`,
                  borderColor: `${ev.color}4D`,
                  color: ev.color,
                }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-100">{ev.title}</span>
                <span className="block truncate text-[10px] text-slate-500">
                  {ev.actor} · {ev.time}
                </span>
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function RailActivityCard({ onNavigate }) {
  return (
    <div className="panel panel-hover relative flex h-full flex-col p-4">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h3 className="card-title text-[13px]">Recent Activity</h3>
        <button
          onClick={() => onNavigate && onNavigate("logs")}
          className="inline-flex cursor-pointer items-center gap-0.5 text-[10px] font-semibold text-slate-500 transition-colors hover:text-[#7C5CFF]"
        >
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 space-y-0.5">
        {EVENTS.map((ev, i) => {
          const Icon = ev.icon;
          return (
            <motion.div
              key={ev.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.35, ease: EASE }}
              className="list-row px-1.5 py-1.5"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border"
                style={{ backgroundColor: `${ev.color}1F`, borderColor: `${ev.color}3D`, color: ev.color }}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold text-slate-200">{ev.title}</span>
                <span className="block truncate text-[9.5px] text-slate-500">{ev.actor}</span>
              </span>
              <span className="whitespace-nowrap font-mono text-[9.5px] text-slate-600">{ev.time}</span>
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
    <div className="panel panel-hover relative flex h-full flex-col p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="card-title">Top Commands</h3>
        <button
          onClick={() => onNavigate && onNavigate("commands")}
          className="inline-flex cursor-pointer items-center gap-0.5 text-[11px] font-semibold text-slate-500 transition-colors hover:text-[#7C5CFF]"
        >
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 space-y-1.5">
        {COMMANDS.map((cmd, i) => {
          const Icon = cmd.icon;
          return (
            <motion.div
              key={cmd.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.35, ease: EASE }}
              className="list-row flex-col items-stretch gap-1.5 px-1.5 py-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3 shrink-0 font-mono text-[10px] font-bold text-slate-600">
                  {i + 1}
                </span>
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border"
                  style={{ backgroundColor: `${cmd.color}1A`, borderColor: `${cmd.color}38`, color: cmd.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold text-slate-200">
                  {cmd.name}
                </span>
                <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-slate-300">
                  {cmd.uses}
                </span>
              </div>
              {/* Relative usage bar */}
              <div className="progress-track ml-[60px]">
                <motion.div
                  className="progress-fill"
                  style={{ backgroundImage: `linear-gradient(90deg, ${cmd.color} 0%, ${cmd.color}55 100%)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${cmd.pct}%` }}
                  transition={{ delay: 0.3 + i * 0.07, duration: 0.7, ease: EASE }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Server Growth ───────────────────────────────────────────────────── */

const GROW_W = 320;
const GROW_H = 132;
const GROW_PAD = { l: 28, r: 8, t: 12, b: 20 };

function ServerGrowthCard() {
  const data = ACTIVITY["7D"];
  const series = data.members;
  const labels = data.labels;

  const max = Math.max(...series);
  const yMax = Math.max(1, Math.ceil(max / 10) * 10);
  const pts = series.map((v, i) => [
    GROW_PAD.l + (i * (GROW_W - GROW_PAD.l - GROW_PAD.r)) / (series.length - 1),
    GROW_PAD.t + (1 - v / yMax) * (GROW_H - GROW_PAD.t - GROW_PAD.b),
  ]);
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1][0]} ${GROW_H - GROW_PAD.b} L ${pts[0][0]} ${GROW_H - GROW_PAD.b} Z`;

  /* Growth is derived from the very series the card plots — never invented. */
  const first = series[0];
  const last = series[series.length - 1];
  const growth = first ? ((last - first) / first) * 100 : 0;
  const growthLabel = Number.isFinite(growth) ? `${growth >= 0 ? "+" : "−"}${Math.abs(growth).toFixed(1)}%` : "—";
  const ticks = [0, 0.5, 1];

  return (
    <div className="panel panel-hover relative flex h-full flex-col overflow-hidden p-5">
      <div className="pointer-events-none absolute -bottom-20 -right-12 h-52 w-52 rounded-full bg-[#2DD4BF]/[0.07] blur-3xl" />

      <div className="relative mb-2 flex items-center justify-between gap-2">
        <h3 className="card-title">Server Growth</h3>
        <span
          className={`rounded-full border px-2 py-0.5 ${
            growth >= 0
              ? "delta-up border-[#34D399]/25 bg-[#34D399]/10"
              : "delta-down border-[#F87171]/25 bg-[#F87171]/10"
          }`}
        >
          {growth >= 0 ? (
            <ArrowUpRight className="h-3 w-3 shrink-0" />
          ) : (
            <ArrowDownRight className="h-3 w-3 shrink-0" />
          )}
          {growthLabel}
        </span>
      </div>
      <p className="card-sub relative">Member growth over the last 7 days</p>

      <div className="relative mt-2 flex-1">
        <svg viewBox={`0 0 ${GROW_W} ${GROW_H}`} className="h-auto w-full select-none">
          <defs>
            <linearGradient id="growth-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {ticks.map((t) => {
            const y = GROW_PAD.t + (1 - t) * (GROW_H - GROW_PAD.t - GROW_PAD.b);
            const value = t * yMax;
            return (
              <g key={t}>
                <line
                  className="chart-grid-line"
                  x1={GROW_PAD.l}
                  y1={y}
                  x2={GROW_W - GROW_PAD.r}
                  y2={y}
                />
                <text
                  className="chart-axis-label"
                  x={GROW_PAD.l - 7}
                  y={y + 3.5}
                  textAnchor="end"
                  fontFamily="ui-monospace, monospace"
                  fontSize="9"
                >
                  {value === 0 ? "0" : `${Math.round(value)}K`}
                </text>
              </g>
            );
          })}

          <path d={area} fill="url(#growth-area)" />
          <path
            d={line}
            fill="none"
            stroke="#2DD4BF"
            strokeWidth="7"
            strokeOpacity="0.12"
            strokeLinecap="round"
          />
          <path
            className="chart-line-cyan"
            d={line}
            style={{ stroke: "#2DD4BF", strokeWidth: 2.2 }}
          />

          {pts.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2.4"
              fill="#2DD4BF"
              stroke="#0B0D12"
              strokeWidth="1.2"
            />
          ))}
        </svg>

        {/* X labels */}
        <div className="relative mx-1 mt-1 h-3.5">
          {labels.map((l, i) =>
            i % 2 === 1 && i !== labels.length - 1 ? null : (
              <span
                key={l}
                className="absolute -translate-x-1/2 whitespace-nowrap text-[8.5px] font-semibold text-slate-500"
                style={{ left: `${(pts[i][0] / GROW_W) * 100}%` }}
              >
                {l}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Bot profile card ────────────────────────────────────────────────── */

function BotProfileCard({ metrics }) {
  const members = metrics.find((m) => m.label === "Members");
  const servers = metrics.find((m) => m.label === "Servers");

  return (
    <div className="panel panel-hover relative overflow-hidden">
      {/* Banner */}
      <div className="relative h-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(120%_130%_at_18%_0%,#1B3A6B_0%,#2A1B5E_48%,#0A0F1A_100%)]" />
        <div className="absolute -top-12 -left-8 h-36 w-36 rounded-full bg-[#4C7DFF]/30 blur-2xl" />
        <div className="absolute -bottom-14 -right-6 h-36 w-36 rounded-full bg-[#7C5CFF]/30 blur-2xl" />
        <div className="cyber-grid absolute inset-0 opacity-30" />
        <div className="aura-noise absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0A0F1A]/80 to-transparent" />
      </div>

      {/* Body */}
      <div className="relative -mt-9 px-4 pb-4">
        <div className="flex items-end gap-3">
          <span className="inline-flex rounded-full bg-[#0A0F1A] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
            <AuraLogo size="lg" showRing={false} />
          </span>
          <div className="min-w-0 flex-1 pb-1">
            <h3 className="font-display flex items-center gap-1.5 text-base font-extrabold tracking-tight text-white">
              Aura Bot
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#4C7DFF]" />
            </h3>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-400">
              <span className="inline-flex min-w-0 items-center gap-1">
                <Users className="h-3 w-3 shrink-0 text-slate-500" />
                <span className="truncate">{formatMetricValue(members)} members</span>
              </span>
              <span className="inline-flex min-w-0 items-center gap-1">
                <Server className="h-3 w-3 shrink-0 text-slate-500" />
                <span className="truncate">{formatMetricValue(servers)} servers</span>
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3.5 text-[11px] leading-relaxed text-slate-400">
          More than just a bot. Powerful tools, moderation, and more — all in one.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={AURA_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary min-w-0 flex-1 truncate rounded-xl"
            title="Add Aura Bot to your server"
          >
            Invite Bot
          </a>
          <a
            href={AURA_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the Aura Bot invite in a new tab"
            title="Open the Aura Bot invite in a new tab"
            className="btn-icon hidden h-10 w-10 rounded-xl sm:inline-flex"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Quick Actions ───────────────────────────────────────────────────── */

function QuickActionsCard({ onNavigate, onAction }) {
  const actions = [
    { key: "command", label: "Create Command", icon: Terminal, color: "#7C5CFF", modal: "command" },
    { key: "ticket", label: "Create Ticket", icon: Ticket, color: "#4C7DFF", modal: "ticket" },
    { key: "giveaway", label: "Create Giveaway", icon: Gift, color: "#34D399", modal: "giveaway" },
    { key: "broadcast", label: "Broadcast Message", icon: Megaphone, color: "#FBBF24", modal: "broadcast" },
    { key: "servers", label: "Manage Server", icon: Settings2, color: "#22D3EE", navigate: "servers" },
    { key: "logs", label: "View Logs", icon: FileText, color: "#94A3B8", navigate: "logs" },
  ];

  return (
    <div className="panel panel-hover relative flex flex-col p-4">
      <h3 className="micro-label mb-2.5">Quick Actions</h3>

      <div className="flex flex-col gap-1.5">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.button
              key={a.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.05, duration: 0.35, ease: EASE }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (a.navigate && onNavigate) onNavigate(a.navigate);
                else if (onAction) onAction(a);
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-2.5 py-2 text-left text-[11px] font-semibold text-slate-300 transition-colors hover:border-[#7C5CFF]/30 hover:bg-white/[0.05] hover:text-white"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                style={{ backgroundColor: `${a.color}1A`, borderColor: `${a.color}33`, color: a.color }}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 truncate">{a.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Promo ───────────────────────────────────────────────────────────── */

function PromoCard({ onNavigate }) {
  return (
    <div className="panel panel-hover relative overflow-hidden p-4">
      <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[#7C5CFF]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-[#4C7DFF]/20 blur-3xl" />

      <div className="relative flex items-start gap-3">
        <span className="icon-tile icon-tile-violet">
          <Gem className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="card-title text-[13px]">Level Up Your Server</h3>
          <p className="card-sub mt-1.5 text-[11px] leading-relaxed">
            Get access to premium features, custom commands, and more.
          </p>
        </div>
      </div>

      <button
        onClick={() => onNavigate && onNavigate("premium")}
        className="btn-glass relative mt-4 w-full rounded-xl"
        title="Open the premium plan settings"
      >
        Learn More
      </button>
    </div>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function OverviewCanvas({ onNavigate }) {
  const [timeframe, setTimeframe] = useState("7D");
  const [modalAction, setModalAction] = useState(null);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

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

  const displayName = user?.global_name || user?.username || "";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="panel fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={rise} className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* ── Main column ─────────────────────────────────────────── */}
        <motion.div variants={rise} className="flex min-w-0 flex-col gap-5 xl:col-span-9">
          {/* Welcome */}
          <motion.div variants={rise} className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display flex flex-wrap items-center gap-2.5 text-[24px] font-extrabold tracking-tight text-white md:text-[26px]">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#C4B5FD]">
                  <Hand className="h-4 w-4" />
                </span>
                <span>
                  Welcome back
                  {displayName ? (
                    <>
                      , <span className="text-white">{displayName}</span>
                    </>
                  ) : null}
                </span>
              </h2>
              <p className="mt-2 font-body text-xs text-slate-400">
                {displayName
                  ? "Here’s what’s happening with your server today."
                  : "Here’s what’s happening with your server today — you’re viewing demo data."}
              </p>
            </div>
            <span className="chip chip-green whitespace-normal leading-tight">
              <span className="status-dot status-dot-online animate-pulse-dot h-1.5 w-1.5" />
              All servers · Last 7 days
            </span>
          </motion.div>

          {/* KPI row */}
          <motion.div variants={stagger} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m, i) => (
              <KpiTile key={m.label} m={m} index={i} />
            ))}
          </motion.div>

          {/* Secondary pulse row */}
          <motion.div variants={stagger} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PULSE.map((p) => (
              <PulseTile key={p.label} p={p} />
            ))}
          </motion.div>

          {/* Chart + donut */}
          <motion.div variants={rise} className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <ActivityChart timeframe={timeframe} setTimeframe={setTimeframe} />
            </div>
            <div className="lg:col-span-4">
              <HealthCard />
            </div>
          </motion.div>

          {/* Bottom row */}
          <motion.div variants={rise} className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <TopCommandsCard onNavigate={onNavigate} />
            </div>
            <div className="lg:col-span-4">
              <RecentEventsCard onNavigate={onNavigate} />
            </div>
            <div className="lg:col-span-4">
              <ServerGrowthCard />
            </div>
          </motion.div>
        </motion.div>

        {/* ── Right rail ──────────────────────────────────────────── */}
        <motion.aside variants={rise} className="flex min-w-0 flex-col gap-5 xl:col-span-3">
          <motion.div variants={rise}>
            <BotProfileCard metrics={metrics} />
          </motion.div>

          <motion.div variants={rise}>
            <QuickActionsCard
              onNavigate={onNavigate}
              onAction={(a) => setModalAction({ title: a.label, type: a.modal })}
            />
          </motion.div>

          <motion.div variants={rise}>
            <RailActivityCard onNavigate={onNavigate} />
          </motion.div>

          <motion.div variants={rise}>
            <PromoCard onNavigate={onNavigate} />
          </motion.div>
        </motion.aside>
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
