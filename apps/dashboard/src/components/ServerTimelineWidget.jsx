"use client";

import React from "react";
import { ChevronRight, UserPlus, Tag, Ticket, ShieldAlert, Ban } from "lucide-react";

export default function ServerTimelineWidget() {
  const events = [
    {
      icon: UserPlus,
      color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      title: "Member joined",
      desc: "@Shadow#9427 joined the server",
      time: "2m ago",
    },
    {
      icon: Tag,
      color: "text-amber-400 bg-amber-500/15 border-amber-500/30",
      title: "Role created",
      desc: "Moderator role was created",
      time: "15m ago",
    },
    {
      icon: Ticket,
      color: "text-purple-400 bg-purple-500/15 border-purple-500/30",
      title: "Ticket created",
      desc: "#1245 - User report",
      time: "35m ago",
    },
    {
      icon: ShieldAlert,
      color: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30",
      title: "Raid detected",
      desc: "Anti-raid system activated",
      time: "1h ago",
    },
    {
      icon: Ban,
      color: "text-pink-400 bg-pink-500/15 border-pink-500/30",
      title: "Member banned",
      desc: "@Spammer#0001 was banned",
      time: "2h ago",
    },
  ];

  return (
    <div className="dark-panel p-5 flex flex-col justify-between h-full border border-purple-500/20 bg-[#0d0b1d] select-none shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-white">Server Timeline</h3>
        <button className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer">
          <span>View all</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2.5 flex-1">
        {events.map((e, idx) => {
          const Icon = e.icon;
          return (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#110e26] border border-purple-500/10 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg border ${e.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {e.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    {e.desc}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-zinc-500">
                {e.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
