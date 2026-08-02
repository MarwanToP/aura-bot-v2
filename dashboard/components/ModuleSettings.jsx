"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
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
  Sliders,
  ChevronRight,
  Palette,
  FileText,
  Gift,
  Clock,
} from "lucide-react";

const UNIFIED_MODULES = [
  { id: "security", name: "Security & Anti-Nuke", desc: "Anti-Nuke Matrix, heat accumulation, quarantine vault & raid shields.", icon: ShieldAlert, enabled: true, color: "#f43f5e" },
  { id: "moderation", name: "Moderation & Audit", desc: "AutoMod rules, punishment engine, case management & audit logging.", icon: ShieldCheck, enabled: true, color: "#f59e0b" },
  { id: "verification", name: "Verification Gateway", desc: "Captcha, OAuth2, Alt-Shield & automated role verification.", icon: UserCheck, enabled: true, color: "#06b6d4" },
  { id: "ticketing", name: "Ticketing & Applications", desc: "Multi-panel ticket builder, claim system, HTML web transcripts & CSAT.", icon: Ticket, enabled: true, color: "#a855f7" },
  { id: "voice", name: "Voice Topologies", desc: "Ephemeral voice rooms, auto-generator channels & Rich Presence naming.", icon: Mic, enabled: true, color: "#14b8a6" },
  { id: "social", name: "Social Alerts & Alerts", desc: "YouTube, Twitch, RSS, Twitter feed automation & custom embeds.", icon: Radio, enabled: true, color: "#eab308" },
  { id: "gamification", name: "Gamification & Economy", desc: "Rank cards, XP multiplier, daily rewards, casino & server store.", icon: Sparkles, enabled: true, color: "#ec4899" },
  { id: "growth", name: "Growth & Invites", desc: "Invite attribution metrics, Fake Invite Shield & rank reward roles.", icon: UserPlus, enabled: true, color: "#10b981" },
  { id: "counters", name: "Server Counter Channels", desc: "Live dynamic counter channels (Members, Bots, Roles, Goal stats).", icon: Hash, enabled: true, color: "#3b82f6" },
  { id: "governance", name: "Polls & Governance", desc: "Server voting ballots, candidate election portals & proposal tools.", icon: Vote, enabled: true, color: "#8b5cf6" },
  { id: "welcome", name: "Welcome & Goodbye", desc: "Design welcome cards, customize join/leave messages with live preview.", icon: UserCheck, enabled: true, color: "#10b981" },
  { id: "autoroles", name: "Auto Roles", desc: "Automatically assign a role to every new member when they join.", icon: UserPlus, enabled: true, color: "#f59e0b" },
  { id: "embed", name: "Embed Builder", desc: "Design rich Discord embeds with live preview, fields, images, and colors.", icon: Palette, enabled: true, color: "#ec4899" },
  { id: "logs", name: "Moderation Logs", desc: "Browse all moderation actions with search, filtering, and pagination.", icon: FileText, enabled: true, color: "#3b82f6" },
  { id: "giveaway", name: "Giveaways", desc: "Create, manage, and end giveaways directly from the dashboard.", icon: Gift, enabled: true, color: "#a855f7" },
  { id: "timedmessages", name: "Timed Messages", desc: "Schedule messages to repeat in channels at set intervals.", icon: Clock, enabled: true, color: "#14b8a6" },
];

export default function ModuleSettings({ onSelectModule }) {
  const [modules, setModules] = useState(UNIFIED_MODULES);

  const toggleModule = (e, id) => {
    e.stopPropagation();
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleCardClick = (id) => {
    if (typeof onSelectModule === "function") {
      onSelectModule(id);
    }
  };

  return (
    <div className="my-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Module Control Hub
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Enable or disable core bot modules with real-time sync across shards.
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2]">
          {modules.filter((m) => m.enabled).length} / {modules.length} ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.id}
              layout
              onClick={() => handleCardClick(mod.id)}
              className={`relative rounded-2xl border p-5 transition-all duration-300 cursor-pointer group hover:scale-[1.01] ${
                mod.enabled
                  ? "bg-white/[0.04] border-white/20 shadow-lg hover:border-white/40 hover:bg-white/[0.07]"
                  : "bg-white/[0.01] border-white/5 opacity-70 hover:opacity-90 hover:border-white/20"
              }`}
            >
              {/* Active Inner Glow */}
              {mod.enabled && (
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none opacity-15 blur-xl transition-opacity group-hover:opacity-25"
                  style={{ backgroundColor: mod.color }}
                />
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-xl border border-white/10 bg-white/[0.05]"
                    style={{ color: mod.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {mod.name}
                    </h3>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                        mod.enabled
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30"
                      }`}
                    >
                      {mod.enabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </div>
                </div>

                {/* Custom Snappy Toggle Switch */}
                <button
                  onClick={(e) => toggleModule(e, mod.id)}
                  title={mod.enabled ? "Disable module" : "Enable module"}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${
                    mod.enabled ? "bg-[#5865F2]" : "bg-zinc-800"
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`w-4 h-4 rounded-full bg-white shadow-md ${
                      mod.enabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                {mod.desc}
              </p>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-xs font-semibold text-[#5865F2] group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                  Configure Settings <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

