"use client";

import React, { useState } from "react";
import { ClipboardList, Plus, CheckCircle, XCircle, FileText, UserCheck } from "lucide-react";

export default function ApplicationSettings() {
  const [apps, setApps] = useState([
    { id: "1", title: "Staff Moderator Application", status: "Active", submissions: 24 },
    { id: "2", title: "Event Host Application", status: "Active", submissions: 9 },
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-purple-400" />
            Staff Applications Hub (appy.bot)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Build multi-question staff application forms with interactive Accept / Deny button actions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {apps.map((a) => (
          <div key={a.id} className="dark-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2333] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">{a.title}</h3>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">{a.status}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
              <span className="text-zinc-400">Submissions Received:</span>
              <span className="text-purple-400 font-bold">{a.submissions} Submissions</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
