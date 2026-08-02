"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Sparkles, Shield, Zap, Gift, Check, Rocket, Star } from "lucide-react";

const FEATURES = [
  { icon: Zap, name: 'Priority XP Boost', desc: 'Up to 10x XP multiplier for leveling' },
  { icon: Shield, name: 'Advanced Anti-Nuke', desc: 'Real-time heat detection & auto-quarantine' },
  { icon: Star, name: 'Custom Welcome Cards', desc: 'Animated welcome images with branding' },
  { icon: Gift, name: 'Exclusive Giveaway Tools', desc: 'Multi-winner, role-restricted giveaways' },
  { icon: Rocket, name: 'Higher Rate Limits', desc: 'No daily caps on AI, economy, or commands' },
];

export default function PremiumSettings() {
  const [key, setKey] = useState('');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-amber-400" />
            Get Premium
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Unlock powerful features and higher limits.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="dark-panel p-8 space-y-6">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-amber-400" />
            Premium Features
          </h3>
          <div className="space-y-4">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.name} className="flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{f.name}</h4>
                    <p className="text-xs text-zinc-400">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dark-panel p-8 space-y-6">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            Redeem License Key
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">License Key</label>
              <input type="text" value={key} onChange={e => setKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 mt-1 font-mono text-center tracking-widest" />
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} disabled={key.length < 19}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-bold shadow-xl shadow-amber-600/30 disabled:opacity-50">
              <Rocket className="w-4 h-4 inline mr-2" /> Activate Premium
            </motion.button>
            <div className="text-center">
              <a href="#" className="text-xs text-purple-400 hover:underline">Purchase a license key →</a>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
            <h4 className="text-xs font-bold text-white mb-2">Current Plan</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Free Tier</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
