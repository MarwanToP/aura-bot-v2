"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Award, Zap, TrendingUp, Crown, Save } from "lucide-react";

const LEVEL_REWARDS = [
  { level: 5, role: 'Server Regular', color: '#10B981' },
  { level: 10, role: 'Chat Enthusiast', color: '#3B82F6' },
  { level: 25, role: 'VIP Member', color: '#F59E0B' },
  { level: 50, role: 'Elite Supporter', color: '#ED4245' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Luna', level: 47, xp: 28450, avatar: '🌙' },
  { rank: 2, name: 'Astra', level: 42, xp: 25120, avatar: '⭐' },
  { rank: 3, name: 'Nexus', level: 38, xp: 22300, avatar: '🔷' },
  { rank: 4, name: 'Pixel', level: 35, xp: 19800, avatar: '🎮' },
  { rank: 5, name: 'Storm', level: 31, xp: 17650, avatar: '⚡' },
];

export default function LevelingSettings() {
  const [xpMultiplier, setXpMultiplier] = useState(1.0);
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-purple-400" />
            Leveling System
          </h2>
          <p className="text-xs text-zinc-400 mt-1">XP multipliers, level-up rewards, and leaderboard.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">PREMIUM</span>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2">
            <Save className="w-4 h-4" /> Save
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="dark-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" /> XP Settings</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-zinc-700 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">XP Multiplier: {xpMultiplier}x</label>
              <input type="range" min={0.1} max={10} step={0.1} value={xpMultiplier} onChange={e => setXpMultiplier(parseFloat(e.target.value))} className="w-full mt-2 accent-purple-500" />
            </div>
          </div>

          <div className="dark-panel p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><Award className="w-4 h-4 text-purple-400" /> Level Rewards</h3>
            <div className="space-y-2">
              {LEVEL_REWARDS.map(r => (
                <div key={r.level} className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                  <span className="text-xs font-bold text-white">Level {r.level}</span>
                  <span className="text-xs font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }}></span>
                    {r.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-purple-400" /> Leaderboard</h3>
          <div className="space-y-2">
            {LEADERBOARD.map(u => (
              <div key={u.rank} className="flex items-center gap-3 p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${u.rank <= 3 ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {u.rank <= 3 ? <Crown className="w-4 h-4" /> : `#${u.rank}`}
                </span>
                <span className="text-lg">{u.avatar}</span>
                <span className="text-xs font-bold text-white flex-1">{u.name}</span>
                <span className="text-xs text-purple-400 font-mono">Lvl {u.level}</span>
                <span className="text-[10px] text-zinc-500 font-mono">{u.xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
