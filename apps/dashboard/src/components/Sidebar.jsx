"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Server,
  Users,
  Terminal,
  Bot,
  Ticket,
  Smile,
  Sparkles,
  ShieldCheck,
  Gift,
  BarChart3,
  Bell,
  Scale,
  ShieldAlert,
  FileText,
  Lock,
  Flame,
  Volume2,
  TrendingUp,
  Link,
  PieChart,
  Coins,
  Award,
  Trophy,
  Sliders,
  Crown,
  ChevronDown,
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
  Layers,
  Wrench,
  Radio,
  FileSpreadsheet,
  Star,
  Activity,
} from "lucide-react";
import AuraLogo from "./AuraLogo";

export default function Sidebar({ activeTab, onSelectTab, setActiveTab }) {
  const handleTabSelect = onSelectTab || setActiveTab;
  const [expandedCategories, setExpandedCategories] = useState({
    OVERVIEW: true,
    MANAGE: true,
    MODERATION: true,
    ANALYTICS: true,
    ECONOMY: true,
    UTILITIES: true,
  });

  const toggleCategory = (catTitle) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catTitle]: !prev[catTitle],
    }));
  };

  const menuCategories = [
    {
      title: "OVERVIEW",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "MANAGE",
      items: [
        { id: "servers", label: "Servers", icon: Server, hasSubmenu: true },
        { id: "members", label: "Members", icon: Users },
        { id: "commands", label: "Commands", icon: Terminal },
        { id: "automation", label: "Automation", icon: Bot },
        { id: "tickets", label: "Tickets", icon: Ticket },
        { id: "reaction_roles", label: "Reaction Roles", icon: Smile },
        { id: "welcome", label: "Welcome", icon: Sparkles },
        { id: "verification", label: "Verification", icon: ShieldCheck },
        { id: "giveaways", label: "Giveaways", icon: Gift },
        { id: "polls", label: "Polls", icon: BarChart3 },
        { id: "notifications", label: "Notifications", icon: Bell },
      ],
    },
    {
      title: "MODERATION",
      items: [
        { id: "moderation", label: "Moderation", icon: Scale },
        { id: "auto_moderation", label: "Auto Moderation", icon: ShieldAlert },
        { id: "logs", label: "Logs", icon: FileText },
        { id: "security", label: "Security", icon: Lock },
        { id: "anti_nuke", label: "Anti-Nuke", icon: Flame },
        { id: "voice", label: "Voice", icon: Volume2 },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { id: "analytics", label: "Analytics", icon: TrendingUp },
        { id: "invite_tracker", label: "Invite Tracker", icon: Link },
        { id: "serverstats", label: "ServerStats", icon: PieChart },
      ],
    },
    {
      title: "ECONOMY",
      items: [
        { id: "economy", label: "Economy", icon: Coins },
        { id: "xp_rewards", label: "XP & Rewards", icon: Award },
        { id: "leaderboard", label: "Leaderboard", icon: Trophy },
      ],
    },
    {
      title: "UTILITIES & MORE",
      items: [
        { id: "embed", label: "Embed Builder", icon: Layers },
        { id: "utility", label: "Utility Hub", icon: Wrench },
        { id: "responder", label: "Auto Responder", icon: Bot },
        { id: "leveling", label: "Leveling System", icon: Star },
        { id: "starboard", label: "Starboard", icon: Star },
        { id: "templink", label: "Temp Link", icon: Link },
        { id: "social", label: "Social Alerts", icon: Radio },
        { id: "applications", label: "Applications", icon: FileSpreadsheet },
        { id: "backups", label: "Backups", icon: Sliders },
        { id: "settings", label: "Settings", icon: Settings },
        { id: "premium", label: "Premium", icon: Crown },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#07060f] border-r border-[#1c1836] flex flex-col h-screen sticky top-0 p-3 select-none overflow-y-auto shrink-0 shadow-2xl">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-purple-500/10">
        <AuraLogo size="md" />
        <div>
          <h1 className="font-extrabold text-white text-sm tracking-wide bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            AURA BOT
          </h1>
          <span className="text-[9px] text-purple-400 font-extrabold tracking-widest uppercase block">
            CONTROL PANEL
          </span>
        </div>
      </div>

      {/* Navigation Categories */}
      <nav className="flex-1 space-y-4 pt-2 pr-1">
        {menuCategories.map((cat) => {
          const isExpanded = expandedCategories[cat.title] !== false;
          return (
            <div key={cat.title} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.title)}
                className="w-full flex items-center justify-between text-[10px] font-extrabold text-zinc-500 hover:text-purple-300 uppercase tracking-widest px-2.5 py-1 transition-colors cursor-pointer"
              >
                <span>{cat.title}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-zinc-500" />
                )}
              </button>

              {/* Items List */}
              {isExpanded && (
                <div className="space-y-0.5">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      activeTab === item.id ||
                      (item.id === "dashboard" && activeTab === "overview") ||
                      (item.id === "commands" && activeTab === "customcommands") ||
                      (item.id === "security" && activeTab === "antiraid");

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabSelect && handleTabSelect(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/20 text-white border border-purple-500/40 shadow-lg shadow-purple-950/40 font-bold"
                            : "text-zinc-400 hover:bg-purple-500/10 hover:text-zinc-200 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 ${
                              isActive ? "text-purple-300" : "text-zinc-400"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.hasSubmenu && (
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bot Footer Status Card (Matching Photo 3) */}
      <div className="mt-4 pt-3 border-t border-purple-500/15 bg-[#0d0a1d] rounded-2xl p-3 border border-purple-500/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
              <AuraLogo size="sm" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-white">Aura Bot</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  ONLINE
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono block">
                v2.0.0
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono px-1">
          <span>Shard 1/12</span>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">Ping 42ms</span>
          </div>
        </div>

        {/* Action icons bar */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <button
            onClick={() => handleTabSelect && handleTabSelect("settings")}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-purple-500/15 rounded-lg transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-purple-500/15 rounded-lg transition-colors cursor-pointer"
            title="Help & Support"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/15 rounded-lg transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
