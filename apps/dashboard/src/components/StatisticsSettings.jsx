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

const COUNTERS = [
  { label: "Member Count", template: "👥 Members: {count}", preview: "👥 Members: 12,645" },
  { label: "Online Count", template: "🟢 Online: {count}", preview: "🟢 Online: 2,847" },
  { label: "Bot Count", template: "🤖 Bots: {count}", preview: "🤖 Bots: 18" },
];

/* ────────────────────────────── pieces ────────────────────────────── */

function MetricCard({ m, index }) {
  const count = useCountUp(m.value, { duration: 900 + index * 120 });
  const Icon = m.icon;
  const Arrow = m.up ? ArrowUpRight : ArrowDownRight;

  return (
    <motion.div variants={rise} className="panel panel-hover p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="section-label">{m.label}</span>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${m.color}1A`, color: m.color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-white tabular-nums">
        {Math.round(count).toLocaleString("en-US")}
      </div>
      <div
        className={`mt-1 flex items-center gap-1 text-[11px] font-semibold ${
          m.up ? "text-[#39D98A]" : "text-[#FF5C7A]"
        }`}
      >
        <Arrow className="h-3 w-3 shrink-0" />
        {m.change}
        <span className="font-medium text-slate-600">· {m.note}</span>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function StatisticsSettings() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <BarChart3 className="h-4 w-4" />
            </span>
            Statistics
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Server growth stats, member count channels, and voice activity for Crystal Realm.
          </p>
        </div>
        <span className="rounded-full border border-[#FFB547]/25 bg-[#FFB547]/10 px-2 py-0.5 text-[10px] font-bold text-[#FFB547]">
          PREMIUM
        </span>
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

      {/* Counter channels */}
      <motion.div variants={rise} className="panel p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
            <TrendingUp className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-white">Counter Channels Configuration</h3>
            <p className="mt-1 text-xs text-slate-500">
              Live counts refreshed every 5 minutes — no API calls wasted.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {COUNTERS.map((c) => (
            <div
              key={c.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 transition-colors hover:bg-white/[0.04]"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-white">{c.label}</div>
                <div className="mt-0.5 truncate font-mono text-[10px] text-slate-600">
                  {c.template}
                </div>
              </div>
              <span className="shrink-0 font-mono text-xs font-bold text-[#7C5CFF]">
                {c.preview}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
