"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Wrench, Palette, Tag, Sparkles, Save } from "lucide-react";

const PREDEFINED_COLORS = [
  { name: 'Red', hex: '#ED4245' }, { name: 'Blue', hex: '#5865F2' }, { name: 'Green', hex: '#57F287' },
  { name: 'Yellow', hex: '#FEE75C' }, { name: 'Orange', hex: '#FF7B2B' }, { name: 'Purple', hex: '#9B59B6' },
  { name: 'Pink', hex: '#FF69B4' }, { name: 'Cyan', hex: '#00BFFF' }, { name: 'White', hex: '#FFFFFF' },
];

export default function UtilityHub() {
  const [selectedColor, setSelectedColor] = useState('#5865F2');
  const [selfRoles, setSelfRoles] = useState([
    { id: 1, name: 'Announcements', emoji: '📢', color: '#5865F2' },
    { id: 2, name: 'Events', emoji: '🎉', color: '#57F287' },
    { id: 3, name: 'Giveaways', emoji: '🎁', color: '#FEE75C' },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-purple-400" />
            Utility, Colors & Self Roles
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Server utility tools, color roles, and self-assignable role menus.</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2">
          <Save className="w-4 h-4" /> Save
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Utility */}
        <div className="dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-purple-400" /> Utility</h3>
          <div className="space-y-3">
            {['Server Info', 'User Info', 'Avatar', 'Banner', 'Role Info', 'Channel Info'].map(cmd => (
              <div key={cmd} className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                <span className="text-xs font-bold text-white">{cmd}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">ACTIVE</span>
              </div>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><Palette className="w-4 h-4 text-purple-400" /> Color Roles</h3>
          <div className="grid grid-cols-3 gap-2">
            {PREDEFINED_COLORS.map(c => (
              <button key={c.hex} onClick={() => setSelectedColor(c.hex)}
                className={`p-3 rounded-xl border-2 text-[10px] font-bold text-white transition-all ${selectedColor === c.hex ? 'ring-2 ring-purple-500 scale-105' : 'opacity-80 hover:opacity-100'}`}
                style={{ backgroundColor: c.hex }}>
                {c.name}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500">Selected: <span style={{ color: selectedColor }}>{selectedColor}</span></p>
        </div>

        {/* Self Roles */}
        <div className="dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><Tag className="w-4 h-4 text-purple-400" /> Self-Assignable Roles</h3>
          <div className="space-y-2">
            {selfRoles.map(role => (
              <div key={role.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                <span className="text-lg">{role.emoji}</span>
                <span className="text-xs font-bold text-white flex-1">{role.name}</span>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
