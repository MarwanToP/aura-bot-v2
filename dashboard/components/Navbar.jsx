"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Server,
  Bell,
  User,
  Sparkles,
  ChevronDown,
  Activity,
  Menu,
  X,
  Check,
  LogOut,
  Settings,
  Key,
  ExternalLink,
  Info,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DEFAULT_GUILD_LIST = [
  { id: "939799976308011018", name: "Aura Central Community", members: "14.8k Members", icon: "🌌" },
  { id: "102837465918273645", name: "Cyberpunk Syndicate", members: "8.2k Members", icon: "⚡" },
  { id: "564738291029384756", name: "Dev Testing Sandbox", members: "1.4k Members", icon: "🛠️" },
  { id: "884930291048572910", name: "Creator Lounge", members: "5.6k Members", icon: "🎨" },
];

const NOTIFICATIONS = [
  { id: 1, title: "Anti-Nuke Shield Armed", time: "2m ago", type: "success" },
  { id: 2, title: "Quarantine Vault: 1 User Isolated", time: "14m ago", type: "warning" },
  { id: 3, title: "Shard 01 Latency Nominal (18ms)", time: "1h ago", type: "info" },
];

export default function Navbar({
  activeGuildId,
  onSelectGuild,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  onSelectTab,
}) {
  const { user, isAuthenticated, loading, guilds, login, logout } = useAuth();
  const [isGuildDropdownOpen, setIsGuildDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const displayGuilds = guilds && guilds.length > 0 ? guilds : DEFAULT_GUILD_LIST;
  const currentGuildId = activeGuildId || (displayGuilds[0] ? displayGuilds[0].id : "");
  const activeGuild = displayGuilds.find((g) => g.id === currentGuildId) || displayGuilds[0];

  const guildDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (guildDropdownRef.current && !guildDropdownRef.current.contains(event.target)) {
        setIsGuildDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGuildChange = (guild) => {
    setIsGuildDropdownOpen(false);
    if (typeof onSelectGuild === "function") {
      onSelectGuild(guild.id);
    }
  };

  const userAvatar = user?.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png";
  const userName = user?.global_name || user?.username || "DevAdmin#0001";
  const userRole = user?.isDeveloper ? "Bot Developer" : isAuthenticated ? "Verified Discord User" : "Guest User";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#09090b]/80 backdrop-blur-xl px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Mobile Menu & Server Selection */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl bg-white/[0.03] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Brand */}
          <div
            onClick={() => onSelectTab && onSelectTab("overview")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5865F2] to-cyan-400 p-[1px] shadow-lg shadow-[#5865F2]/20 group-hover:shadow-[#5865F2]/40 transition-shadow">
              <div className="w-full h-full bg-[#09090b] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#5865F2] group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                AURA <span className="text-xs px-2 py-0.5 rounded-full bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 font-mono">v2.0</span>
              </span>
            </div>
          </div>

          {/* Active Guild Selector Dropdown */}
          <div className="relative" ref={guildDropdownRef}>
            <button
              onClick={() => setIsGuildDropdownOpen(!isGuildDropdownOpen)}
              className="flex items-center gap-2.5 bg-white/[0.04] border border-white/10 hover:border-[#5865F2]/50 rounded-xl px-3 py-1.5 cursor-pointer transition-colors"
            >
              {activeGuild.iconUrl ? (
                <img src={activeGuild.iconUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span className="text-sm">{activeGuild.icon || "🌌"}</span>
              )}
              <div className="text-left hidden sm:block">
                <span className="text-xs font-semibold text-zinc-200 block truncate max-w-[140px]">
                  {activeGuild.name}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block">
                  {activeGuild.members || (activeGuild.owner ? "Owner Permission" : "Administrator")}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isGuildDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Guild Selection Popover */}
            <AnimatePresence>
              {isGuildDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#09090b]/95 border border-white/10 backdrop-blur-xl shadow-2xl p-2 z-50 space-y-1"
                >
                  <div className="px-3 py-2 text-[10px] font-mono text-zinc-400 uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
                    <span>Select Active Guild</span>
                    <span className="text-[9px] text-[#5865F2]">{displayGuilds.length} Available</span>
                  </div>
                  {displayGuilds.map((guild) => {
                    const isSelected = guild.id === activeGuild.id;
                    return (
                      <button
                        key={guild.id}
                        onClick={() => handleGuildChange(guild)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#5865F2]/15 text-white border border-[#5865F2]/30"
                            : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {guild.iconUrl ? (
                            <img src={guild.iconUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <span className="text-sm">{guild.icon || "🌌"}</span>
                          )}
                          <div className="text-left truncate">
                            <div className="font-semibold truncate">{guild.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {guild.members || (guild.owner ? "Owner" : "Admin")}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#5865F2] shrink-0" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right System Indicators & Profile / Authentication */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Status Indicator Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] tracking-wide">SYSTEM ONLINE</span>
            <span className="text-[10px] text-emerald-500/70 border-l border-emerald-500/20 pl-2 font-mono">18ms</span>
          </div>

          {/* Notifications Bell Button */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              aria-label="View Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#5865F2] animate-pulse" />
            </button>

            {/* Notifications Popover */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#09090b]/95 border border-white/10 backdrop-blur-xl shadow-2xl p-3 z-50 space-y-2"
                >
                  <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5">
                    <span className="text-xs font-bold text-white">Telemetry Alerts</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5865F2]/20 text-[#5865F2]">
                      3 New
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {NOTIFICATIONS.map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs flex items-start gap-2.5"
                      >
                        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-zinc-200 font-medium">{n.title}</p>
                          <span className="text-[10px] text-zinc-500 font-mono">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Authentication State Render */}
          {!isAuthenticated ? (
            <button
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold shadow-lg shadow-[#5865F2]/25 transition-all duration-200 cursor-pointer active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Connect Discord</span>
            </button>
          ) : (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-white/10 cursor-pointer group"
              >
                <div className="relative">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-8 h-8 rounded-full border border-[#5865F2]/50 object-cover group-hover:border-cyan-400 transition-colors"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#09090b]" />
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                    <span>{userName}</span>
                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{userRole}</span>
                  </div>
                </div>
              </button>

              {/* Profile Menu Popover */}
              <AnimatePresence>
                {isUserDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#09090b]/95 border border-white/10 backdrop-blur-xl shadow-2xl p-2 z-50 space-y-1"
                  >
                    <div className="px-3 py-2 border-b border-white/5">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        {userName}
                        {user?.isDeveloper && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            DEV
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono truncate">
                        ID: {user?.id}
                      </p>
                    </div>

                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer">
                      <User className="w-4 h-4 text-cyan-400" />
                      <span>Account Details</span>
                    </button>
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer">
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>Authorized Guilds ({displayGuilds.length})</span>
                    </button>

                    <div className="border-t border-white/5 pt-1">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect Discord</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
