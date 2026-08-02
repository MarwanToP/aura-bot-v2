"use client";
import React from "react";
import { motion } from "framer-motion";
import { Folder, Scale, FileText, Activity, Terminal } from "lucide-react";

const CONTROL_LOGS = [
  { id: 1, action: 'Dashboard Login', user: 'Admin#0001', ip: '192.168.1.1', time: '2m ago', type: 'auth' },
  { id: 2, action: 'Settings Updated', user: 'Admin#0001', detail: 'Welcome message changed', time: '15m ago', type: 'config' },
  { id: 3, action: 'Module Toggled', user: 'Mod#002', detail: 'Leveling system disabled', time: '1h ago', type: 'config' },
  { id: 4, action: 'Backup Created', user: 'System', detail: 'Snapshot #1042 completed', time: '3h ago', type: 'system' },
  { id: 5, action: 'Command Disabled', user: 'Admin#0001', detail: '/ban disabled in #general', time: '5h ago', type: 'mod' },
];

export default function ControlPanel() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Folder className="w-5 h-5 text-purple-400" />
            Control Panel & Mod Actions
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Dashboard audit logs, configuration changes, and moderator action history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Control Panel Logs
          </h3>
          <div className="space-y-2">
            {CONTROL_LOGS.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                <div className={`p-1.5 rounded-lg ${log.type === 'auth' ? 'bg-blue-500/10 text-blue-400' : log.type === 'config' ? 'bg-purple-500/10 text-purple-400' : log.type === 'mod' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{log.action}</span>
                    <span className="text-[10px] text-zinc-500">by {log.user}</span>
                  </div>
                  {'detail' in log && <p className="text-[11px] text-zinc-400 mt-0.5">{log.detail}</p>}
                  {'ip' in log && <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{log.ip}</p>}
                </div>
                <span className="text-[10px] text-zinc-500 font-mono shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-400" />
            Mod Actions
          </h3>
          <div className="space-y-3">
            {[
              { action: 'Mass Ban Recovery', desc: 'Review and restore incorrectly banned users', icon: Scale },
              { action: 'Warning Review', desc: 'View and resolve active warnings', icon: FileText },
              { action: 'Moderator Activity', desc: 'Track moderator duty hours and actions', icon: Activity },
              { action: 'Audit Log Export', desc: 'Download complete audit trail as JSON', icon: Terminal },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.action} className="flex items-center gap-3 p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333] cursor-pointer hover:border-purple-500/30 transition-colors">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">{item.action}</span>
                    <p className="text-[10px] text-zinc-400">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
