"use client";

import React, { useState } from "react";
import { Sparkles, ShieldCheck, UserCheck, FileText, LogOut, ChevronRight } from "lucide-react";

export default function ActiveAutomationWidget() {
  const [toggles, setToggles] = useState({
    welcome: true,
    verification: true,
    autorole: true,
    log: true,
    leave: true,
  });

  const toggleModule = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const modules = [
    { key: "welcome", name: "Welcome System", icon: Sparkles, iconBg: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { key: "verification", name: "Verification System", icon: ShieldCheck, iconBg: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { key: "autorole", name: "Autorole System", icon: UserCheck, iconBg: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { key: "log", name: "Log System", icon: FileText, iconBg: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
    { key: "leave", name: "Leave System", icon: LogOut, iconBg: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  ];

  return (
    <div className="dark-panel p-5 flex flex-col justify-between h-full border border-purple-500/20 bg-[#0d0b1d] select-none shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-white">Active Automation</h3>
        <button className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer">
          <span>View all</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2.5 flex-1">
        {modules.map((m) => {
          const Icon = m.icon;
          const isEnabled = toggles[m.key];
          return (
            <div
              key={m.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#110e26] border border-purple-500/10 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg border ${m.iconBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-white">
                  {m.name}
                </span>
              </div>

              {/* Interactive Toggle Switch */}
              <button
                onClick={() => toggleModule(m.key)}
                className={`relative w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                  isEnabled ? "bg-emerald-500" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
