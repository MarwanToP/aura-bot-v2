"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LandingPage from "../components/LandingPage";
import ServerRail from "../components/ServerRail";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";
import ServerHealthCard from "../components/ServerHealthCard";
import LiveStatsPanel from "../components/LiveStatsPanel";
import StatCards from "../components/StatCards";
import ServerActivityChart from "../components/ServerActivityChart";
import TopCommandsList from "../components/TopCommandsList";
import RecentTicketsWidget from "../components/RecentTicketsWidget";
import ActiveAutomationWidget from "../components/ActiveAutomationWidget";
import MemberBoostCard from "../components/MemberBoostCard";
import ServerTimelineWidget from "../components/ServerTimelineWidget";
import ModerationOverviewWidget from "../components/ModerationOverviewWidget";
import QuickActionsWidget from "../components/QuickActionsWidget";
import InviteTrackerWidget from "../components/InviteTrackerWidget";
import SystemStatusWidget from "../components/SystemStatusWidget";

/* Sub-management views */
import ModuleSettings from "../components/ModuleSettings";
import CommandSettings from "../components/CommandSettings";
import SecuritySettings from "../components/SecuritySettings";
import TicketSettings from "../components/TicketSettings";
import InviteSettings from "../components/InviteSettings";
import TempVoiceSettings from "../components/TempVoiceSettings";
import ApplicationSettings from "../components/ApplicationSettings";
import SocialAlertsSettings from "../components/SocialAlertsSettings";
import WelcomeSettings from "../components/WelcomeSettings";
import AutoRolesSettings from "../components/AutoRolesSettings";
import EmbedBuilder from "../components/EmbedBuilder";
import LogViewer from "../components/LogViewer";
import GiveawaySettings from "../components/GiveawaySettings";
import TimedMessages from "../components/TimedMessages";
import ServerSettings from "../components/ServerSettings";
import BackupSettings from "../components/BackupSettings";
import PremiumSettings from "../components/PremiumSettings";
import UtilityHub from "../components/UtilityHub";
import AutoResponderSettings from "../components/AutoResponderSettings";
import LevelingSettings from "../components/LevelingSettings";
import StarboardSettings from "../components/StarboardSettings";
import TempLinkSettings from "../components/TempLinkSettings";
import StatisticsSettings from "../components/StatisticsSettings";
import EconomySettings from "../components/EconomySettings";
import ModerationPanel from "../components/ModerationPanel";
import ControlPanel from "../components/ControlPanel";
import { useAuth } from "../context/AuthContext";
import { LogIn, ArrowLeft, Heart, Activity } from "lucide-react";

