"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LandingPage from "../components/LandingPage";
import ServerRail from "../components/ServerRail";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";
import StatCards from "../components/StatCards";
import ServerActivityChart from "../components/ServerActivityChart";
import TopCommandsList from "../components/TopCommandsList";
import RecentServersList from "../components/RecentServersList";
import SystemLogsWidget from "../components/SystemLogsWidget";
import ServerDistributionChart from "../components/ServerDistributionChart";
import QuickActionsWidget from "../components/QuickActionsWidget";
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
import { useAuth } from "../dashboard/context/AuthContext";
import { LogIn, ArrowLeft } from "lucide-react";

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
        <div className="min-h-screen bg-[#0b0d14] text-zinc-100 flex antialiased select-none">
          
          {/* 1. Leftmost Dedicated Server Rail */}
          <ServerRail activeServer={activeServer} onSelectServer={setActiveServer} />

          {/* 2. Main Navigation Sidebar (30+ Tabs, Collapsible Categories) */}
          <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

          {/* 3. Main Dashboard Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* Top Header */}
            <Header />

            {/* Dynamic Main Body based on Active Sidebar Tab */}
            <main className="flex-1 p-8 space-y-8 overflow-y-auto">
              
              {/* Return to Landing Page Quick Action Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-[#1e2333]">
                <button
                  onClick={() => setViewMode("landing")}
                  className="text-xs font-bold text-zinc-400 hover:text-emerald-400 flex items-center gap-2 transition-colors cursor-pointer font-mono"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>← BACK TO POWER LANDING PAGE</span>
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                    AURA ENGINE ACTIVE
                  </span>
                </div>
              </div>

              {/* Prominent Discord OAuth2 Authentication Banner (Guest Mode) */}
              {!isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-emerald-500/20 via-amber-500/15 to-pink-500/20 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/40">
                      <LogIn className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        Verify Discord Account & Link Dashboard
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/30 text-white border border-emerald-500/50">
                          OAuth2 Gateway
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed">
                        Connect your Discord account to verify server ownership, sync your administrator permissions, and access live bot configurations.
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={login}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-xl shadow-emerald-500/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
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
                  className="space-y-8"
                >
              {(activeTab === "dashboard" || activeTab === "overview") && (
                <>
                  {/* Hero Banner */}
                  <HeroBanner username={displayName} />

                  {/* 4 Stat Cards */}
                  <StatCards />

                  {/* Row 2: Server Activity (2 cols) + Top Commands (1 col) + Recent Servers (1 col) */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-2">
                      <ServerActivityChart />
                    </div>
                    <div className="lg:col-span-1">
                      <TopCommandsList />
                    </div>
                    <div className="lg:col-span-1">
                      <RecentServersList />
                    </div>
                  </div>

                  {/* Row 3: System Logs (1 col) + Server Distribution (1 col) + Quick Actions (1 col) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <SystemLogsWidget />
                    </div>
                    <div className="lg:col-span-1">
                      <ServerDistributionChart />
                    </div>
                    <div className="lg:col-span-1">
                      <QuickActionsWidget />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "modules" && <ModuleSettings activeGuild="1" />}
              {(activeTab === "commands" || activeTab === "customcommands") && <CommandSettings guildId="1" />}
              {(activeTab === "security" || activeTab === "antiraid" || activeTab === "vipprotection" || activeTab === "automod") && <SecuritySettings guildId="1" />}
              {activeTab === "tickets" && <TicketSettings />}
              {activeTab === "invites" && <InviteSettings />}
              {activeTab === "tempchannels" && <TempVoiceSettings />}
              {activeTab === "applications" && <ApplicationSettings />}
              {(activeTab === "twitch" || activeTab === "youtube" || activeTab === "kick" || activeTab === "reddit") && <SocialAlertsSettings />}
              {activeTab === "welcome" && <WelcomeSettings />}
              {activeTab === "autoroles" && <AutoRolesSettings />}
              {activeTab === "embed" && <EmbedBuilder />}
              {activeTab === "logs" && <LogViewer />}
              {activeTab === "giveaway" && <GiveawaySettings />}
              {activeTab === "timedmessages" && <TimedMessages />}
              {activeTab === "settings" && <ServerSettings />}
              {activeTab === "backups" && <BackupSettings />}
              {activeTab === "premium" && <PremiumSettings />}
              {(activeTab === "utility" || activeTab === "colors" || activeTab === "selfroles") && <UtilityHub />}
              {activeTab === "responder" && <AutoResponderSettings />}
              {activeTab === "leveling" && <LevelingSettings />}
              {activeTab === "starboard" && <StarboardSettings />}
              {activeTab === "templink" && <TempLinkSettings />}
              {activeTab === "statistics" && <StatisticsSettings />}
              {activeTab === "economy" && <EconomySettings />}
              {activeTab === "moderation" && <ModerationPanel />}
              {(activeTab === "control-logs" || activeTab === "mod-actions") && <ControlPanel />}

              {activeTab !== "dashboard" && activeTab !== "overview" && activeTab !== "modules" && activeTab !== "commands" && activeTab !== "customcommands" && activeTab !== "security" && activeTab !== "antiraid" && activeTab !== "vipprotection" && activeTab !== "automod" && activeTab !== "tickets" && activeTab !== "invites" && activeTab !== "tempchannels" && activeTab !== "applications" && activeTab !== "twitch" && activeTab !== "youtube" && activeTab !== "kick" && activeTab !== "reddit" && activeTab !== "welcome" && activeTab !== "autoroles" && activeTab !== "embed" && activeTab !== "logs" && activeTab !== "giveaway" && activeTab !== "timedmessages" && activeTab !== "settings" && activeTab !== "backups" && activeTab !== "premium" && activeTab !== "utility" && activeTab !== "colors" && activeTab !== "selfroles" && activeTab !== "responder" && activeTab !== "leveling" && activeTab !== "starboard" && activeTab !== "templink" && activeTab !== "statistics" && activeTab !== "economy" && activeTab !== "moderation" && activeTab !== "control-logs" && activeTab !== "mod-actions" && (
                <div className="dark-panel p-8 sm:p-10 text-center space-y-4 animate-float-slow">
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider">
                    {activeTab} Management
                  </div>
                  <h2 className="text-2xl font-extrabold text-white capitalize">{activeTab.replace("-", " ")} Panel</h2>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                    This tab is fully integrated with the dark obsidian dashboard theme and live gateway shard telemetry.
                  </p>
                </div>
              )}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#1e2333] py-5 px-8 flex items-center justify-between text-xs text-zinc-400">
              <span>© 2025 Aura Bot. All rights reserved.</span>
              <div className="flex items-center gap-4 text-[#8b5cf6] font-semibold">
                <a href="#" className="hover:underline">Discord</a>
                <a href="#" className="hover:underline">Twitter</a>
                <a href="#" className="hover:underline">Website</a>
              </div>
            </footer>

          </div>

        </div>
      )}
    </>
  );
}
