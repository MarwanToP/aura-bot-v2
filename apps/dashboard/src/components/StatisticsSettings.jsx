"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Activity,
  MessageSquare,
  BarChart3,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
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

/* ────────────────────────────── static data ────────────────────────────── */

const METRICS = [
  {
    label: "Total Members",
    value: 12645,
    change: "+312",
    note: "this week",
    up: true,
    color: "#39D98A",
    icon: Users,
  },
  {
    label: "Online Now",
    value: 2847,
    change: "-126",
    note: "since noon",
    up: false,
    color: "#5B8CFF",
    icon: Activity,
  },
  {
    label: "Messages Today",
    value: 18432,
    change: "+11%",
    note: "vs yesterday",
    up: true,
    color: "#7C5CFF",
    icon: MessageSquare,
  },
  {
    label: "Voice Activity",
    value: 412,
    change: "+38",
    note: "this week",
    up: true,
    color: "#58BFC5",
    icon: Zap,
  },
];

/* Icon-tile tone per metric (presentation only — same order as METRICS). */
const TONES = ["icon-tile-green", "icon-tile-blue", "icon-tile-violet", "icon-tile-cyan"];

const COUNTERS = [
  { label: "Member Count", template: "👥 Members: {count}", preview: "👥 Members: 12,645" },
  { label: "Online Count", template: "🟢 Online: {count}", preview: "🟢 Online: 2,847" },
  { label: "Bot Count", template: "🤖 Bots: {count}", preview: "🤖 Bots: 18" },
];

/* Derived from METRICS — no invented numbers. */
const MEMBERS = METRICS.find((m) => m.label === "Total Members")?.value ?? 0;
const ONLINE = METRICS.find((m) => m.label === "Online Now")?.value ?? 0;
const OFFLINE = Math.max(0, MEMBERS - ONLINE);
const ONLINE_PCT = MEMBERS > 0 ? (ONLINE / MEMBERS) * 100 : 0;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * 52;

/* ────────────────────────────── pieces ────────────────────────────── */

function MetricCard({ m, index }) {
  const count = useCountUp(m.value, { duration: 900 + index * 120 });
  const Icon = m.icon;
  const Arrow = m.up ? ArrowUpRight : ArrowDownRight;
  const tone = TONES[index % TONES.length];

  return (
    <motion.div variants={rise} className="kpi-tile">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="kpi-label">{m.label}</div>
          <div className="kpi-value mt-2 tabular-nums">
            {Math.round(count).toLocaleString("en-US")}
          </div>
        </div>
        <span className={`icon-tile ${tone} h-10 w-10 rounded-[14px]`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {m.change ? (
          <span className={m.up ? "delta-up" : "delta-down"}>
            <Arrow className="h-3 w-3" />
            {m.change}
          </span>
        ) : null}
        <span className="micro-label">{m.note}</span>
      </div>
    </motion.div>
  );
}

function PresenceDonut() {
  const arc = (ONLINE_PCT / 100) * DONUT_CIRCUMFERENCE;

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="aura-presence" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4C7DFF" />
            <stop offset="100%" stopColor="#7C5CFF" />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="11"
        />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="url(#aura-presence)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${DONUT_CIRCUMFERENCE}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="kpi-value text-[22px]">{ONLINE_PCT.toFixed(1)}%</span>
        <span className="micro-label mt-1">online</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function StatisticsSettings() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-blue h-10 w-10 rounded-[14px]">
            <BarChart3 className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[17px]">Statistics</h2>
            <p className="card-sub mt-1 max-w-xl">
              Server growth stats, member count channels, and voice activity for Crystal Realm.
            </p>
          </div>
        </div>
        <span className="chip chip-amber">Premium</span>
      </motion.div>

      {/* Metrics */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {METRICS.map((m, i) => (
          <MetricCard key={m.label} m={m} index={i} />
        ))}
      </motion.div>

      {/* Presence chart + counter channels */}
      <motion.div variants={rise} className="grid gap-4 lg:grid-cols-3">
        <section className="glass-card rounded-[20px] p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-cyan h-10 w-10 rounded-[14px]">
              <Activity className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Member Presence</h3>
              <p className="card-sub mt-0.5">Share of members online right now.</p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-5">
            <PresenceDonut />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="chart-legend-dot bg-[#4C7DFF] text-[#4C7DFF]" />
                <span className="text-xs text-slate-300">Online now</span>
                <span className="ml-auto text-xs font-bold text-white tabular-nums">
                  {ONLINE.toLocaleString("en-US")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="chart-legend-dot bg-white/20 text-white/20" />
                <span className="text-xs text-slate-300">Offline</span>
                <span className="ml-auto text-xs font-bold text-white tabular-nums">
                  {OFFLINE.toLocaleString("en-US")}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-[20px] p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-violet h-10 w-10 rounded-[14px]">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Counter Channels Configuration</h3>
              <p className="card-sub mt-0.5">Live counts refreshed every 5 minutes — no API calls wasted.</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {COUNTERS.map((c) => (
              <div key={c.label} className="list-row">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white">{c.label}</div>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                    {c.template}
                  </div>
                </div>
                <span className="chip chip-violet shrink-0 font-mono">{c.preview}</span>
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
}
