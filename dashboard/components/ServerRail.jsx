"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Check, Server } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const DEFAULT_GUILDS = [
  {
    id: "939799976308011018",
    name: "Aura Central Community",
    members: "14.8k Members",
    icon: "🌌",
    acronym: "ACC",
    color: "from-[#5865F2] to-cyan-500",
  },
  {
    id: "102837465918273645",
    name: "Cyberpunk Syndicate",
    members: "8.2k Members",
    icon: "⚡",
    acronym: "CS",
    color: "from-amber-500 to-rose-500",
  },
  {
    id: "564738291029384756",
    name: "Dev Testing Sandbox",
    members: "1.4k Members",
    icon: "🛠️",
    acronym: "DTS",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "884930291048572910",
    name: "Creator Lounge",
    members: "5.6k Members",
    icon: "🎨",
    acronym: "CL",
    color: "from-purple-500 to-indigo-500",
  },
];

export default function ServerRail({
  activeGuildId = "939799976308011018",
  onSelectGuild,
  guilds: passedGuilds,
}) {
  const { guilds: authGuilds } = useAuth();
  const [hoveredGuildId, setHoveredGuildId] = useState(null);

  const displayGuilds = passedGuilds || (authGuilds && authGuilds.length > 0 ? authGuilds : DEFAULT_GUILDS);

  return (
    <aside
      className="hidden md:flex flex-col items-center w-[72px] py-4 border-r border-white/10 bg-[#060608]/90 backdrop-blur-2xl shrink-0 sticky top-[65px] h-[calc(100vh-65px)] z-20 space-y-3"
      aria-label="Server selection rail"
    >
      {/* Home / Aura Bot Branding Icon */}
      <div className="relative group flex items-center justify-center">
        <button
          onClick={() => onSelectGuild && displayGuilds[0] && onSelectGuild(displayGuilds[0].id)}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5865F2] to-cyan-400 p-[1px] shadow-lg shadow-[#5865F2]/20 hover:rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer"
          title="Aura Bot Central"
        >
          <div className="w-full h-full bg-[#09090b] rounded-[15px] hover:rounded-[11px] transition-all flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#5865F2] group-hover:rotate-12 transition-transform duration-300" />
          </div>
        </button>

        {/* Tooltip */}
        <div className="absolute left-20 px-3 py-1.5 rounded-xl bg-[#121318] border border-white/15 text-xs text-white whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 flex items-center gap-2">
          <span className="font-bold text-cyan-400">Aura Bot HQ</span>
          <span className="text-[10px] text-zinc-400 font-mono">System</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-8 h-[2px] bg-white/10 rounded-full my-1" />

      {/* Server List */}
      <div className="flex-1 w-full flex flex-col items-center space-y-3 overflow-y-auto scrollbar-none py-1">
        {displayGuilds.map((guild) => {
          const isActive = activeGuildId === guild.id;
          const isHovered = hoveredGuildId === guild.id;
          const isJoined = guild.isBotPresent !== false && guild.isConfigured !== false;
          const inviteUrl = guild.inviteUrl || `https://discord.com/oauth2/authorize?client_id=939799976308011018&scope=bot+applications.commands&permissions=8&guild_id=${guild.id}&disable_guild_select=true`;

          return (
            <div
              key={guild.id}
              className="relative flex items-center justify-center group w-full"
              onMouseEnter={() => setHoveredGuildId(guild.id)}
              onMouseLeave={() => setHoveredGuildId(null)}
            >
              {/* Active / Hover Left Indicator Pill (Discord style) */}
              <div
                className={`absolute left-0 w-1.5 rounded-r-full bg-white transition-all duration-300 ${
                  isActive
                    ? "h-10 bg-[#5865F2] shadow-lg shadow-[#5865F2]"
                    : isHovered
                    ? "h-5 bg-zinc-400"
                    : "h-0 bg-transparent"
                }`}
              />

              {/* Server Icon Button / Invite Button */}
              {isJoined ? (
                <button
                  onClick={() => onSelectGuild && onSelectGuild(guild.id)}
                  className={`relative w-12 h-12 flex items-center justify-center transition-all duration-300 cursor-pointer text-lg font-bold overflow-hidden ${
                    isActive
                      ? "rounded-2xl bg-gradient-to-tr " + (guild.color || "from-[#5865F2] to-cyan-500") + " text-white shadow-xl shadow-[#5865F2]/30 scale-105"
                      : "rounded-3xl bg-white/[0.05] hover:bg-white/[0.12] hover:rounded-2xl text-zinc-200 border border-white/10 hover:border-white/20"
                  }`}
                >
                  {guild.iconUrl ? (
                    <img src={guild.iconUrl} alt={guild.name} className="w-full h-full object-cover rounded-inherit" />
                  ) : (
                    <span>{guild.icon || guild.name.slice(0, 2).toUpperCase()}</span>
                  )}

                  {/* Active Check Badge */}
                  {isActive && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#5865F2] border-2 border-[#09090b] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </button>
              ) : (
                <a
                  href={inviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="relative w-12 h-12 flex items-center justify-center transition-all duration-300 cursor-pointer text-lg font-bold overflow-hidden rounded-3xl bg-amber-500/10 hover:bg-amber-500/20 hover:rounded-2xl text-amber-400 border border-amber-500/30 hover:border-amber-500/50 hover:scale-105"
                  title={`Invite Bot to ${guild.name}`}
                >
                  {guild.iconUrl ? (
                    <img src={guild.iconUrl} alt={guild.name} className="w-full h-full object-cover rounded-inherit opacity-60 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <span>{guild.icon || guild.name.slice(0, 2).toUpperCase()}</span>
                  )}

                  {/* Plus Invite Overlay Badge */}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-[#09090b] flex items-center justify-center shadow-lg">
                    <Plus className="w-3 h-3 text-black font-extrabold" />
                  </span>
                </a>
              )}

              {/* Tooltip on Hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-20 px-3.5 py-2 rounded-xl bg-[#121318]/95 border border-white/15 shadow-2xl backdrop-blur-xl pointer-events-none z-50 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{guild.name}</span>
                      {isJoined ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Joined • Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Invite Bot
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <span>{guild.members || (guild.owner ? "Owner" : "Admin")}</span>
                      <span>•</span>
                      <span className="text-zinc-500">ID: {guild.id.slice(0, 6)}...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Add Server Button */}
      <div className="relative group flex items-center justify-center pt-2 border-t border-white/10 w-full">
        <a
          href={`https://discord.com/oauth2/authorize?client_id=939799976308011018&scope=bot+applications.commands&permissions=8`}
          target="_blank"
          rel="noreferrer"
          className="w-12 h-12 rounded-3xl hover:rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg shadow-emerald-500/10 hover:scale-105"
          title="Add Bot to New Server"
        >
          <Plus className="w-6 h-6" />
        </a>

        {/* Tooltip */}
        <div className="absolute left-20 px-3 py-1.5 rounded-xl bg-[#121318] border border-emerald-500/30 text-xs text-emerald-400 whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
          + Invite Aura Bot to Server
        </div>
      </div>
    </aside>
  );
}
