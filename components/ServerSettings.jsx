"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Globe, Hash, Shield, Clock, Save } from "lucide-react";

export default function ServerSettings() {
  const [prefix, setPrefix] = useState('!');
  const [lang, setLang] = useState('en');
  const [timezone, setTimezone] = useState('UTC');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-purple-400" />
            Server Settings
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Configure global server preferences for Aura Bot.</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2">
          <Save className="w-4 h-4" /> Save
        </motion.button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><Hash className="w-4 h-4 text-purple-400" /> Bot Configuration</h3>
          <div>
            <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Command Prefix</label>
            <input type="text" value={prefix} onChange={e => setPrefix(e.target.value)} maxLength={3}
              className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white mt-1 focus:outline-none focus:border-purple-500 w-20" />
          </div>
          <div>
            <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Default Language</label>
            <select value={lang} onChange={e => setLang(e.target.value)}
              className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white mt-1 focus:outline-none focus:border-purple-500">
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>
        <div className="dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-purple-400" /> Regional</h3>
          <div>
            <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Timezone</label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)}
              className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white mt-1 focus:outline-none focus:border-purple-500">
              <option value="UTC">UTC</option>
              <option value="US/Eastern">US/Eastern</option>
              <option value="US/Pacific">US/Pacific</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Berlin">Europe/Berlin</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-zinc-400">Server time: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
