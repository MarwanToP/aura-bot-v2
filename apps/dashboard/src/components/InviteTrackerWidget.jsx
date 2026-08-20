"use client";

import React from "react";
import { ChevronRight, ArrowUpRight, Crown, Link } from "lucide-react";

export default function InviteTrackerWidget() {
  const topInvites = [
    { rank: 1, user: "@Crystal#0001", count: 842 },
    { rank: 2, user: "@Nebula#0420", count: 521 },
    { rank: 3, user: "@Ethereal#0110", count: 413 },
    { rank: 4, user: "@Starlight#0007", count: 312 },
    { rank: 5, user: "@Infinity#9999", count: 271 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full select-none">
      {/* Invite Tracker Stats Card */}
      <div className="dark-panel p-5 flex flex-col justify-between border border-purple-500/20 bg-[#0d0b1d] shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-extrabold text-white">Invite Tracker</h3>
          <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
            This Month
          </span>
        </div>

        <div className="my-2">
          <span className="text-[11px] text-zinc-400 font-semibold block">Total Invites</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">3,427</span>
            <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +12.8%
            </span>
          </div>
        </div>

        {/* Top Inviter Pill */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#110e26] border border-purple-500/15">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-zinc-400 font-semibold block">Top Inviter</span>
              <span className="text-xs font-bold text-white">@Crystal#0001</span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-purple-300">
            842 invites
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold block">Conversion Rate</span>
            <span className="text-sm font-black text-white">24.7%</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center">
            <ArrowUpRight className="w-3 h-3" /> +8.6%
          </span>
        </div>
      </div>

      {/* Top Invites Leaderboard Card */}
      <div className="dark-panel p-5 flex flex-col justify-between border border-purple-500/20 bg-[#0d0b1d] shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-extrabold text-white">Top Invites</h3>
          <button className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer">
            <span>View all</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2 flex-1">
          {topInvites.map((item) => (
            <div
              key={item.user}
              className="flex items-center justify-between p-2 rounded-xl bg-[#110e26] border border-purple-500/10 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-purple-400 w-4 text-center">
                  {item.rank}
                </span>
                <span className="font-bold text-white">{item.user}</span>
              </div>
              <span className="font-mono font-bold text-zinc-300">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
