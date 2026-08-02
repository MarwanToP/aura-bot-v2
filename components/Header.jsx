"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Crown, Bell, LogIn, LogOut, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useAuth } from "../dashboard/context/AuthContext";

export default function Header({ onSelectTab }) {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const searchInputRef = useRef(null);

  // Notifications Mock Data
  const notifications = [
    { id: 1, title: "Server Backup Completed", time: "5m ago", type: "success", text: "Automatic snapshot saved for Crystal Kingdom." },
    { id: 2, title: "Security Alert Triggered", time: "12m ago", type: "alert", text: "Anti-raid rate limit temporarily throttled 3 accounts." },
    { id: 3, title: "Bot Updated to v2.0", time: "1h ago", type: "success", text: "Gateway shard telemetry sync is now online." },
  ];

  // Cmd+K / Ctrl+K keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="w-full bg-[#050608] border-b border-[#1a1f2e] px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      
      {/* Search Input Bar */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          ref={searchInputRef}
          id="dashboard-header-search"
          name="dashboard-header-search"
          type="text"
          placeholder="Search anything..."
          className="w-full bg-[#0b0c10] border border-[#1a1f2e] rounded-xl pl-10 pr-12 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500/60 transition-all font-medium"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#1a1f2e] text-[10px] font-mono text-zinc-400">
          ⌘K
        </div>
      </div>

      {/* Right User & Utility Controls */}
      <div className="flex items-center gap-5">
        
        {/* Gold Upgrade Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelectTab && onSelectTab("premium")}
          className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2 hover:bg-amber-500/20 transition-all shadow-lg shadow-amber-950/20 cursor-pointer"
        >
          <Crown className="w-4 h-4 fill-amber-400/20" />
          <span>Upgrade to Premium</span>
        </motion.button>

        {/* Bell Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-[#0b0c10] border border-emerald-500/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-[#050608]">
              3
            </span>
          </motion.button>

          {/* Notifications Dropdown Drawer */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 dark-panel p-4 z-50 border border-emerald-500/20 shadow-2xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                  <span className="text-xs font-extrabold text-white flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-emerald-400" /> Notifications
                  </span>
                  <button onClick={() => setShowNotifications(false)} className="text-zinc-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-[#050608] border border-emerald-500/10 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span className="flex items-center gap-1.5">
                          {n.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                          {n.title}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight">{n.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Discord Authentication Header Section */}
        <div className="flex items-center gap-3 pl-3 border-l border-emerald-500/20">
{isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={
                    user.avatarUrl ||
                    (user.avatar
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                      : "https://cdn.discordapp.com/embed/avatars/0.png")
                  }
                  alt={user.username || "Discord User"}
                  className="w-9 h-9 rounded-full object-cover border border-emerald-500/40"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#050608]" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-tight">
                  {user.global_name || user.username || "Marwan Muhammed"}
                </div>
                <div className="text-[10px] text-zinc-400 font-medium leading-tight">
                  @{user.username || "discord_user"}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="p-2 rounded-xl bg-[#0b0c10] border border-emerald-500/20 text-zinc-400 hover:text-rose-400 transition-colors ml-1"
                title="Logout from Discord"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={login}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Login with Discord</span>
            </motion.button>
          )}
        </div>

      </div>

    </header>
  );
}
