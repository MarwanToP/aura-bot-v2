"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Shield, Clock, Save } from "lucide-react";

const SAMPLE_ROLES = [
  { id: '111111111111111111', name: 'Verified Member', color: '#10B981' },
  { id: '222222222222222222', name: 'Unverified Guest', color: '#6B7280' },
  { id: '333333333333333333', name: 'Server VIP', color: '#F59E0B' },
  { id: '444444444444444444', name: 'Moderator', color: '#3B82F6' },
];

export default function AutoRolesModule({ guildId = "default" }) {
  const [autoRoleId, setAutoRoleId] = useState('111111111111111111');
  const [autoRoleDelay, setAutoRoleDelay] = useState(0);
  const [roleSearch, setRoleSearch] = useState('');
  const selectedRole = SAMPLE_ROLES.find(r => r.id === autoRoleId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">New Module</span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5 mt-2">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            Auto Roles
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Automatically assign a role to every new member when they join.</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#5865F2]/25">
          <Save className="w-4 h-4" /> Save
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-400" /> Role Assignment</h3>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Search</label>
              <input type="text" value={roleSearch} onChange={e => setRoleSearch(e.target.value)} placeholder="Filter roles..."
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-xs text-white mt-1 focus:outline-none focus:border-[#5865F2]/50" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Select Role</label>
              <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                {SAMPLE_ROLES.filter(r => r.name.toLowerCase().includes(roleSearch.toLowerCase())).map(role => (
                  <button key={role.id} onClick={() => setAutoRoleId(role.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${autoRoleId === role.id ? 'bg-[#5865F2]/20 border border-[#5865F2]/40 text-white' : 'bg-white/[0.05] border border-white/10 text-zinc-400 hover:text-zinc-200'}`}>
                    <div className="w-3 h-3 rounded-full border-2 border-current shrink-0" style={{ color: role.color, backgroundColor: role.color + '33' }}></div>
                    <span className="flex-1 text-left">{role.name}</span>
                    {autoRoleId === role.id && <span className="text-[10px] text-cyan-400 font-mono">SELECTED</span>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Delay: {autoRoleDelay}s</label>
              <input type="range" min={0} max={300} value={autoRoleDelay} onChange={e => setAutoRoleDelay(Number(e.target.value))} className="w-full mt-1 accent-[#5865F2]" />
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> Flow</h3>
            <div className="space-y-0">
              {['Member joins server', `Wait ${autoRoleDelay}s`, `Role "${selectedRole?.name || 'Not set'}" assigned`].map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">{i + 1}</div>
                  <span className="text-xs text-zinc-300">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Configuration</h3>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Auto Role</span>
                {selectedRole ? <span className="text-xs font-bold flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedRole.color }}></span>{selectedRole.name}</span>
                  : <span className="text-xs text-amber-400 font-mono">Not configured</span>}
              </div>
              <div className="flex items-center justify-between"><span className="text-xs text-zinc-400">Delay</span><span className="text-xs font-bold text-white">{autoRoleDelay}s</span></div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Status</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${autoRoleId ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{autoRoleId ? 'ACTIVE' : 'INACTIVE'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">Tips</h3>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>• Make sure the bot role is ABOVE the auto role in hierarchy.</li>
              <li>• Use a 5-10s delay if you have verification gates.</li>
              <li>• Combine with reaction roles for self-assignable extras.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
