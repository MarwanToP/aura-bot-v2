"use client";

import React from "react";
import { MessageSquare, Terminal, Mic, UserPlus, ChevronDown, ArrowUpRight } from "lucide-react";

export default function LiveStatsPanel() {
  const stats = [
    {
      label: "Messages",
      val: "12.4M",
      change: "+15.6%",
      icon: MessageSquare,
      iconBg: "bg-purple-500/15 border-purple-500/30 text-purple-400",
    },
    {
      label: "Commands",
      val: "28.7M",
      change: "+11.3%",
      icon: Terminal,
      iconBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
    },
    {
      label: "Voice Time",
      val: "4.2M",
      change: "+8.7%",
      icon: Mic,
      iconBg: "bg-pink-500/15 border-pink-500/30 text-pink-400",
    },
    {
      label: "New Members",
      val: "1.2K",
      change: "+9.5%",
      icon: UserPlus,
      iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    },
  ];

  return (
    <div className="dark-panel p-5 flex flex-col justify-between h-full border border-purple-500/20 bg-[#0d0b1d] select-none">
      {/* Header with selector */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-white">Live Stats</h3>
        <button className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 bg-purple-950/50 border border-purple-500/20 px-2.5 py-1 rounded-lg hover:text-white transition-colors cursor-pointer">
          <span>Today</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-[#110e26] border border-purple-500/15 rounded-xl p-3 flex flex-col justify-between hover:border-purple-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg border ${s.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex items-center text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{s.change}</span>
                </div>
              </div>

              <div className="mt-3">
                <span className="text-[11px] font-semibold text-zinc-400 block">
                  {s.label}
                </span>
                <span className="text-lg font-black text-white leading-tight">
                  {s.val}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
