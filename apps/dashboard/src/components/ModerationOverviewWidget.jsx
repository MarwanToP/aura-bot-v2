"use client";

import React from "react";
import { ChevronRight, ArrowUpRight, ShieldAlert, UserX, AlertCircle } from "lucide-react";

export default function ModerationOverviewWidget() {
  const stats = [
    { label: "Bans", val: "124", change: "+12.5%" },
    { label: "Mutes", val: "342", change: "+8.3%" },
    { label: "Warnings", val: "1.2K", change: "+5.6%" },
    { label: "Kicks", val: "214", change: "+3.7%" },
  ];

  const recentActions = [
    { target: "@Spammer#0001", action: "was banned", mod: "by Marwan", time: "2m ago" },
    { target: "@ToxicUser1337", action: "was muted", mod: "by Aura Bot", time: "15m ago" },
    { target: "@BadUser#8909", action: "was warned", mod: "by Marwan", time: "35m ago" },
  ];

  return (
    <div className="dark-panel p-5 flex flex-col justify-between h-full border border-purple-500/20 bg-[#0d0b1d] select-none shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-white">Moderation Overview</h3>
        <button className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer">
          <span>View all</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* 4 Action Counts */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#110e26] border border-purple-500/15 p-2 rounded-xl text-center">
            <span className="text-[10px] text-zinc-400 font-semibold block">{s.label}</span>
            <span className="text-base font-black text-white block mt-0.5">{s.val}</span>
            <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center justify-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-2.5 h-2.5" /> {s.change}
            </span>
          </div>
        ))}
      </div>

      {/* Recent Actions Feed */}
      <div className="space-y-2 flex-1">
        <span className="text-[11px] font-extrabold text-purple-300 block mb-1">Recent Actions</span>
        {recentActions.map((a, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#110e26] border border-purple-500/10 text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="text-purple-300 font-mono font-bold">{a.target}</span>
              <span className="text-zinc-300">{a.action}</span>
              <span className="text-zinc-500 text-[11px]">{a.mod}</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-2">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
