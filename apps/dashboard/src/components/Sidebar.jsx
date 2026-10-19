"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Server,
  Users,
  Terminal,
  Bot,
  Ticket,
  ClipboardList,
  Smile,
  Hand,
  ShieldCheck,
  Gift,
  Scale,
  FileText,
  Lock,
  Volume2,
  Link as LinkIcon,
  PieChart,
  Star,
  Trophy,
  Crown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Puzzle,
  Radio,
  MessageSquare,
  Link2,
  Wrench,
  HardDrive,
  FileCode2,
} from "lucide-react";
import AuraLogo from "./AuraLogo";
import { useAuth } from "../context/AuthContext";

// Fallback guild list for guest/demo mode (no live guilds available).
const GUILDS_FALLBACK = [
  { id: "crystal", name: "Crystal Realm", members: "12,645 members", icon: "🔮" },
  { id: "gaming", name: "Dev Hub & Gaming", members: "14,210 members", icon: "⚡" },
  { id: "community", name: "Community Lounge", members: "4,890 members", icon: "💬" },
  { id: "support", name: "Support Central", members: "2,150 members", icon: "🎧" },
];

export const SECTIONS = [
  {
    title: null,
    items: [{ id: "dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    title: "Manage",
    items: [
      { id: "servers", label: "Servers", icon: Server },
      { id: "members", label: "Members", icon: Users },
      { id: "commands", label: "Commands", icon: Terminal },
      { id: "modules", label: "Modules", icon: Puzzle },
      { id: "automation", label: "Automation", icon: Bot },
      { id: "tickets", label: "Tickets", icon: Ticket },
      { id: "applications", label: "Applications", icon: ClipboardList },
    ],
  },
  {
    title: "Engagement",
    items: [
      { id: "reaction_roles", label: "Reaction Roles", icon: Smile },
      { id: "welcome", label: "Welcome", icon: Hand },
      { id: "verification", label: "Verification", icon: ShieldCheck },
      { id: "giveaways", label: "Giveaways", icon: Gift },
      { id: "social", label: "Social Alerts", icon: Radio },
      { id: "starboard", label: "Starboard", icon: Star },
    ],
  },
  {
    title: "Moderation",
    items: [
      { id: "moderation", label: "Moderation", icon: Scale },
      { id: "logs", label: "Logs", icon: FileText },
      { id: "security", label: "Security", icon: Lock },
      { id: "voice", label: "Voice", icon: Volume2 },
      { id: "responder", label: "Auto Responder", icon: MessageSquare },
      { id: "templink", label: "Temp Links", icon: Link2 },
    ],
  },
  {
    title: "Analytics",
    items: [
      { id: "analytics", label: "Analytics", icon: PieChart },
      { id: "invite_tracker", label: "Invite Tracker", icon: LinkIcon },
      { id: "xp_rewards", label: "XP & Rewards", icon: Star },
      { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    title: "Settings",
    items: [
      { id: "premium", label: "Premium", icon: Crown },
      { id: "utility", label: "Utility", icon: Wrench },
      { id: "backups", label: "Backups", icon: HardDrive },
      { id: "embed", label: "Embed Builder", icon: FileCode2 },
    ],
  },
];

const navContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.015, delayChildren: 0.05 } },
};
const navItem = {
  hidden: { opacity: 0, x: -6 },
  show: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

export default function Sidebar({
  activeTab,
  setActiveTab,
  onSelectTab,
  guilds = [],
  activeGuildId,
  onSelectServer,
  onLogoClick,
}) {
  const handleTabSelect = onSelectTab || setActiveTab;
  const { isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  const [ping, setPing] = useState(null);

  const statusOk = isAuthenticated && ping != null;

  // Live guilds come from the dashboard API; fall back to the demo fleet
  // for guest mode so the selector keeps rendering.
  const servers =
    guilds.length > 0
      ? guilds.map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon
            ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`
            : null,
          emoji: g.icon ? null : (g.name?.[0] || "#").toUpperCase(),
          members:
            typeof g.memberCount === "number"
              ? `${g.memberCount.toLocaleString()} members`
              : null,
        }))
      : GUILDS_FALLBACK.map((g) => ({ ...g, icon: null, emoji: g.icon }));

  const selectedServer = servers.find((s) => s.id === activeGuildId) || servers[0];

  useEffect(() => {
    if (!isAuthenticated) {
      setPing(null);
      return;
    }
    let cancelled = false;
    fetch("/api/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && typeof data?.pingMs === "number") setPing(data.pingMs);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <aside
      className={`glass-rail sticky top-5 z-30 flex h-[calc(100vh-40px)] shrink-0 select-none flex-col overflow-visible transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:top-[26px] md:h-[calc(100vh-52px)] ${
        collapsed ? "w-[84px] px-3 py-4" : "w-[272px] px-4 py-5"
      }`}
    >
      {/* ── 1. Brand ─────────────────────────────────────────── */}
      <div className={`mb-4 flex items-center px-1 ${collapsed ? "justify-center" : "justify-between"}`}>
        <button
          onClick={onLogoClick}
          title="Aura Bot — back to landing page"
          className="group flex min-w-0 cursor-pointer items-center gap-2.5 overflow-hidden"
        >
          <motion.span
            whileHover={{ rotate: 6, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="shrink-0"
          >
            <AuraLogo
              size="md"
              showRing={false}
              className="drop-shadow-[0_0_16px_rgba(76,125,255,0.45)]"
            />
          </motion.span>
          {!collapsed && (
            <span className="min-w-0 text-left leading-tight">
              <span className="font-display block text-[13px] font-extrabold uppercase tracking-[0.22em] text-white">
                AURA <span className="text-[#7C9BFF]">BOT</span>
              </span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                More than just a bot
              </span>
            </span>
          )}
        </button>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="btn-icon h-8 w-8 shrink-0 rounded-full border border-white/[0.08] bg-white/[0.035]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
          aria-label="Expand sidebar"
          className="btn-icon mx-auto mb-3 h-8 w-8 rounded-full border border-white/[0.08] bg-white/[0.035]"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* ── 2. Server selector ───────────────────────────────── */}
      <div className="relative mb-4">
        <button
          onClick={() => setServerDropdownOpen(!serverDropdownOpen)}
          title={selectedServer.name}
          className={`group flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors ${
            collapsed ? "justify-center p-2" : "px-2.5 py-2"
          } hover:border-[#4C7DFF]/40 hover:bg-white/[0.06] `}
        >
          <span className="icon-tile icon-tile-violet h-8 w-8 overflow-hidden rounded-[11px] text-sm">
            {selectedServer.icon ? (
              <img src={selectedServer.icon} alt="" className="h-full w-full object-cover" />
            ) : (
              selectedServer.emoji
            )}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block flex-1 min-w-0 text-xs font-bold leading-tight text-white">
                  {selectedServer.name}
                </span>
                <span className="block flex-1 min-w-0 text-[10px] leading-tight text-slate-500">
                  {selectedServer.members || "Discord server"}
                </span>
              </span>
              <motion.span
                animate={{ rotate: serverDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0"
              >
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </motion.span>
            </>
          )}
        </button>

        {serverDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setServerDropdownOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="glass-dropdown absolute left-0 top-full z-50 mt-1.5 w-64 p-1.5"
            >
              <div className="micro-label mb-1 border-b border-white/[0.07] px-2.5 py-1.5">
                Select server
              </div>
              {servers.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    if (onSelectServer) onSelectServer(g.id);
                    setServerDropdownOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                    g.id === selectedServer.id
                      ? "bg-[#4C7DFF]/15 font-semibold text-white"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-md text-sm">
                      {g.icon ? (
                        <img src={g.icon} alt="" className="h-full w-full object-cover" />
                      ) : (
                        g.emoji
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block flex-1 min-w-0">{g.name}</span>
                      <span className="block text-[10px] text-slate-500">
                        {g.members || "—"}
                      </span>
                    </span>
                  </span>
                  {g.id === selectedServer.id && <Check className="h-3.5 w-3.5 text-[#34D399]" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </div>

      {/* ── 3. Navigation ────────────────────────────────────── */}
      <motion.nav
        variants={navContainer}
        initial="hidden"
        animate="show"
        className="custom-scrollbar -mr-0.5 flex-1 space-y-5 overflow-y-auto pr-0.5"
      >
        {SECTIONS.map((section, si) => (
          <div key={si}>
            {section.title && !collapsed && (
              <h3 className="micro-label mb-2 px-3 text-[9.5px] tracking-[0.22em] text-slate-500">
                {section.title}
              </h3>
            )}
            {section.title && collapsed && si > 0 && (
              <div className="hairline mx-2 mb-2" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeTab === item.id || (item.id === "dashboard" && activeTab === "overview") ||
                  (item.id === "analytics" && activeTab === "statistics");

                return (
                  <motion.button
                    key={item.id}
                    variants={navItem}
                    onClick={() => handleTabSelect && handleTabSelect(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex w-full cursor-pointer items-center rounded-[14px] text-[12.5px] font-semibold transition-colors ${
                      collapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                    } ${
                      isActive
                        ? "glow-pulse text-white"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                    }`}
                  >
                    {/* Animated gradient active pill */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        transition={{ type: "spring", stiffness: 520, damping: 40 }}
                        className="pill-gradient absolute inset-0 rounded-[14px]"
                      />
                    )}

                    <span className="relative z-10 flex min-w-0 items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive
                            ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
                            : "text-slate-500"
                        }`}
                      />
                      {!collapsed && <span className="flex-1 min-w-0">{item.label}</span>}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </motion.nav>

      {/* ── 4. Status + premium promo ────────────────────────── */}
      <div className="mt-3 space-y-3 border-t border-white/[0.07] pt-3">
        {collapsed ? (
          <div className="flex justify-center" title={statusOk ? "All systems operational" : "Status unavailable"}>
            <span
              className={`animate-pulse-dot h-2.5 w-2.5 rounded-full ${
                statusOk ? "bg-[#34D399]" : "bg-slate-600"
              }`}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px]">
            <span className="flex items-center gap-2 font-medium text-slate-400">
              <span
                className={`animate-pulse-dot h-1.5 w-1.5 rounded-full ${
                  statusOk ? "bg-[#34D399]" : "bg-slate-600"
                }`}
              />
              {statusOk ? "All systems operational" : "Status unavailable"}
            </span>
            <span className="font-mono text-slate-600">
              {statusOk ? `${ping}ms` : "—"}
            </span>
          </div>
        )}

        {/* Premium promo — mirrors the reference card; the plan itself is
            managed in the Premium tab, which "Manage Plan" opens. */}
        {!collapsed ? (
          <div className="glass-card relative overflow-hidden rounded-[20px] p-3.5">
            {/* Soft violet bloom behind the crown */}
            <span className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#7C5CFF]/20 blur-2xl" />
            <div className="relative flex items-start justify-between gap-2">
              <span className="icon-tile icon-tile-amber h-9 w-9 rounded-[13px]">
                <Crown className="h-4 w-4" />
              </span>
              <span
                className="chip chip-green mt-0.5"
                title="Open the Premium tab to review your plan"
              >
                <span className="status-dot status-dot-online animate-pulse-dot h-1.5 w-1.5" />
                Active
              </span>
            </div>
            <h4 className="card-title relative mt-2.5 text-[13px]">Premium Plan</h4>
            <p className="card-sub relative mt-1 font-body leading-relaxed">
              Unlock more features and take your server to the next level.
            </p>
            <button
              onClick={() => handleTabSelect && handleTabSelect("premium")}
              className="btn-glass relative mt-3 w-full border-[#4C7DFF]/40 text-[11px] text-[#A9C2FF] transition-colors hover:border-[#4C7DFF]/70 hover:text-white"
            >
              Manage Plan
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleTabSelect && handleTabSelect("premium")}
            title="Premium Plan"
            aria-label="Premium Plan"
            className="icon-tile icon-tile-amber mx-auto h-10 w-10 cursor-pointer rounded-[14px]"
          >
            <Crown className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
