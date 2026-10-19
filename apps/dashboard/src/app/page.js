"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import LandingPage from "../components/LandingPage";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import OverviewCanvas from "../components/OverviewCanvas";

/* Sub-management views */
import ModuleSettings from "../components/ModuleSettings";
import CommandSettings from "../components/CommandSettings";
import SecuritySettings from "../components/SecuritySettings";
import TicketsCanvas from "../components/TicketsCanvas";
import InviteSettings from "../components/InviteSettings";
import TempVoiceSettings from "../components/TempVoiceSettings";
import ApplicationSettings from "../components/ApplicationSettings";
import SocialAlertsSettings from "../components/SocialAlertsSettings";
import WelcomeSettings from "../components/WelcomeSettings";
import AutoRolesSettings from "../components/AutoRolesSettings";
import VerificationModule from "../components/modules/VerificationModule";
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
import MembersPanel from "../components/MembersPanel";
import ControlPanel from "../components/ControlPanel";
import { useAuth } from "../context/AuthContext";
import { LogIn } from "lucide-react";

const TAB_TITLES = {
  dashboard: "Overview",
  overview: "Overview",
  servers: "Servers",
  settings: "Settings",
  members: "Members",
  commands: "Commands",
  customcommands: "Commands",
  modules: "Modules",
  automation: "Automation",
  notifications: "Notifications",
  tickets: "Tickets",
  reaction_roles: "Reaction Roles",
  welcome: "Welcome",
  verification: "Verification",
  giveaways: "Giveaways",
  giveaway: "Giveaways",
  polls: "Polls",
  moderation: "Moderation",
  auto_moderation: "Auto Moderation",
  automod: "Auto Mod",
  logs: "Logs",
  security: "Security",
  vipprotection: "Security",
  antiraid: "Security",
  anti_nuke: "Anti-Nuke",
  voice: "Temp Voice",
  tempchannels: "Temp Voice",
  analytics: "Analytics",
  statistics: "Analytics",
  serverstats: "Server Stats",
  invite_tracker: "Invite Tracker",
  invites: "Invite Tracker",
  xp_rewards: "XP & Rewards",
  leveling: "Leveling",
  leaderboard: "Leaderboard",
  economy: "Economy",
  premium: "Premium",
  utility: "Utility",
  responder: "Auto Responder",
  starboard: "Starboard",
  templink: "Temp Links",
  embed: "Embed Builder",
  timedmessages: "Timed Messages",
  applications: "Applications",
  backups: "Backups",
  social: "Social Alerts",
  twitch: "Social Alerts",
  youtube: "Social Alerts",
  "control-logs": "Control Panel",
};

