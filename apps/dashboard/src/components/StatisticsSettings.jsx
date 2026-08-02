"use client";
import React from "react";
import { TrendingUp, Users, Activity, MessageSquare, BarChart3, Zap } from "lucide-react";

export default function StatisticsSettings() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Statistics
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Server growth stats, member count channels, and voice activity.</p>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">PREMIUM</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: '1,542', change: '+12', color: 'text-emerald-400', icon: Users },
          { label: 'Online Now', value: '384', change: '-8', color: 'text-blue-400', icon: Activity },
          { label: 'Messages Today', value: '2,847', change: '+15%', color: 'text-purple-400', icon: MessageSquare },
          { label: 'Voice Activity', value: '42', change: '+3', color: 'text-cyan-400', icon: Zap },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="dark-panel p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono text-zinc-400 font-bold uppercase">{s.label}</span>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className={`text-xs font-bold mt-1 ${s.color}`}>{s.change} this week</div>
            </div>
          );
        })}
      </div>

      <div className="dark-panel p-6">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          Counter Channels Configuration
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Member Count', channel: '👥 Members: {count}', format: '👥 Members: 1542' },
            { label: 'Online Count', channel: '🟢 Online: {count}', format: '🟢 Online: 384' },
            { label: 'Bot Count', channel: '🤖 Bots: {count}', format: '🤖 Bots: 14' },
          ].map(c => (
            <div key={c.label} className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
              <span className="text-xs font-bold text-white">{c.label}</span>
              <span className="text-xs font-mono text-purple-400">{c.format}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
