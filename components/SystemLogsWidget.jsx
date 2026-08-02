"use client";

import React from "react";
import { UserCheck, ShieldCheck, Tag, AlertTriangle } from "lucide-react";

const logsData = [
  {
    id: 1,
    title: "Member joined",
    detail: "@Darkie_ joined the server",
    time: "Today at 6:35 PM",
    icon: UserCheck,
    iconBg: "bg-emerald-950/70 text-emerald-400 border border-emerald-500/30",
  },
  {
    id: 2,
    title: "Verification completed",
    detail: "@Phantom verified successfully",
    time: "Today at 6:33 PM",
    icon: ShieldCheck,
    iconBg: "bg-blue-950/70 text-blue-400 border border-blue-500/30",
  },
  {
    id: 3,
    title: "Button role updated",
    detail: '"Verify" role updated in #verify',
    time: "Today at 6:31 PM",
    icon: Tag,
    iconBg: "bg-amber-950/70 text-amber-400 border border-amber-500/30",
  },
  {
    id: 4,
    title: "Auto moderation",
    detail: "Message deleted in #general",
    time: "Today at 6:30 PM",
    icon: AlertTriangle,
    iconBg: "bg-rose-950/70 text-rose-400 border border-rose-500/30",
  },
];

export default function SystemLogsWidget() {
  return (
    <div className="dark-panel p-6 flex flex-col justify-between h-[340px]">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white tracking-wide">System Logs</h3>
        <button className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">
          View all
        </button>
      </div>

      {/* Logs List */}
      <div className="space-y-4 flex-1 flex flex-col justify-around">
        {logsData.map((log) => {
          const Icon = log.icon;
          return (
            <div key={log.id} className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${log.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{log.title}</div>
                  <div className="text-[11px] text-zinc-400 font-medium">{log.detail}</div>
                </div>
              </div>
              <span className="text-[10px] font-medium text-zinc-400 shrink-0">
                {log.time}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
