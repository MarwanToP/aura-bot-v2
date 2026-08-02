"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Clock, Shield, Save, RotateCcw } from "lucide-react";

const SAMPLE_ROLES = [
  { id: '111111111111111111', name: 'Verified Member', color: '#10B981' },
  { id: '222222222222222222', name: 'Unverified Guest', color: '#6B7280' },
  { id: '333333333333333333', name: 'Server VIP', color: '#F59E0B' },
  { id: '444444444444444444', name: 'Moderator', color: '#3B82F6' },
];

export default function AutoRolesSettings() {
  const [autoRoleId, setAutoRoleId] = useState('111111111111111111');
  const [autoRoleDelay, setAutoRoleDelay] = useState(0);
  const [roleSearch, setRoleSearch] = useState('');

  const filteredRoles = SAMPLE_ROLES.filter(r =>
    r.name.toLowerCase().includes(roleSearch.toLowerCase())
  );
  const selectedRole = SAMPLE_ROLES.find(r => r.id === autoRoleId);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-purple-400" />
            Auto Roles (MEE6 / ProBot Style)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Automatically assign a role to every new member when they join your server.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Config */}
        <div className="space-y-6">
          <div className="dark-panel p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              Role Assignment
            </h3>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Search Role</label>
              <input type="text" value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Type to filter roles..."
                className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Select Auto Role</label>
              <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                {filteredRoles.map((role) => (
                  <button key={role.id} onClick={() => setAutoRoleId(role.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${autoRoleId === role.id ? 'bg-purple-600/20 border border-purple-500/40 text-white' : 'bg-[#0b0d14] border border-[#1e2333] text-zinc-400 hover:text-zinc-200'}`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current shrink-0" style={{ color: role.color, backgroundColor: role.color + '33' }}></div>
                    <span>{role.name}</span>
                    {autoRoleId === role.id && (
                      <span className="ml-auto text-[10px] text-purple-400 font-mono">SELECTED</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Assignment Delay (seconds)</label>
              <div className="flex items-center gap-3 mt-1">
                <input type="range" min={0} max={300} value={autoRoleDelay} onChange={(e) => setAutoRoleDelay(Number(e.target.value))} className="flex-1 accent-purple-500" />
                <span className="text-xs font-mono text-white font-bold w-12 text-right">{autoRoleDelay}s</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">Delay before the role is automatically assigned. Set to 0 for instant assignment.</p>
            </div>
          </div>

          <div className="dark-panel p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              What happens when a member joins?
            </h3>
            <div className="bg-[#0b0d14] rounded-xl p-4 border border-[#1e2333] space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0 mt-0.5">1</div>
                <div>
                  <p className="text-xs font-bold text-white">Member joins the server</p>
                  <p className="text-[10px] text-zinc-500">Discord gateway triggers the guildMemberAdd event</p>
                </div>
              </div>
              <div className="border-l-2 border-[#1e2333] ml-3 h-4"></div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0 mt-0.5">2</div>
                <div>
                  <p className="text-xs font-bold text-white">Wait {autoRoleDelay} seconds</p>
                  <p className="text-[10px] text-zinc-500">Configurable delay to allow other automations to run first</p>
                </div>
              </div>
              <div className="border-l-2 border-[#1e2333] ml-3 h-4"></div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0 mt-0.5">3</div>
                <div>
                  <p className="text-xs font-bold text-white">
                    Role <span style={{ color: selectedRole?.color }}>{selectedRole?.name || 'Not selected'}</span> assigned
                  </p>
                  <p className="text-[10px] text-zinc-500">Auto role is applied to the new member</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="space-y-6">
          <div className="dark-panel p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white">Current Configuration</h3>
            <div className="bg-[#0b0d14] rounded-xl p-4 border border-[#1e2333] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Auto Role</span>
                {selectedRole ? (
                  <span className="text-xs font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedRole.color }}></span>
                    {selectedRole.name}
                  </span>
                ) : (
                  <span className="text-xs text-amber-400 font-mono">Not configured</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Delay</span>
                <span className="text-xs font-bold text-white">{autoRoleDelay}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Status</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${autoRoleId ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {autoRoleId ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
          </div>

          <div className="dark-panel p-5">
            <h3 className="text-sm font-extrabold text-white mb-3">Pro Tips</h3>
            <ul className="space-y-2">
              {[
                'Make sure the bot role is ABOVE the auto role in your server role hierarchy.',
                'Use a delay of 5-10 seconds if you have verification gates that need to complete first.',
                'Auto roles work well combined with reaction roles for self-assignable additional roles.',
                'You can set multiple auto roles by stacking automations in the Modules Hub.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                  <span className="text-purple-400 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
