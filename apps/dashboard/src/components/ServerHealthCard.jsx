"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, ChevronRight } from "lucide-react";

export default function ServerHealthCard() {
  const metrics = [
    { label: "Security", val: 94, color: "bg-emerald-400" },
    { label: "Performance", val: 90, color: "bg-cyan-400" },
    { label: "Activity", val: 88, color: "bg-amber-400" },
    { label: "Moderation", val: 95, color: "bg-purple-400" },
    { label: "Engagement", val: 91, color: "bg-pink-400" },
  ];

  return (
    <div className="dark-panel p-5 flex flex-col justify-between h-full border border-purple-500/20 bg-[#0d0b1d] select-none">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-white">Server Health</h3>
        <button className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer">
          <span>View Full Report</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Main Gauge & Metrics Breakdown */}
      <div className="flex items-center justify-between gap-4 py-1">
        {/* Radial Progress Gauge (92 - Excellent) */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Track Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#1c1836"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Animated Gauge Ring */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              stroke="url(#healthGaugeGrad)"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray="251.2"
              initial={{ strokeDashoffset: 251.2 }}
              animate={{ strokeDashoffset: 251.2 * (1 - 0.92) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="healthGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Gauge Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-white leading-none">92</span>
            <span className="text-[9px] font-extrabold text-emerald-400 tracking-wider uppercase mt-0.5">
              Excellent
            </span>
          </div>
        </div>

        {/* Metrics Bar Breakdown */}
        <div className="flex-1 space-y-2">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-0.5">
              <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${m.color}`} />
                  {m.label}
                </span>
                <span className="font-mono text-zinc-400">{m.val}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-purple-950/60 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.val}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${m.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Pill */}
      <div className="mt-3 pt-2.5 border-t border-purple-500/10 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
        <TrendingUp className="w-3.5 h-3.5" />
        <span>+ 4 this week</span>
      </div>
    </div>
  );
}