export default function DashboardHome() {
  const [viewMode, setViewMode] = useState("landing"); // "landing" | "dashboard"
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeServer, setActiveServer] = useState("moon");
  const { user, isAuthenticated, login } = useAuth();

  const displayName = user?.global_name || user?.username || "Marwan";

  return (
    <>
      {viewMode === "landing" && (
        <LandingPage
          onLaunchDashboard={() => setViewMode("dashboard")}
        />
      )}

      {viewMode === "dashboard" && (
        <div className="min-h-screen bg-[#07060f] text-zinc-100 flex antialiased select-none font-sans">
          
          {/* 1. Leftmost Dedicated Server Rail */}
          <ServerRail activeServer={activeServer} onSelectServer={setActiveServer} />

          {/* 2. Main Navigation Sidebar (30+ Tabs, Collapsible Categories) */}
          <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

          {/* 3. Main Dashboard Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#07060f]">
            
            {/* Top Navigation Header */}
            <Header />

            {/* Dynamic Main Body based on Active Sidebar Tab */}
            <main className="flex-1 p-6 space-y-6 overflow-y-auto">
              
              {/* Return to Landing Page Quick Action Bar */}
              <div className="flex items-center justify-between pb-1 border-b border-purple-500/15">
                <button
                  onClick={() => setViewMode("landing")}
                  className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer font-mono"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>← BACK TO LANDING PAGE</span>
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-purple-300 font-bold px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>AURA ENGINE ACTIVE</span>
                  </span>
                </div>
              </div>

              {/* Discord OAuth Authentication Banner (Guest Mode) */}
              {!isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-pink-900/30 border border-purple-500/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-500/40 font-bold text-sm">
                      <LogIn className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
                        Verify Discord Account & Link Dashboard
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-500/40">
                          OAuth2 Gateway
                        </span>
                      </h3>
                      <p className="text-[11px] text-zinc-300 mt-0.5 max-w-xl leading-relaxed">
                        Connect your Discord account to verify server ownership, sync permissions, and access live bot configurations.
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={login}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/40 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login with Discord</span>
                  </motion.button>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  {/* MAIN DASHBOARD OVERVIEW (Matching Photo 3) */}
                  {(activeTab === "dashboard" || activeTab === "overview") && (
                    <>
                      {/* 1. Welcome Hero Banner Card */}
                      <HeroBanner username={displayName} />

                      {/* 2. Server Health Radial Gauge (Left) + Live Stats Panel (Right) */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-5">
                          <ServerHealthCard />
                        </div>
                        <div className="lg:col-span-7">
                          <LiveStatsPanel />
                        </div>
                      </div>

                      {/* 3. 5 Metric Sparkline Cards Row */}
                      <StatCards />

                      {/* 4. Main Chart + Top Commands + Recent Tickets + Active Automation */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-6">
                          <ServerActivityChart />
                        </div>
                        <div className="lg:col-span-3">
                          <TopCommandsList />
                        </div>
                        <div className="lg:col-span-3">
                          <RecentTicketsWidget />
                        </div>
                      </div>

                      {/* 5. Active Automation + Member Boost + Server Timeline + Moderation Overview + Quick Actions */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-3">
                          <ActiveAutomationWidget />
                        </div>
                        <div className="lg:col-span-5">
                          <MemberBoostCard />
                        </div>
                        <div className="lg:col-span-4">
                          <ServerTimelineWidget />
                        </div>
                      </div>

                      {/* 6. Moderation Overview + Quick Actions Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-6">
                          <ModerationOverviewWidget />
                        </div>
                        <div className="lg:col-span-6">
                          <QuickActionsWidget />
                        </div>
                      </div>

                      {/* 7. Invite Tracker + System Status Panel */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-7">
                          <InviteTrackerWidget />
                        </div>
                        <div className="lg:col-span-5">
                          <SystemStatusWidget />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ALL SUB-MANAGEMENT TABS */}
                  {activeTab === "modules" && <ModuleSettings activeGuild="1" />}
                  {(activeTab === "commands" || activeTab === "customcommands") && <CommandSettings guildId="1" />}
                  {(activeTab === "security" || activeTab === "antiraid" || activeTab === "vipprotection" || activeTab === "automod" || activeTab === "auto_moderation" || activeTab === "anti_nuke") && <SecuritySettings guildId="1" />}
                  {activeTab === "tickets" && <TicketSettings />}
                  {(activeTab === "invites" || activeTab === "invite_tracker") && <InviteSettings />}
                  {(activeTab === "tempchannels" || activeTab === "voice") && <TempVoiceSettings />}
                  {activeTab === "applications" && <ApplicationSettings />}
                  {(activeTab === "social" || activeTab === "twitch" || activeTab === "youtube") && <SocialAlertsSettings />}
                  {activeTab === "welcome" && <WelcomeSettings />}
                  {(activeTab === "autoroles" || activeTab === "reaction_roles") && <AutoRolesSettings />}
                  {activeTab === "embed" && <EmbedBuilder />}
                  {activeTab === "logs" && <LogViewer />}
                  {(activeTab === "giveaway" || activeTab === "giveaways") && <GiveawaySettings />}
                  {activeTab === "timedmessages" && <TimedMessages />}
                  {(activeTab === "settings" || activeTab === "servers") && <ServerSettings />}
                  {activeTab === "backups" && <BackupSettings />}
                  {activeTab === "premium" && <PremiumSettings />}
                  {activeTab === "utility" && <UtilityHub />}
                  {activeTab === "responder" && <AutoResponderSettings />}
                  {(activeTab === "leveling" || activeTab === "xp_rewards") && <LevelingSettings />}
                  {activeTab === "starboard" && <StarboardSettings />}
                  {activeTab === "templink" && <TempLinkSettings />}
                  {(activeTab === "statistics" || activeTab === "analytics" || activeTab === "serverstats") && <StatisticsSettings />}
                  {(activeTab === "economy" || activeTab === "leaderboard") && <EconomySettings />}
                  {(activeTab === "moderation" || activeTab === "members") && <ModerationPanel />}
                  {(activeTab === "control-logs" || activeTab === "notifications" || activeTab === "automation") && <ControlPanel />}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Sticky Bottom Status Bar (Matching Photo 3) */}
            <footer className="sticky bottom-0 z-40 bg-[#07060f]/95 backdrop-blur-md border-t border-purple-500/15 px-6 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 font-mono">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-zinc-300 font-bold">Uptime 14d 7h 42m</span>
                </div>
                <span className="hidden sm:inline">Servers 24</span>
                <span className="hidden sm:inline">Users 128.4K</span>
                <span className="hidden md:inline">Commands 28.7M</span>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-400">
                <span>Made with</span>
                <Heart className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                <span>by Aura Team</span>
              </div>
            </footer>

          </div>

        </div>
      )}
    </>
  );
}
