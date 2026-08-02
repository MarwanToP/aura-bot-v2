"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Ban, UserX, Clock, AlertTriangle, Search, FileText, Scale } from "lucide-react";

const RECENT_ACTIONS = [
  { id: 1, action: 'Ban', user: 'BadActor#1234', mod: 'Admin#0001', reason: 'Raid participation', time: '2h ago' },
  { id: 2, action: 'Kick', user: 'Spammer#5678', mod: 'Mod#002', reason: 'Repeated spam', time: '5h ago' },
  { id: 3, action: 'Mute', user: 'LoudUser#9012', mod: 'Mod#002', reason: 'Voice chat disruption', time: '1d ago' },
  { id: 4, action: 'Warn', user: 'NewUser#3456', mod: 'Admin#0001', reason: 'Self-promotion', time: '2d ago' },
];

const ACTION_CONFIG = {
  Ban: { icon: Ban, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  Kick: { icon: UserX, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  Mute: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  Warn: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export default function ModerationPanel() {
  const [search, setSearch] = useState('');

  const filtered = RECENT_ACTIONS.filter(a =>
    a.user.toLowerCase().includes(search.toLowerCase()) ||
    a.mod.toLowerCase().includes(search.toLowerCase()) ||
    a.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-purple-400" />
            Moderation
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Recent moderation actions, quick bans, and server safety tools.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Bans', value: 142, color: 'text-rose-400', icon: Ban },
          { label: 'Active Mutes', value: 3, color: 'text-blue-400', icon: Clock },
          { label: 'Kicks (30d)', value: 28, color: 'text-orange-400', icon: UserX },
          { label: 'Active Warnings', value: 12, color: 'text-amber-400', icon: AlertTriangle },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="dark-panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-[11px] font-mono text-zinc-400 font-bold uppercase">{s.label}</span>
              </div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="dark-panel p-5">
        <div className="relative mb-4">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, moderator, or reason..."
            className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500" />
        </div>
        <div className="space-y-2">
          {filtered.map(a => {
            const cfg = ACTION_CONFIG[a.action] || ACTION_CONFIG.Warn;
            const Icon = cfg.icon;
            return (
              <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                <span className={`p-2 rounded-lg ${cfg.bg} ${cfg.color}`}><Icon className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${cfg.color}`}>{a.action}</span>
                    <span className="text-xs text-white font-bold">{a.user}</span>
                    <span className="text-[10px] text-zinc-500">by {a.mod}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{a.reason}</p>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">{a.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
