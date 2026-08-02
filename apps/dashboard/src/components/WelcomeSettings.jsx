"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, Palette, Image, Type, Move, Eye, Save, RefreshCw } from "lucide-react";

const CARD_TEMPLATES = [
  { id: 'default', name: 'Classic', gradient: 'from-indigo-600 to-purple-700' },
  { id: 'ocean', name: 'Ocean', gradient: 'from-cyan-500 to-blue-700' },
  { id: 'sunset', name: 'Sunset', gradient: 'from-orange-500 to-rose-600' },
  { id: 'forest', name: 'Forest', gradient: 'from-emerald-500 to-teal-700' },
  { id: 'midnight', name: 'Midnight', gradient: 'from-slate-800 to-zinc-900' },
  { id: 'neon', name: 'Neon', gradient: 'from-fuchsia-600 to-violet-800' },
];

const PLACEHOLDER_AVATAR = 'https://cdn.discordapp.com/embed/avatars/0.png';

export default function WelcomeSettings() {
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [farewellEnabled, setFarewellEnabled] = useState(true);
  const [welcomeChannel, setWelcomeChannel] = useState('#welcome');
  const [farewellChannel, setFarewellChannel] = useState('#goodbye');
  const [welcomeMsg, setWelcomeMsg] = useState('Welcome {user} to {guild}!');
  const [farewellMsg, setFarewellMsg] = useState('Goodbye {user}, we will miss you!');
  const [showCard, setShowCard] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [cardColor, setCardColor] = useState('#FFFFFF');
  const [avatarX, setAvatarX] = useState(50);
  const [avatarY, setAvatarY] = useState(50);
  const [textX, setTextX] = useState(150);
  const [textY, setTextY] = useState(150);
  const [username, setUsername] = useState('NewMember');
  const [serverName, setServerName] = useState('Aura Server');

  const template = CARD_TEMPLATES.find(t => t.id === selectedTemplate) || CARD_TEMPLATES[0];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-purple-400" />
            Welcome & Goodbye Designer (ProBot Style)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Design animated welcome cards, customize messages, and set farewell embeds.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Settings */}
        <div className="space-y-6">
          {/* Welcome Toggle */}
          <div className="dark-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white">Welcome Messages</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={welcomeEnabled} onChange={(e) => setWelcomeEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-zinc-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>
            {welcomeEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Channel</label>
                  <input type="text" value={welcomeChannel} onChange={(e) => setWelcomeChannel(e.target.value)} className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 mt-1" />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Message (use {'{user}'}, {'{guild}'}, {'{memberCount}'})</label>
                  <textarea value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)} rows={3} className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 mt-1 resize-none" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Show Welcome Card</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={showCard} onChange={(e) => setShowCard(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-zinc-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Farewell Toggle */}
          <div className="dark-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white">Goodbye / Farewell Messages</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={farewellEnabled} onChange={(e) => setFarewellEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-zinc-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>
            {farewellEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Channel</label>
                  <input type="text" value={farewellChannel} onChange={(e) => setFarewellChannel(e.target.value)} className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 mt-1" />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Farewell Message</label>
                  <textarea value={farewellMsg} onChange={(e) => setFarewellMsg(e.target.value)} rows={3} className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 mt-1 resize-none" />
                </div>
              </div>
            )}
          </div>

          {/* Card Designer */}
          <div className="dark-panel p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              Welcome Card Designer
            </h3>
            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Card Template</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {CARD_TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold text-white transition-all ${selectedTemplate === t.id ? 'ring-2 ring-purple-500 scale-105' : 'opacity-70 hover:opacity-100'} bg-gradient-to-br ${t.gradient}`}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Text Color</label>
              <div className="flex items-center gap-3 mt-1">
                <input type="color" value={cardColor} onChange={(e) => setCardColor(e.target.value)} className="w-10 h-10 rounded-xl border border-[#1e2333] bg-transparent cursor-pointer" />
                <span className="text-xs font-mono text-zinc-400">{cardColor}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Avatar X</label>
                <input type="range" min={10} max={200} value={avatarX} onChange={(e) => setAvatarX(Number(e.target.value))} className="w-full mt-1 accent-purple-500" />
                <span className="text-[10px] text-zinc-500">{avatarX}px</span>
              </div>
              <div>
                <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Avatar Y</label>
                <input type="range" min={10} max={200} value={avatarY} onChange={(e) => setAvatarY(Number(e.target.value))} className="w-full mt-1 accent-purple-500" />
                <span className="text-[10px] text-zinc-500">{avatarY}px</span>
              </div>
              <div>
                <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Text X</label>
                <input type="range" min={10} max={400} value={textX} onChange={(e) => setTextX(Number(e.target.value))} className="w-full mt-1 accent-purple-500" />
                <span className="text-[10px] text-zinc-500">{textX}px</span>
              </div>
              <div>
                <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Text Y</label>
                <input type="range" min={10} max={300} value={textY} onChange={(e) => setTextY(Number(e.target.value))} className="w-full mt-1 accent-purple-500" />
                <span className="text-[10px] text-zinc-500">{textY}px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              Live Card Preview
            </h3>
            <div className="flex items-center gap-2">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="bg-[#0b0d14] border border-[#1e2333] rounded-lg px-3 py-1.5 text-[11px] text-white w-28 focus:outline-none focus:border-purple-500" />
              <input type="text" value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder="Server" className="bg-[#0b0d14] border border-[#1e2333] rounded-lg px-3 py-1.5 text-[11px] text-white w-28 focus:outline-none focus:border-purple-500" />
            </div>
          </div>

          <div className={`relative w-full h-64 rounded-2xl bg-gradient-to-br ${template.gradient} overflow-hidden shadow-2xl border border-white/10`}>
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>

            {/* Avatar */}
            <div className="absolute rounded-full border-4 border-white/30 shadow-xl overflow-hidden" style={{ left: `${avatarX}px`, top: `${avatarY}px`, width: 64, height: 64 }}>
              <img src={PLACEHOLDER_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
            </div>

            {/* Username */}
            <div className="absolute font-extrabold text-lg drop-shadow-lg" style={{ left: `${textX}px`, top: `${textY}px`, color: cardColor }}>
              {username}
            </div>

            {/* Welcome text */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <span className="text-white/80 text-xs font-semibold tracking-wider uppercase" style={{ color: cardColor }}>
                Welcome to {serverName}
              </span>
            </div>

            {/* Member count badge */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm text-white text-[10px] font-mono font-bold">
              Member #1,542
            </div>
          </div>

          <div className="dark-panel p-4 space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-purple-400" />
              Message Preview
            </h4>
            <div className="bg-[#0b0d14] rounded-xl p-3 border border-[#1e2333]">
              <p className="text-xs text-zinc-300 leading-relaxed">
                {welcomeMsg.replace('{user}', `<@${username}>`).replace('{guild}', serverName).replace('{memberCount}', '1,542')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Variables Reference */}
      <div className="dark-panel p-5">
        <h3 className="text-sm font-extrabold text-white mb-3">Available Variables</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['{user}', '@mentions the new member'],
            ['{username}', 'The member\'s username'],
            ['{guild}', 'Server name'],
            ['{memberCount}', 'Total member count'],
            ['{userTag}', 'Username#0000'],
            ['{age}', 'Account age in days'],
            ['{createdAt}', 'Account creation date'],
            ['{joinedAt}', 'Join date'],
          ].map(([varName, desc]) => (
            <div key={varName} className="flex items-center gap-2 p-2 rounded-lg bg-[#0b0d14] border border-[#1e2333]">
              <code className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{varName}</code>
              <span className="text-[10px] text-zinc-500">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
