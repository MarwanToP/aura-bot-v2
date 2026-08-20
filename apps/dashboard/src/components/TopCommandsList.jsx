"use client";

import React from "react";
import { ShieldCheck, HelpCircle, Music, Ticket, Ban, ChevronRight } from "lucide-react";

export default function TopCommandsList() {
  const commands = [
    { rank: 1, name: "/verify", uses: "6.42M uses", icon: ShieldCheck, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { rank: 2, name: "/help", uses: "5.11M uses", icon: HelpCircle, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { rank: 3, name: "/play", uses: "4.21M uses", icon: Music, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
    { rank: 4, name: "/ticket", uses: "3.56M uses", icon: Ticket, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { rank: 5, name: "/ban", uses: "2.91M uses", icon: Ban, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  ];

  return (
    <div className="dark-panel p-5 flex flex-col justify-between h-full border border-purple-500/20 bg-[#0d0b1d] select-none shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-white">Top Commands</h3>
        <button className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer">
          <span>View all</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2.5 flex-1">
        {commands.map((cmd) => {
          const Icon = cmd.icon;
          return (
            <div
              key={cmd.name}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#110e26] border border-purple-500/10 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-zinc-500 w-4 text-center">
                  {cmd.rank}
                </span>
                <div className={`p-1.5 rounded-lg border ${cmd.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-mono font-bold text-white">
                  {cmd.name}
                </span>
              </div>

              <span className="text-[11px] font-mono font-bold text-amber-400">
                {cmd.uses}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
