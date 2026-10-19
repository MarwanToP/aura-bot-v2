"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Bell,
  ChevronDown,
  CornerDownLeft,
  LogIn,
  LogOut,
  Moon,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const SEARCH_INDEX = [
  { id: "dashboard", label: "Overview", category: "Core", icon: "📊" },
  { id: "servers", label: "Servers", category: "Manage", icon: "🌐" },
  { id: "members", label: "Members", category: "Manage", icon: "👥" },
  { id: "commands", label: "Commands", category: "Manage", icon: "⚙️" },
  { id: "modules", label: "Modules", category: "Manage", icon: "🧩" },
  { id: "automation", label: "Automation", category: "Manage", icon: "🤖" },
  { id: "tickets", label: "Tickets", category: "Manage", icon: "🎟️" },
  { id: "applications", label: "Applications", category: "Manage", icon: "📋" },
  { id: "reaction_roles", label: "Reaction Roles", category: "Engagement", icon: "🎭" },
  { id: "welcome", label: "Welcome", category: "Engagement", icon: "👋" },
  { id: "verification", label: "Verification", category: "Engagement", icon: "🛡️" },
  { id: "giveaways", label: "Giveaways", category: "Engagement", icon: "🎁" },
  { id: "social", label: "Social Alerts", category: "Engagement", icon: "📡" },
  { id: "starboard", label: "Starboard", category: "Engagement", icon: "⭐" },
  { id: "moderation", label: "Moderation", category: "Moderation", icon: "⚖️" },
  { id: "logs", label: "Logs", category: "Moderation", icon: "📝" },
  { id: "security", label: "Security", category: "Moderation", icon: "🔒" },
  { id: "voice", label: "Voice", category: "Moderation", icon: "🔊" },
  { id: "responder", label: "Auto Responder", category: "Moderation", icon: "💬" },
  { id: "templink", label: "Temp Links", category: "Moderation", icon: "🔗" },
  { id: "analytics", label: "Analytics", category: "Analytics", icon: "📊" },
  { id: "invite_tracker", label: "Invite Tracker", category: "Analytics", icon: "🔗" },
  { id: "xp_rewards", label: "XP & Rewards", category: "Analytics", icon: "⭐" },
  { id: "leaderboard", label: "Leaderboard", category: "Analytics", icon: "🏆" },
  { id: "premium", label: "Premium", category: "Settings", icon: "💎" },
  { id: "utility", label: "Utility", category: "Settings", icon: "🔧" },
  { id: "backups", label: "Backups", category: "Settings", icon: "💾" },
  { id: "embed", label: "Embed Builder", category: "Settings", icon: "🧱" },
];

