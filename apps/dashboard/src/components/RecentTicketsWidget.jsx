"use client";

import React from "react";
import { ChevronRight, Ticket, LifeBuoy, AlertTriangle, Bug } from "lucide-react";

export default function RecentTicketsWidget() {
  const tickets = [
    { id: "#1245", type: "Support", label: "User report", time: "2m ago", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    { id: "#1244", type: "Appeal", label: "Ban appeal", time: "15m ago", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    { id: "#1243", type: "Report", label: "Member report", time: "35m ago", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    { id: "#1242", type: "Bug", label: "Bot issue", time: "1h ago", badge: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
    { id: "#1241", type: "Support", label: "Role request", time: "2h ago", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  ];

  return (
    <div className="dark-panel p-5 flex flex-col justify-between h-full border border-purple-500/20 bg-[#0d0b1d] select-none shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-white">Recent Tickets</h3>
        <button className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer">
          <span>View all</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2 flex-1">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#110e26] border border-purple-500/10 hover:border-purple-500/30 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${t.badge}`}>
                {t.type}
              </span>
              <span className="text-xs font-mono font-bold text-purple-300">
                {t.id}
              </span>
              <span className="text-xs text-zinc-300 font-medium">
                {t.label}
              </span>
            </div>

            <span className="text-[10px] font-mono text-zinc-500">
              {t.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
