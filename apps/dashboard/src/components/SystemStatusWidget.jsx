"use client";

import React from "react";
import { CheckCircle2, ChevronRight, Activity, Server, Database, Cpu, HardDrive } from "lucide-react";

export default function SystemStatusWidget() {
  const metrics = [
    { label: "API Latency", val: "42ms", status: "Good" },
    { label: "Gateway", val: "Connected", status: "Good" },
    { label: "Database", val: "Operational", status: "Good" },
    { label: "Cache", val: "Operational", status: "Good" },
    { label: "CPU Usage", val: "32%", status: "Good" },
    { label: "Memory Usage", val: "45%", status: "Good" },
  ];

  return (
    <div className="dark-panel p-5 flex flex-col justify-between h-full border border-purple-500/20 bg-[#0d0b1d] select-none shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-white">System Status</h3>
        <button className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer">
          <span>View all</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Metrics List */}
      <div className="space-y-1.5 flex-1">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex items-center justify-between p-2 rounded-xl bg-[#110e26] border border-purple-500/10 text-xs"
          >
            <span className="font-semibold text-zinc-300">{m.label}</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-white">{m.val}</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {m.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Operational Banner */}
      <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-white leading-tight">
            All systems operational
          </h4>
          <p className="text-[10px] text-zinc-300 leading-tight">
            Everything is running smoothly.
          </p>
        </div>
      </div>
    </div>
  );
}