export default function Header({ onNavigate, title = "Overview" }) {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  const inputRef = useRef(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const results = SEARCH_INDEX.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        setQuery("");
        setActiveIndex(0);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (paletteOpen) setTimeout(() => inputRef.current?.focus(), 30);
  }, [paletteOpen]);

  const selectResult = (item) => {
    setPaletteOpen(false);
    setQuery("");
    if (onNavigate && item) onNavigate(item.id);
  };

  return (
    <>
      <header className="glass-bar sticky top-5 z-20 flex h-[68px] items-center gap-3 rounded-[22px] border border-white/[0.08] px-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.07)] md:top-[26px] md:h-[76px] md:px-5">
        {/* Left — page context. The search field collapses (lg) and the theme
            tile hides (xl) before this title is ever allowed to truncate. */}
        <div className="min-w-0 flex-1 pr-1">
          <h1 className="font-display font-extrabold tracking-tight text-white md:text-[22px] flex-1 min-w-0">
            {title}
          </h1>
          <div className="mt-1 flex min-w-0 items-center gap-2.5">
            <p className="hidden min-w-0 truncate font-body text-[11px] text-slate-400 lg:block">
              {loading ? (
                <>Syncing your Discord session…</>
              ) : isAuthenticated ? (
                <>Your servers, live and in sync.</>
              ) : (
                <>Sign in with Discord to sync live data from your servers.</>
              )}
            </p>
            <span className="chip chip-green hidden shrink-0 xl:inline-flex">
              <span className="status-dot status-dot-online animate-pulse-dot h-1.5 w-1.5" />
              All servers · Last 7 days
            </span>
          </div>
        </div>

        {/* Right — search · notifications · profile */}
        <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
          <button
            onClick={() => setPaletteOpen(true)}
            title="Search anything (⌘K)"
            aria-label="Search anything"
            className="glass-pill group hidden h-10 cursor-pointer items-center gap-2.5 rounded-full border border-white/[0.09] bg-white/[0.045] px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:border-white/[0.16] hover:bg-white/[0.07] md:h-11 lg:flex lg:w-56 xl:w-72 2xl:w-80"
          >
            <Search className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-[#A9C2FF]" />
            <span className="flex-1 truncate text-left text-xs text-slate-500 transition-colors group-hover:text-slate-400">
              Search anything...
            </span>
            <kbd className="hidden shrink-0 rounded-md border border-white/[0.08] bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-400 xl:block">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
              title="Notifications"
              className={`btn-icon relative h-10 w-10 rounded-full ${
                notificationsOpen
                  ? "border-[#4C7DFF]/50 bg-[#4C7DFF]/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_22px_rgba(76,125,255,0.35)]"
                  : "bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              }`}
            >
              <Bell className="h-[17px] w-[17px]" />
              <span className="animate-pulse-dot absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#F87171] shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
            </button>

            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="glass-dropdown absolute right-0 z-50 mt-2 w-80 p-3 text-xs"
                >
                  <div className="mb-2 flex items-center justify-between border-b border-white/[0.07] pb-2">
                    <span className="card-title text-[13px]">Notifications</span>
                    <button className="btn-ghost px-1.5 py-1 text-[10px] text-[#7C9BFF]">
                      Mark all as read
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <div className="list-row border-white/[0.06] bg-white/[0.025]">
                      <span className="icon-tile icon-tile-violet h-8 w-8 rounded-[11px] text-sm">
                        <Rocket className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-100">Server Boosted</span>
                        <span className="block font-body text-[11px] text-slate-400">
                          @polymorphicServer boosted Crystal Realm.
                        </span>
                        <span className="mt-0.5 block text-[9px] text-slate-500">21 min ago</span>
                      </span>
                    </div>
                    <div className="list-row border-white/[0.06] bg-white/[0.025]">
                      <span className="icon-tile icon-tile-amber h-8 w-8 rounded-[11px] text-sm">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-100">Auto-Mod Flag</span>
                        <span className="block font-body text-[11px] text-slate-400">
                          Spam link detected and deleted in #general.
                        </span>
                        <span className="mt-0.5 block text-[9px] text-slate-500">45 min ago</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Theme (decorative — the app ships a single dark theme) */}
          <span
            aria-hidden="true"
            title="Dark theme"
            className="hidden h-10 w-10 cursor-default place-items-center rounded-full border border-white/[0.09] bg-white/[0.04] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] xl:grid"
          >
            <Moon className="h-[17px] w-[17px]" />
          </span>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Account menu"
              className={`glass-pill h-auto cursor-pointer items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition-colors ${
                profileOpen
                  ? "border-[#4C7DFF]/50 bg-[#4C7DFF]/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_22px_rgba(76,125,255,0.28)]"
                  : "bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/[0.16] hover:bg-white/[0.07]"
              }`}
            >
              <span className="relative shrink-0">
                <span className="avatar-ring block h-8 w-8">
                  {isAuthenticated && user?.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`}
                      alt={user.username}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0E111A] text-xs font-bold text-white">
                      {(isAuthenticated ? user?.username?.[0] : loading ? "…" : "G")?.toUpperCase() || "G"}
                    </span>
                  )}
                </span>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#080B14] ${
                    isAuthenticated ? "bg-[#34D399]" : loading ? "bg-slate-500" : "bg-[#FBBF24]"
                  }`}
                />
              </span>

              <span className="hidden min-w-0 max-w-[140px] text-left md:block">
                <span className="block truncate text-xs font-bold leading-tight text-white">
                  {isAuthenticated ? user?.username : loading ? "…" : "Guest"}
                </span>
                <span className="block truncate text-[10px] font-medium leading-tight text-slate-400">
                  {isAuthenticated ? "Discord linked" : loading ? "Checking session" : "Not linked"}
                </span>
              </span>

              <ChevronDown
                className={`hidden h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform md:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="glass-dropdown absolute right-0 z-50 mt-2 w-56 p-2 text-xs"
                >
                  <div className="mb-1 border-b border-white/[0.07] px-3 py-2">
                    <div className="font-bold text-white">
                      {isAuthenticated ? user?.username : loading ? "…" : "Guest"}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {isAuthenticated
                        ? `Discord ID · ${user?.id}`
                        : "Sign in to link your Discord account"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate("settings");
                      setProfileOpen(false);
                    }}
                    className="nav-item w-full text-left"
                  >
                    Bot Settings
                  </button>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate("premium");
                      setProfileOpen(false);
                    }}
                    className="nav-item w-full text-left"
                  >
                    Nitro &amp; Premium
                  </button>
                  <div className="my-1 h-px bg-white/[0.07]" />
                  {isAuthenticated ? (
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="nav-item w-full text-left text-[#F87171] hover:bg-[#F87171]/[0.12] hover:text-[#FCA5A5]"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Log out
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        login();
                      }}
                      className="nav-item w-full text-left text-[#7C9BFF] hover:bg-[#4C7DFF]/[0.12] hover:text-white"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      Sign in with Discord
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ⌘K Command palette */}
      {paletteOpen && (
        <div
          className="modal-scrim animate-fadeIn fixed inset-0 z-[80] flex items-start justify-center pt-28"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="modal-surface w-full max-w-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIndex((i) => Math.min(i + 1, results.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && results[activeIndex]) {
                    selectResult(results[activeIndex]);
                  }
                }}
                placeholder="Search modules, commands, logs..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
              <kbd className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                ESC
              </kbd>
            </div>

            <div className="custom-scrollbar max-h-72 overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No matching module found.
                </div>
              ) : (
                results.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => selectResult(r)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs transition-colors ${
                      i === activeIndex
                        ? "border-[#4C7DFF]/40 bg-[#4C7DFF]/15 text-white"
                        : "border-transparent text-slate-400 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.04] text-sm">
                        {r.icon}
                      </span>
                      <span>
                        <span className="block font-semibold text-slate-100">{r.label}</span>
                        <span className="text-[10px] text-slate-500">{r.category}</span>
                      </span>
                    </span>
                    <CornerDownLeft className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
