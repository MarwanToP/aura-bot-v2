"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Server,
  Users,
  Terminal,
  Calendar,
  FileText,
  Shield,
  Crown,
  CreditCard,
  Wallet,
  Settings,
  Palette,
  Grid,
  Share2,
  BarChart3,
  Activity,
  ChevronDown,
  Sparkles,
  Wrench,
  UserCheck,
  MessageSquare,
  Trophy,
  UserPlus,
  Tag,
  Star,
  Mic,
  Music,
  Link2,
  TrendingUp,
  Ticket,
  Mail,
  ClipboardList,
  Coins,
  ShieldCheck,
  Bot,
  Siren,
  Tv,
  Youtube,
  Radio,
  Globe,
  Folder,
  Scale,
  HardDrive,
  Search,
  Gift,
  Clock,
} from "lucide-react";

export default function Sidebar({ activeTab, onSelectTab }) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for collapsible categories (open/close)
  const [openCategories, setOpenCategories] = useState({
    GENERAL: true,
    "MODULE SETTINGS": true,
    MODERATION: true,
    NOTIFICATIONS: true,
    OTHERS: true,
  });

  const toggleCategory = (catName) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  const categories = [
    {
      name: "GENERAL",
      items: [
        { id: "dashboard", label: "Overview", icon: BarChart3 },
        { id: "modules", label: "Modules Hub", icon: LayoutGrid },
        { id: "settings", label: "Server Settings", icon: Settings },
        { id: "embed", label: "Embed Messages", icon: Palette },
        { id: "backups", label: "Server Backups", icon: HardDrive, badge: "PREMIUM", badgeColor: "bg-amber-500/20 text-amber-300" },
        { id: "premium", label: "Get Premium", icon: Crown, badge: "VIP", badgeColor: "bg-purple-500/20 text-purple-300" },
      ],
    },
    {
      name: "MODULE SETTINGS",
      items: [
        { id: "utility", label: "Utility", icon: Wrench },
        { id: "welcome", label: "Welcome & Goodbye", icon: UserCheck },
        { id: "responder", label: "Auto Responder", icon: MessageSquare },
        { id: "customcommands", label: "Custom Commands", icon: Terminal },
        { id: "leveling", label: "Leveling System", icon: Trophy, badge: "PREMIUM", badgeColor: "bg-amber-500/20 text-amber-300" },
        { id: "autoroles", label: "Auto Roles", icon: UserPlus },
        { id: "colors", label: "Colors", icon: Sparkles },
        { id: "selfroles", label: "Self-Assignable Roles", icon: Tag },
        { id: "starboard", label: "Starboard", icon: Star },
        { id: "tempchannels", label: "Temporary Channels", icon: Mic },
        { id: "templink", label: "Temp Link", icon: Link2, badge: "PREMIUM", badgeColor: "bg-amber-500/20 text-amber-300" },
        { id: "statistics", label: "Statistics", icon: TrendingUp, badge: "PREMIUM", badgeColor: "bg-amber-500/20 text-amber-300" },
        { id: "tickets", label: "Tickets", icon: Ticket, badge: "PREMIUM", badgeColor: "bg-amber-500/20 text-amber-300" },
        { id: "invites", label: "Invite Tracker", icon: Mail },
        { id: "applications", label: "Staff Applications (Appy)", icon: ClipboardList },
        { id: "economy", label: "Economy & Shop", icon: Coins },
        { id: "giveaway", label: "Giveaways", icon: Gift, badge: "NEW", badgeColor: "bg-pink-500/20 text-pink-300" },
        { id: "timedmessages", label: "Timed Messages", icon: Clock, badge: "NEW", badgeColor: "bg-pink-500/20 text-pink-300" },
        { id: "commands", label: "Command Control & Permissions", icon: Grid, badge: "NEW", badgeColor: "bg-cyan-500/20 text-cyan-300" },
      ],
    },
    {
      name: "MODERATION",
      items: [
        { id: "moderation", label: "Moderation", icon: Shield },
        { id: "security", label: "Security Shield (Wicks)", icon: ShieldCheck, badge: "PREMIUM", badgeColor: "bg-amber-500/20 text-amber-300" },
        { id: "logs", label: "Logs", icon: FileText },
        { id: "automod", label: "Automod", icon: Bot },
        { id: "antiraid", label: "Anti-Raid", icon: Siren, badge: "PREMIUM", badgeColor: "bg-amber-500/20 text-amber-300" },
        { id: "vipprotection", label: "VIP Protection", icon: Crown, badge: "PREMIUM", badgeColor: "bg-amber-500/20 text-amber-300" },
      ],
    },
    {
      name: "NOTIFICATIONS",
      items: [
        { id: "twitch", label: "Twitch", icon: Tv, badge: "PREMIUM", badgeColor: "bg-amber-500/20 text-amber-300" },
        { id: "youtube", label: "YouTube", icon: Youtube, badge: "NEW", badgeColor: "bg-pink-500 text-white" },
        { id: "kick", label: "Kick", icon: Radio, badge: "NEW", badgeColor: "bg-pink-500 text-white" },
        { id: "reddit", label: "Reddit", icon: Globe, badge: "NEW", badgeColor: "bg-pink-500 text-white" },
      ],
    },
    {
      name: "OTHERS",
      items: [
        { id: "control-logs", label: "Control Panel Logs", icon: Folder },
        { id: "mod-actions", label: "Mod Actions", icon: Scale },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#050608] border-r border-emerald-500/10 flex flex-col h-screen sticky top-0 z-40 select-none">
      
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3.5 border-b border-emerald-500/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-600 p-[1px] shadow-lg shadow-emerald-900/40 flex items-center justify-center">
          <div className="w-full h-full bg-[#050608] rounded-[11px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
          </div>
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
            AURA BOT
          </h1>
          <p className="text-[11px] font-semibold text-emerald-400 tracking-wide uppercase">
            Discord BOT
          </p>
        </div>
      </div>

      {/* Mini Sidebar Filter Search Box */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="sidebar-filter-tabs-input"
            name="sidebar-filter-tabs"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter 30+ tabs..."
            className="w-full bg-[#0b0c10] border border-[#1a1f2e] rounded-xl pl-9 pr-3 py-1.5 text-[11px] text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500/60 transition-all font-medium"
          />
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {categories.map((cat) => {
          const isOpen = openCategories[cat.name] || searchQuery.length > 0;

          // Filter items if searching
          const filteredItems = cat.items.filter((item) =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (searchQuery.length > 0 && filteredItems.length === 0) return null;

          return (
            <div key={cat.name} className="space-y-1">
              
              {/* Collapsible Category Header with Chevron Toggle */}
              <button
                onClick={() => toggleCategory(cat.name)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors group cursor-pointer"
              >
                <span>{cat.name}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-transform duration-200 ${
                    isOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>

              {/* Collapsible Category Content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="space-y-0.5 overflow-hidden"
                  >
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelectTab(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? "gradient-active-btn text-white font-bold shadow-lg"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121520]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-zinc-400"}`} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {/* Optional Badge (PREMIUM / NEW) */}
                          {item.badge && (
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                item.badgeColor || "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

    </aside>
  );
}
