"use client";

import React from "react";
import { Zap, Shield, ArrowUpRight, Check } from "lucide-react";

export default function MemberBoostCard() {
  const recentBoosters = [
    { name: "Crystal#0001", count: "+2 🚀" },
    { name: "Nebula#0420", count: "+1 🚀" },
    { name: "Ethereal#0110", count: "+1 🚀" },
    { name: "Starlight#0007", count: "+1 🚀" },
    { name: "Infinity#9999", count: "+1 🚀" },
  ];

  const perks = [
    "Custom Role",
    "100MB File Upload",
    "Custom Server Banner",
    "Priority Support",
  ];

  return (
    <div className="dark-panel p-5 border border-purple-500/20 bg-[#0d0b1d] select-none h-full shadow-lg flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            Member Boost Server
          </h3>
          <p className="text-[11px] text-zinc-400">Reward and engage your boosters.</p>
        </div>
        <button className="text-[11px] font-bold text-zinc-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-lg hover:text-white hover:border-purple-500/50 transition-all cursor-pointer">
          Configure
        </button>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-3 gap-3 my-2">
        <div className="bg-[#110e26] border border-purple-500/15 p-3 rounded-xl">
          <span className="text-[10px] text-zinc-400 font-semibold block">Total Boosts (This Month)</span>
          <span className="text-lg font-black text-white block mt-0.5">482</span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +12.4%
          </span>
        </div>

        <div className="bg-[#110e26] border border-purple-500/15 p-3 rounded-xl">
          <span className="text-[10px] text-zinc-400 font-semibold block">Active Boosters</span>
          <span className="text-lg font-black text-white block mt-0.5">128</span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +8.7%
          </span>
        </div>

        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/30 border border-pink-500/30 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-pink-300 font-semibold block">Boost Level</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-pink-400 fill-pink-400" />
            <span className="text-base font-black text-white">Level 3</span>
          </div>
          <span className="text-[10px] text-purple-300 font-mono">14 Boosts</span>
        </div>
      </div>

      {/* Grid: Recent Boosts + Boost Perks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
        {/* Recent Boosts List */}
        <div className="bg-[#110e26] border border-purple-500/15 p-3 rounded-xl space-y-2">
          <span className="text-[11px] font-extrabold text-purple-300 block mb-1">Recent Boosts</span>
          {recentBoosters.map((b) => (
            <div key={b.name} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium truncate">{b.name} boosted the server</span>
              <span className="text-[10px] font-mono font-bold text-pink-400 px-1.5 py-0.5 rounded bg-pink-500/10 border border-pink-500/20 shrink-0">
                {b.count}
              </span>
            </div>
          ))}
        </div>

        {/* Boost Perks Checklist */}
        <div className="bg-[#110e26] border border-purple-500/15 p-3 rounded-xl space-y-2">
          <span className="text-[11px] font-extrabold text-purple-300 block mb-1">Boost Perks (Level 3)</span>
          <div className="space-y-1.5 text-xs">
            {perks.map((p) => (
              <div key={p} className="flex items-center gap-2 text-zinc-300 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                </div>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