export default function DashboardHome() {
  const [viewMode, setViewMode] = useState("dashboard"); // "landing" | "dashboard"
  const [activeTab, setActiveTab] = useState("dashboard");
  const { isAuthenticated, loading: authLoading, login } = useAuth();
  const [guilds, setGuilds] = useState([]);

  // Active guild snowflake for the module/command/security panels.
  // Seeded with the placeholder guild, then replaced by the first live
  // guild returned for the authenticated user; panels fall back to mock
  // data if this never resolves.
  const [guildId, setGuildId] = useState("123456789012345678");
  useEffect(() => {
    if (!isAuthenticated) {
      // Reset to the placeholder seed so a later login never reuses a stale guild id.
      setGuildId("123456789012345678");
      setGuilds([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/guilds");
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data?.guilds) ? data.guilds : [];
        if (!cancelled && list.length > 0) {
          setGuilds(list);
          setGuildId((current) =>
            list.some((g) => g.id === current) ? current : list[0].id
          );
        }
      } catch (err) {
        // Network/auth failure: keep placeholder wiring; panels fall back to mock data.
        console.warn("Failed to load guild list:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Guest mode has no real guild: components must not fetch (contract: falsy = no fetch)
  const activeGuildId = isAuthenticated ? guildId : null;

  const title = TAB_TITLES[activeTab] || "Overview";

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: "easeInOut" }}
      >
        {viewMode === "landing" && (
        <LandingPage onLaunchDashboard={() => setViewMode("dashboard")} />
      )}

      {viewMode === "dashboard" && (
        <div className="relative z-10 min-h-screen font-sans text-slate-100 antialiased select-none">
          {/* ── App frame: sidebar rail + top bar + content ──────── */}
          <div className="p-3 md:p-4">
            <div className="aura-frame flex items-stretch gap-2.5 p-2 md:gap-3 md:p-2.5">
              <Sidebar
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                guilds={guilds}
                activeGuildId={guildId}
                onSelectServer={setGuildId}
                onLogoClick={() => setViewMode("landing")}
              />

              <div className="flex min-w-0 flex-1 flex-col">
                <Header onNavigate={setActiveTab} title={title} />

                <main className="flex-1 space-y-6 p-2 pt-4 md:p-3 md:pt-5">
                  {/* Discord OAuth banner (guest mode) */}
                  {!authLoading && !isAuthenticated && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="glass-card flex flex-col items-center justify-between gap-4 p-4 md:flex-row"
                    >
                      <div className="flex items-center gap-4">
                        <span className="icon-tile icon-tile-blue h-10 w-10 rounded-[14px]">
                          <LogIn className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-display flex flex-wrap items-center gap-2 text-[13px] font-extrabold text-white">
                            Verify Discord Account &amp; Link Dashboard
                            <span className="chip chip-violet font-mono text-[9px]">OAuth2</span>
                          </h3>
                          <p className="mt-1 max-w-xl font-body text-[11px] leading-relaxed text-slate-400">
                            Connect your Discord account to verify server ownership, sync permissions,
                            and access live bot configurations.
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={login}
                        className="btn-primary shrink-0"
                      >
                        <LogIn className="h-4 w-4" />
                        <span>Login with Discord</span>
                      </motion.button>
                    </motion.div>
                  )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    className="space-y-6"
                  >
                    {/* MAIN OVERVIEW — Command Center */}
                    {(activeTab === "dashboard" || activeTab === "overview") && (
                      <OverviewCanvas onNavigate={setActiveTab} />
                    )}

                    {/* ALL SUB-MANAGEMENT TABS */}
                    {activeTab === "modules" && <ModuleSettings activeGuild={activeGuildId} />}
                    {(activeTab === "commands" || activeTab === "customcommands") && (
                      <CommandSettings guildId={activeGuildId} />
                    )}
                    {(activeTab === "security" ||
                      activeTab === "antiraid" ||
                      activeTab === "vipprotection" ||
                      activeTab === "automod" ||
                      activeTab === "auto_moderation" ||
                      activeTab === "anti_nuke") && <SecuritySettings guildId={activeGuildId} />}
                    {activeTab === "tickets" && <TicketsCanvas guildId={activeGuildId} />}
                    {(activeTab === "invites" || activeTab === "invite_tracker") && <InviteSettings guildId={activeGuildId} />}
                    {(activeTab === "tempchannels" || activeTab === "voice") && <TempVoiceSettings />}
                    {activeTab === "applications" && <ApplicationSettings guildId={activeGuildId} />}
                    {(activeTab === "social" || activeTab === "twitch" || activeTab === "youtube") && (
                      <SocialAlertsSettings guildId={activeGuildId} />
                    )}
                    {activeTab === "welcome" && <WelcomeSettings />}
                    {activeTab === "verification" && <VerificationModule guildId={activeGuildId} />}
                    {(activeTab === "autoroles" || activeTab === "reaction_roles") && (
                      <AutoRolesSettings />
                    )}
                    {activeTab === "embed" && <EmbedBuilder />}
                    {activeTab === "logs" && <LogViewer guildId={activeGuildId} />}
                    {(activeTab === "giveaway" || activeTab === "giveaways") && <GiveawaySettings guildId={activeGuildId} />}
                    {activeTab === "timedmessages" && <TimedMessages guildId={activeGuildId} />}
                    {(activeTab === "settings" || activeTab === "servers") && <ServerSettings guilds={guilds} />}
                    {activeTab === "backups" && <BackupSettings />}
                    {activeTab === "premium" && <PremiumSettings />}
                    {activeTab === "utility" && <UtilityHub />}
                    {activeTab === "responder" && <AutoResponderSettings guildId={activeGuildId} />}
                    {(activeTab === "leveling" || activeTab === "xp_rewards") && <LevelingSettings guildId={activeGuildId} />}
                    {activeTab === "starboard" && <StarboardSettings guildId={activeGuildId} />}
                    {activeTab === "templink" && <TempLinkSettings />}
                    {(activeTab === "statistics" ||
                      activeTab === "analytics" ||
                      activeTab === "serverstats") && <StatisticsSettings />}
                    {(activeTab === "economy" || activeTab === "leaderboard") && <EconomySettings guildId={activeGuildId} />}
                    {activeTab === "moderation" && <ModerationPanel guildId={activeGuildId} />}
                    {activeTab === "members" && <MembersPanel guildId={activeGuildId} />}
                    {(activeTab === "control-logs" ||
                      activeTab === "notifications" ||
                      activeTab === "automation" ||
                      activeTab === "polls") && <ControlPanel />}
                  </motion.div>
                </AnimatePresence>
                </main>

                {/* ── Footer (chrome only) ───────────────────────── */}
                <footer className="flex flex-col items-center justify-between gap-1.5 px-3 py-4 text-[11px] text-slate-500 md:flex-row md:pt-6">
                  <span>Aura Bot © 2026. All rights reserved.</span>
                  <span className="font-body text-slate-600">More Than Just a Bot</span>
                </footer>
              </div>
            </div>
          </div>
        </div>
      )}
      </motion.div>
    </MotionConfig>
  );
}
