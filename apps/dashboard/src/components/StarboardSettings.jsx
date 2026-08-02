"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Heart, TrendingUp, Save } from "lucide-react";

const STARRED_MESSAGES = [
  { id: 1, author: 'Luna', content: 'This community is absolutely amazing! 🎉', stars: 24, channel: '#general' },
  { id: 2, author: 'Astra', content: 'Check out this incredible artwork I found...', stars: 18, channel: '#art' },
  { id: 3, author: 'Nexus', content: 'Thank you everyone for the warm welcome! 🙏', stars: 15, channel: '#introductions' },
  { id: 4, author: 'Pixel', content: 'New update is looking fantastic, great work team!', stars: 12, channel: '#updates' },
];

export default function StarboardSettings() {
  const [threshold, setThreshold] = useState(3);
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Star className="w-5 h-5 text-purple-400" />
            Starboard
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Highlight the best messages with a starboard channel.</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2">
          <Save className="w-4 h-4" /> Save
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="dark-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">Settings</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-zinc-700 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
          <div>
            <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Star Threshold: {threshold}</label>
            <input type="range" min={1} max={20} value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="w-full mt-2 accent-purple-500" />
            <p className="text-[10px] text-zinc-500 mt-1">Messages need {threshold}+ stars to appear on the starboard.</p>
          </div>
          <div className="p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
            <div className="text-[10px] font-mono text-zinc-500">Channel</div>
            <div className="text-xs font-bold text-white">#starboard</div>
          </div>
        </div>

        <div className="lg:col-span-2 dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-purple-400" /> Top Starred Messages</h3>
          <div className="space-y-3">
            {STARRED_MESSAGES.map(msg => (
              <div key={msg.id} className="p-4 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{msg.author}</span>
                      <span className="text-[10px] text-zinc-500">{msg.channel}</span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-3 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="text-sm font-black">{msg.stars}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
