"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import ServerRail from "../components/ServerRail";
import MetricsGrid from "../components/MetricsGrid";
import LiveConsole from "../components/LiveConsole";
import ModuleSettings from "../components/ModuleSettings";
import AnalyticsChart from "../components/AnalyticsChart";

import dynamic from "next/dynamic";

const ModuleLoading = () => (
  <div className="p-12 text-center text-xs font-mono text-zinc-400 animate-pulse bg-white/[0.02] rounded-2xl border border-white/10 flex items-center justify-center gap-3">
    <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
    <span>Loading Module Telemetry...</span>
  </div>
);

const SecurityModule = dynamic(() => import("../components/modules/SecurityModule"), { loading: ModuleLoading });
const ModerationModule = dynamic(() => import("../components/modules/ModerationModule"), { loading: ModuleLoading });
const VerificationModule = dynamic(() => import("../components/modules/VerificationModule"), { loading: ModuleLoading });
const TicketingModule = dynamic(() => import("../components/modules/TicketingModule"), { loading: ModuleLoading });
const VoiceModule = dynamic(() => import("../components/modules/VoiceModule"), { loading: ModuleLoading });
const SocialAlertsModule = dynamic(() => import("../components/modules/SocialAlertsModule"), { loading: ModuleLoading });
const GamificationModule = dynamic(() => import("../components/modules/GamificationModule"), { loading: ModuleLoading });
const GrowthModule = dynamic(() => import("../components/modules/GrowthModule"), { loading: ModuleLoading });
const CountersModule = dynamic(() => import("../components/modules/CountersModule"), { loading: ModuleLoading });
const GovernanceModule = dynamic(() => import("../components/modules/GovernanceModule"), { loading: ModuleLoading });
const WelcomeModule = dynamic(() => import("../components/modules/WelcomeModule"), { loading: ModuleLoading });
const AutoRolesModule = dynamic(() => import("../components/modules/AutoRolesModule"), { loading: ModuleLoading });
const EmbedModule = dynamic(() => import("../components/modules/EmbedModule"), { loading: ModuleLoading });
const LogsModule = dynamic(() => import("../components/modules/LogsModule"), { loading: ModuleLoading });
const GiveawayModule = dynamic(() => import("../components/modules/GiveawayModule"), { loading: ModuleLoading });
const TimedMessagesModule = dynamic(() => import("../components/modules/TimedMessagesModule"), { loading: ModuleLoading });

