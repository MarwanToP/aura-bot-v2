"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, Palette, Eye, Save, Image, Type } from "lucide-react";

const CARD_TEMPLATES = [
  { id: 'default', name: 'Classic', gradient: 'from-indigo-600 to-purple-700' },
  { id: 'ocean', name: 'Ocean', gradient: 'from-cyan-500 to-blue-700' },
  { id: 'sunset', name: 'Sunset', gradient: 'from-orange-500 to-rose-600' },
  { id: 'neon', name: 'Neon', gradient: 'from-fuchsia-600 to-violet-800' },
];

export default function WelcomeModule({ guildId = "default" }) {
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [farewellEnabled, setFarewellEnabled] = useState(true);
  const [welcomeMsg, setWelcomeMsg] = useState('Welcome {user} to {guild}!');
  const [farewellMsg, setFarewellMsg] = useState('Goodbye {user}, we will miss you!');
  const [showCard, setShowCard] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [cardColor, setCardColor] = useState('#FFFFFF');
  const [username, setUsername] = useState('NewMember');
  const [serverName, setServerName] = useState('Aura Server');
  const template = CARD_TEMPLATES.find(t => t.id === selectedTemplate) || CARD_TEMPLATES[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">New Module</span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5 mt-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            Welcome & Goodbye Designer
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Design welcome cards, customize join/leave messages with live preview.</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#5865F2]/25">
          <Save className="w-4 h-4" /> Save Settings
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel */}
        <div className="space-y-6">
          {/* Welcome */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Welcome Messages</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={welcomeEnabled} onChange={e => setWelcomeEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-[#5865F2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            {welcomeEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Channel</label>
                  <input type="text" defaultValue="#welcome" className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-xs text-white mt-1 focus:outline-none focus:border-[#5865F2]/50" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Message</label>
                  <textarea value={welcomeMsg} onChange={e => setWelcomeMsg(e.target.value)} rows={3} className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-xs text-white mt-1 resize-none focus:outline-none focus:border-[#5865F2]/50" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Show Card</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={showCard} onChange={e => setShowCard(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-[#5865F2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Farewell */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Goodbye / Farewell</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={farewellEnabled} onChange={e => setFarewellEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-[#5865F2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            {farewellEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Channel</label>
                  <input type="text" defaultValue="#goodbye" className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-xs text-white mt-1 focus:outline-none focus:border-[#5865F2]/50" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Message</label>
                  <textarea value={farewellMsg} onChange={e => setFarewellMsg(e.target.value)} rows={3} className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-xs text-white mt-1 resize-none focus:outline-none focus:border-[#5865F2]/50" />
                </div>
              </div>
            )}
          </div>

          {/* Card Designer */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Palette className="w-4 h-4 text-cyan-400" /> Card Designer</h3>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Template</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {CARD_TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold text-white transition-all ${selectedTemplate === t.id ? 'ring-2 ring-[#5865F2] scale-105' : 'opacity-60 hover:opacity-100'} bg-gradient-to-br ${t.gradient}`}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Text Color</span>
              <input type="color" value={cardColor} onChange={e => setCardColor(e.target.value)} className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
              <span className="text-[10px] font-mono text-zinc-400">{cardColor}</span>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Eye className="w-4 h-4 text-cyan-400" /> Live Preview</h3>
          <div className="flex items-center gap-3 mb-3">
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white w-28 focus:outline-none focus:border-[#5865F2]/50" placeholder="Username" />
            <input type="text" value={serverName} onChange={e => setServerName(e.target.value)} className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white w-28 focus:outline-none focus:border-[#5865F2]/50" placeholder="Server" />
          </div>
          <div className={`relative w-full h-56 rounded-2xl bg-gradient-to-br ${template.gradient} overflow-hidden shadow-2xl border border-white/10`}>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute rounded-full border-4 border-white/30 shadow-xl overflow-hidden" style={{ left: 50, top: 50, width: 64, height: 64 }}>
              <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute font-extrabold text-lg drop-shadow-lg" style={{ left: 150, top: 50, color: cardColor }}>
              {username}
            </div>
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <span className="text-white/80 text-xs font-semibold tracking-wider uppercase" style={{ color: cardColor }}>Welcome to {serverName}</span>
            </div>
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm text-white text-[10px] font-mono font-bold">Member #1,542</div>
          </div>
        </div>
      </div>

      {/* Variables */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-3">Available Variables</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[['{user}', '@mentions'], ['{username}', 'Username'], ['{guild}', 'Server name'], ['{memberCount}', 'Member count']].map(([v, d]) => (
            <div key={v} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <code className="text-[10px] font-bold text-cyan-400">{v}</code>
              <span className="text-[10px] text-zinc-500">{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
