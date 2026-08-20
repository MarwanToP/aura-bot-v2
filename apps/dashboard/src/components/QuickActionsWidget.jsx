"use client";

import React from "react";
import { Terminal, Gift, Ticket, Send, Server, FileText, ChevronRight } from "lucide-react";

export default function QuickActionsWidget() {
  const actions = [
    { name: "Create Command", icon: Terminal, color: "from-purple-600/30 to-purple-800/30 border-purple-500/40 text-purple-300" },
    { name: "Create Giveaway", icon: Gift, color: "from-blue-600/30 to-blue-800/30 border-blue-500/40 text-blue-300" },
    { name: "Create Ticket", icon: Ticket, color: "from-violet-600/30 to-violet-800/30 border-violet-500/40 text-violet-300" },
    { name: "Broadcast Message", icon: Send, color: "from-amber-600/30 to-amber-800/30 border-amber-500/40 text-amber-300" },
    { name: "Manage Servers", icon: Server, color: "from-emerald-600/30 to-emerald-800/30 border-emerald-500/40 text-emerald-300" },
    { name: "View Logs", icon: FileText, color: "from-cyan-600/30 to-cyan-800/30 border-cyan-500/40 text-cyan-300" },
  ];

  return (
    <div className="dark-panel p-5 flex flex-col justify-between h-full border border-purple-500/20 bg-[#0d0b1d] select-none shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-white">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.name}
              className={`flex items-center justify-between p-3 rounded-xl bg-gradient-to-r ${a.color} border hover:scale-[1.02] transition-all cursor-pointer shadow-md group`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold text-white leading-tight text-left">
                  {a.name}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