import {
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Ticket,
  Mic,
  Radio,
  Sparkles,
  UserPlus,
  Hash,
  Vote,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  X,
  Sliders,
  LogIn,
  Palette,
  FileText,
  Gift,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LandingHero from "../components/LandingHero";

// Unified Navigation Matrix Configuration
const NAVIGATION_TABS = [
  {
    id: "overview",
    name: "Overview & Telemetry",
    desc: "Real-time monitoring, metrics grid, analytics & module control hub.",
    icon: LayoutDashboard,
    category: "Core Telemetry",
    badge: "Live",
    color: "#06b6d4",
  },
  {
    id: "security",
    name: "Security & Anti-Nuke",
    desc: "Anti-Nuke defense, heat accumulation engine, quarantine vault & raid filters.",
    icon: ShieldAlert,
    category: "Perimeter Shield",
    badge: "Armed",
    color: "#f43f5e",
  },
  {
    id: "moderation",
    name: "Moderation & Audit",
    desc: "AutoMod rules, multi-action punishment matrix & immutable audit logging.",
    icon: ShieldCheck,
    category: "Perimeter Shield",
    badge: "Active",
    color: "#f59e0b",
  },
  {
    id: "verification",
    name: "Verification Gateway",
    desc: "Multi-factor captcha, Discord OAuth2 gateway & alt-account threat analysis.",
    icon: UserCheck,
    category: "Perimeter Shield",
    badge: "Captcha",
    color: "#06b6d4",
  },
  {
    id: "ticketing",
    name: "Ticketing & Applications",
    desc: "Multi-panel ticket system, staff application builders, CSAT & transcripts.",
    icon: Ticket,
    category: "Operations",
    badge: "CSAT 4.8",
    color: "#a855f7",
  },
  {
    id: "voice",
    name: "Voice Topologies",
    desc: "Ephemeral join-to-create voice channels & Rich Presence naming rules.",
    icon: Mic,
    category: "Operations",
    badge: "Dynamic",
    color: "#14b8a6",
  },
  {
    id: "social",
    name: "Social Alerts & Alerts",
    desc: "Automated YouTube, Twitch, RSS & Twitter dispatch matrix.",
    icon: Radio,
    category: "Automation",
    badge: "Polling",
    color: "#eab308",
  },
  {
    id: "gamification",
    name: "Gamification & Economy",
    desc: "Custom rank cards, XP multipliers, daily rewards & server coin store.",
    icon: Sparkles,
    category: "Automation",
    badge: "XP Sync",
    color: "#ec4899",
  },
  {
    id: "growth",
    name: "Growth & Invites",
    desc: "Invite attribution metrics, Fake Invite Shield & rank reward roles.",
    icon: UserPlus,
    category: "Analytics",
    badge: "Tracking",
    color: "#10b981",
  },
  {
    id: "counters",
    name: "Server Counter Channels",
    desc: "Dynamic stats channels for members, bots, roles & goal milestones.",
    icon: Hash,
    category: "Analytics",
    badge: "Live",
    color: "#3b82f6",
  },
  {
    id: "governance",
    name: "Polls & Governance",
    desc: "Server voting ballots, candidate election portals & community proposals.",
    icon: Vote,
    category: "Operations",
    badge: "Ballots",
    color: "#8b5cf6",
  },
  {
    id: "welcome",
    name: "Welcome & Goodbye",
    desc: "Design welcome cards, customize join/leave messages with live preview.",
    icon: UserCheck,
    category: "Engagement",
    badge: "New",
    color: "#10b981",
  },
  {
    id: "autoroles",
    name: "Auto Roles",
    desc: "Automatically assign a role to every new member when they join.",
    icon: UserPlus,
    category: "Engagement",
    badge: "New",
    color: "#f59e0b",
  },
  {
    id: "embed",
    name: "Embed Builder",
    desc: "Design rich Discord embeds with live preview, fields, images, and colors.",
    icon: Palette,
    category: "Content",
    badge: "New",
    color: "#ec4899",
  },
  {
    id: "logs",
    name: "Moderation Logs",
    desc: "Browse all moderation actions with search, filtering, and pagination.",
    icon: FileText,
    category: "Audit",
    badge: "New",
    color: "#3b82f6",
  },
  {
    id: "giveaway",
    name: "Giveaways",
    desc: "Create, manage, and end giveaways directly from the dashboard.",
    icon: Gift,
    category: "Engagement",
    badge: "New",
    color: "#a855f7",
  },
  {
    id: "timedmessages",
    name: "Timed Messages",
    desc: "Schedule messages to repeat in channels at set intervals.",
    icon: Clock,
    category: "Content",
    badge: "New",
    color: "#14b8a6",
  },
];

export default function DashboardHome() {
  const { isAuthenticated, login, activeGuildId: authGuildId, setActiveGuildId: setAuthGuildId } = useAuth();
  const [viewMode, setViewMode] = useState("landing");
  const [activeTab, setActiveTab] = useState("overview");
  const [localGuildId, setLocalGuildId] = useState("939799976308011018");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const topTabsRef = useRef(null);

  const activeGuildId = authGuildId || localGuildId;
  const setActiveGuildId = (id) => {
    setLocalGuildId(id);
    if (typeof setAuthGuildId === "function") setAuthGuildId(id);
    setViewMode("dashboard");
  };

  const scrollTabs = (direction) => {
    if (topTabsRef.current) {
      topTabsRef.current.scrollBy({
        left: direction === "left" ? -250 : 250,
        behavior: "smooth",
      });
    }
  };

  const currentTabInfo = NAVIGATION_TABS.find((t) => t.id === activeTab) || NAVIGATION_TABS[0];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    setViewMode("dashboard");
  };

  if (viewMode === "landing" && !isAuthenticated) {
    return (
      <LandingHero
        onEnterDashboard={() => setViewMode("dashboard")}
        onLogin={login}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col relative overflow-x-hidden">
      
      {/* Background Cyber Mesh & Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-[#5865F2]/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[650px] h-[650px] rounded-full bg-cyan-500/10 blur-[170px]" />
        <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[140px]" />
      </div>

      {/* Navigation Header Navbar */}
      <Navbar
        activeGuildId={activeGuildId}
        onSelectGuild={(id) => setActiveGuildId(id)}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onSelectTab={handleSelectTab}
      />

      {/* Main Workspace Layout (Server Rail + Sidebar + Main Panel) */}
      <div className="flex flex-1 relative z-10 max-w-[1600px] w-full mx-auto">
        
        {/* Left Vertical Server Selection Rail */}
        <ServerRail
          activeGuildId={activeGuildId}
          onSelectGuild={(id) => setActiveGuildId(id)}
        />

        {/* Desktop Cyber Glassmorphism Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-[#09090b]/80 backdrop-blur-xl p-4 shrink-0 space-y-6 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto">
          
          <div className="px-2 pt-2 flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
              NAVIGATION MATRIX
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              17 MODULES
            </span>
          </div>

          <div className="space-y-1">
            {NAVIGATION_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer group relative ${
                    isActive
                      ? "bg-white/[0.08] text-white font-semibold border border-white/15 shadow-md shadow-black/40"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Left Active Glow Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#5865F2]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-3 truncate pl-1">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-cyan-400" : "text-zinc-400 group-hover:text-zinc-200"
                      }`}
                    />
                    <span className="truncate">{tab.name}</span>
                  </div>

                  {tab.badge && (
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${
                        isActive
                          ? "bg-[#5865F2]/20 border-[#5865F2]/40 text-white"
                          : "bg-zinc-800/80 border-zinc-700/60 text-zinc-400"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick System Telemetry Card in Sidebar */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-medium">Gateway Shard</span>
                <span className="text-emerald-400 font-mono font-bold">#01 OK</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#5865F2] to-cyan-400 h-full w-[94%]" />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>CPU: 4.2%</span>
                <span>RAM: 342MB</span>
              </div>
            </div>
          </div>

        </aside>

        {/* Mobile Responsive Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
              />

              {/* Mobile Drawer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-72 bg-[#09090b] border-r border-white/10 backdrop-blur-2xl p-5 z-50 overflow-y-auto md:hidden space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <span className="font-bold text-sm text-white tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    NAVIGATION MATRIX
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl bg-white/[0.05] text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Server Selector */}
                <div className="pb-3 border-b border-white/10 space-y-2">
                  <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                    SELECT SERVER
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { id: "939799976308011018", name: "Aura Central", icon: "🌌" },
                      { id: "102837465918273645", name: "Cyberpunk", icon: "⚡" },
                      { id: "564738291029384756", name: "Dev Sandbox", icon: "🛠️" },
                      { id: "884930291048572910", name: "Creator Lounge", icon: "🎨" },
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setActiveGuildId(g.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all ${
                          activeGuildId === g.id
                            ? "bg-[#5865F2] text-white font-bold shadow-md shadow-[#5865F2]/20"
                            : "bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1]"
                        }`}
                      >
                        <span>{g.icon}</span>
                        <span>{g.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  {NAVIGATION_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleSelectTab(tab.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs transition-all ${
                          isActive
                            ? "bg-[#5865F2] text-white font-semibold shadow-lg shadow-[#5865F2]/25"
                            : "text-zinc-300 hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{tab.name}</span>
                        </div>
                        {tab.badge && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-black/30 border border-white/10">
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 w-full px-4 sm:px-8 py-6 relative z-10 space-y-6">
          
          {/* Top Quick Tab Selector Bar (Horizontal Scrollable with Controls) */}
          <div className="relative flex items-center gap-2 border-b border-white/10 pb-2">
            <button
              onClick={() => scrollTabs("left")}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Scroll tabs left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div
              ref={topTabsRef}
              className="flex items-center gap-2 overflow-x-auto scroll-smooth scrollbar-none py-0.5 flex-1"
            >
              {NAVIGATION_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer relative shrink-0 ${
                      isActive
                        ? "bg-white/[0.08] text-white border border-white/20 shadow-md"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="topTabActivePill"
                        className="absolute inset-0 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/50 pointer-events-none"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={`w-3.5 h-3.5 relative z-10 ${
                        isActive ? "text-cyan-400" : "text-zinc-400"
                      }`}
                    />
                    <span className="relative z-10">{tab.name}</span>
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={() => scrollTabs("right")}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Scroll tabs right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Active Tab Hero Header Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {currentTabInfo.category}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  GUILD ID: {activeGuildId}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                {currentTabInfo.name}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
                {currentTabInfo.desc}
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
              <a
                href="https://discord.com/oauth2/authorize"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs shadow-lg shadow-[#5865F2]/25 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Bot to Server
              </a>
            </div>
          </motion.div>

          {/* Discord Authentication Verification Banner (Guest Mode) */}
          {!isAuthenticated && (
            <div className="bg-gradient-to-r from-[#5865F2]/20 via-purple-500/10 to-cyan-500/20 border border-[#5865F2]/40 rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#5865F2] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#5865F2]/40">
                  <LogIn className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Verify Discord Account & Link Dashboard
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5865F2]/30 text-white border border-[#5865F2]/50">
                      OAuth2 Gateway
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1 max-w-xl">
                    Connect your Discord account to verify ownership, sync your server administrator privileges, and access live bot settings.
                  </p>
                </div>
              </div>
              <button
                onClick={login}
                className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs shadow-xl shadow-[#5865F2]/30 transition-all duration-200 flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Login with Discord</span>
              </button>
            </div>
          )}

          {/* Tab Views with Seamless Framer Motion Page Transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-8"
            >
              {/* TAB 0: OVERVIEW */}
              {activeTab === "overview" && (
                <>
                  {/* 1. Telemetry Metrics Grid */}
                  <MetricsGrid />

                  {/* 2 & 3. Analytics Chart & Live Console Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <AnalyticsChart />
                    </div>
                    <div className="lg:col-span-1">
                      <LiveConsole />
                    </div>
                  </div>

                  {/* 4. Unified Module Control Hub */}
                  <ModuleSettings onSelectModule={handleSelectTab} />
                </>
              )}

              {/* TAB 1: SECURITY & ANTI-NUKE */}
              {activeTab === "security" && (
                <SecurityModule guildId={activeGuildId} />
              )}

              {/* TAB 2: MODERATION & AUDIT */}
              {activeTab === "moderation" && (
                <ModerationModule guildId={activeGuildId} />
              )}

              {/* TAB 3: VERIFICATION GATEWAY */}
              {activeTab === "verification" && (
                <VerificationModule guildId={activeGuildId} />
              )}

              {/* TAB 4: TICKETING & APPLICATIONS */}
              {activeTab === "ticketing" && (
                <TicketingModule guildId={activeGuildId} />
              )}

              {/* TAB 5: VOICE TOPOLOGIES */}
              {activeTab === "voice" && (
                <VoiceModule guildId={activeGuildId} />
              )}

              {/* TAB 6: SOCIAL ALERTS & NOTIFICATIONS */}
              {activeTab === "social" && (
                <SocialAlertsModule guildId={activeGuildId} />
              )}

              {/* TAB 7: GAMIFICATION & ECONOMY */}
              {activeTab === "gamification" && (
                <GamificationModule guildId={activeGuildId} />
              )}

              {/* TAB 8: GROWTH & INVITE ANALYTICS */}
              {activeTab === "growth" && (
                <GrowthModule guildId={activeGuildId} />
              )}

              {/* TAB 9: SERVER COUNTER CHANNELS */}
              {activeTab === "counters" && (
                <CountersModule guildId={activeGuildId} />
              )}

              {/* TAB 10: POLLS & GOVERNANCE */}
              {activeTab === "governance" && (
                <GovernanceModule guildId={activeGuildId} />
              )}
              {/* TAB 11: WELCOME & GOODBYE */}
              {activeTab === "welcome" && (
                <WelcomeModule guildId={activeGuildId} />
              )}
              {/* TAB 12: AUTO ROLES */}
              {activeTab === "autoroles" && (
                <AutoRolesModule guildId={activeGuildId} />
              )}
              {/* TAB 13: EMBED BUILDER */}
              {activeTab === "embed" && (
                <EmbedModule guildId={activeGuildId} />
              )}
              {/* TAB 14: MODERATION LOGS */}
              {activeTab === "logs" && (
                <LogsModule guildId={activeGuildId} />
              )}
              {/* TAB 15: GIVEAWAYS */}
              {activeTab === "giveaway" && (
                <GiveawayModule guildId={activeGuildId} />
              )}
              {/* TAB 16: TIMED MESSAGES */}
              {activeTab === "timedmessages" && (
                <TimedMessagesModule guildId={activeGuildId} />
              )}
            </motion.div>
          </AnimatePresence>

        </main>

      </div>

      {/* Cyber-Minimal Footer */}
      <footer className="w-full border-t border-white/10 py-6 px-6 text-center text-xs text-zinc-500 font-mono relative z-10 mt-12 bg-[#09090b]/80 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-4">
        <div>
          AURA BOT v2.0 • Powered by Next.js, Framer Motion, and Tailwind CSS
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <span className="hover:text-white cursor-pointer transition-colors">Documentation</span>
          <span>•</span>
          <span className="hover:text-white cursor-pointer transition-colors">API Gateway</span>
          <span>•</span>
          <span className="hover:text-white cursor-pointer transition-colors">Support Server</span>
        </div>
      </footer>

    </div>
  );
}

