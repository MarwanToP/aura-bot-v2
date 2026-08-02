"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Server, Bell, User, Sparkles, Moon, Headphones, ChevronDown, Check, LogOut, Settings } from "lucide-react";

export default function Navbar({ activeGuild, onSelectGuild, user }) {
  const [isGuildDropdownOpen, setIsGuildDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const guilds = [
    { id: "1", name: "Aura Central Community", icon: <Sparkles className="w-4 h-4 text-[#5865F2]" />, members: "14.2k" },
    { id: "2", name: "Cyberpunk Haven", icon: <Moon className="w-4 h-4 text-cyan-400" />, members: "8.9k" },
    { id: "3", name: "Lofi Beats Lounge", icon: <Headphones className="w-4 h-4 text-emerald-400" />, members: "24.1k" },
  ];

  const currentGuild = guilds.find((g) => g.id === activeGuild) || guilds[0];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#09090b]/50 backdrop-blur-3xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4),inset_0_-1px_0_0_rgba(255,255,255,0.05)] px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Server Selection */}
        <div className="flex items-center gap-6">
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5865F2] via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-[#5865F2]/25">
              <div className="w-full h-full bg-[#09090b]/90 rounded-[15px] flex items-center justify-center backdrop-blur-xl">
                <Sparkles className="w-5 h-5 text-white drop-shadow-[0_0_10px_rgba(88,101,242,0.8)]" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
                AURA <span className="text-[11px] px-2.5 py-0.5 rounded-full ios-glass-pill text-[#5865F2] border border-[#5865F2]/40 font-mono font-bold tracking-wider">v2.0 iOS</span>
              </span>
            </div>
          </motion.div>

          {/* Server Picker Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02, translateY: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsGuildDropdownOpen(!isGuildDropdownOpen)}
              className="hidden md:flex items-center gap-2.5 ios-glass-pill px-4 py-2 rounded-2xl hover:border-white/30 transition-all"
            >
              <div className="p-1 rounded-lg bg-white/10 flex items-center justify-center">
                {currentGuild.icon}
              </div>
              <span className="text-xs font-bold text-zinc-100">{currentGuild.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-300 ${isGuildDropdownOpen ? "rotate-180" : ""}`} />
            </motion.button>

            <AnimatePresence>
              {isGuildDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.94 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-0 mt-3 w-64 rounded-3xl ios-glass-dropdown p-2.5 z-50 space-y-1"
                >
                  <div className="px-3 py-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold border-b border-white/10 mb-1">
                    Select Workspace
                  </div>
                  {guilds.map((g) => (
                    <motion.button
                      key={g.id}
                      whileHover={{ scale: 1.01, x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onSelectGuild(g.id);
                        setIsGuildDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs transition-all ${
                        g.id === currentGuild.id
                          ? "bg-[#5865F2]/25 text-white font-bold border border-[#5865F2]/40 shadow-lg shadow-[#5865F2]/20"
                          : "text-zinc-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-xl bg-white/10 border border-white/10">
                          {g.icon}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold truncate text-white">{g.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{g.members} members</div>
                        </div>
                      </div>
                      {g.id === currentGuild.id && <Check className="w-4 h-4 text-cyan-400" />}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right System Indicators & Profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(16,185,129,0.3)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-mono text-[11px] tracking-wide">SHARD #1 ONLINE</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="relative p-2.5 rounded-2xl ios-glass-pill hover:bg-white/15 text-zinc-200 transition-colors"
          >
            <Bell className="w-4 h-4 text-zinc-200" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#5865F2] ring-2 ring-[#09090b]" />
          </motion.button>

          {/* User Profile Avatar Drawer Trigger */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-3 border-l border-white/15 cursor-pointer"
            >
              <img
                src={user?.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"}
                alt="User Avatar"
                className="w-9 h-9 rounded-full border-2 border-white/20 shadow-md object-cover"
              />
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-white">{user?.username || "Aura Developer"}</div>
                <div className="text-[10px] text-cyan-400 font-mono font-medium">Guild Owner</div>
              </div>
            </motion.button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.94 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full right-0 mt-3 w-60 rounded-3xl ios-glass-dropdown p-3 z-50 space-y-2"
                >
                  <div className="px-3 py-2 border-b border-white/10">
                    <div className="text-xs font-bold text-white">{user?.username || "Aura Developer"}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">devadmin@aurabot.gg</div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02, x: 2 }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-cyan-400" />
                    <span>Account Settings</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, x: 2 }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs text-rose-400 hover:bg-rose-500/15 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout Session</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </header>
  );
}
