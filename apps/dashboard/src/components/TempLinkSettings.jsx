"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Clock, Users, Shield, Plus, Trash2, Save } from "lucide-react";

export default function TempLinkSettings() {
  const [links, setLinks] = useState([
    { id: 1, channel: '#general', expiresIn: '1 hour', maxUses: 10, created: '2h ago' },
    { id: 2, channel: '#vip-lounge', expiresIn: '24 hours', maxUses: 5, created: '1d ago' },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Link2 className="w-5 h-5 text-purple-400" />
            Temp Link
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Generate time-limited invite links with usage caps.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">PREMIUM</span>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Link
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><Shield className="w-4 h-4 text-purple-400" /> About</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Temporary invite links auto-expire after a set duration or after reaching max uses. Perfect for events, giveaways, and limited-access channels.
          </p>
          <div className="p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
            <div className="text-[10px] font-mono text-zinc-500">Active Links</div>
            <div className="text-lg font-black text-white">{links.length}</div>
          </div>
        </div>

        <div className="lg:col-span-2 dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white">Active Temp Links</h3>
          <div className="space-y-3">
            {links.map(link => (
              <div key={link.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">{link.channel}</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />{link.expiresIn}</span>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Users className="w-3 h-3" />{link.maxUses} uses</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-mono">{link.created}</span>
                  <button aria-label="Delete link" className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
