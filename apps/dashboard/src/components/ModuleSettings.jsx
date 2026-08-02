"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Shield, Coins, Music, Star, Sparkles, UserCheck, Sliders, X, ArrowRight } from "lucide-react";
import { fetchGuildModules, updateGuildModules } from "../app/lib/api";

const INITIAL_MODULES = [
  { id: "mod", name: "Auto Moderation", desc: "Anti-spam, bad words filter, link detection & mass mention shield.", icon: Shield, enabled: true, color: "#f43f5e", config: { antispam: true, badwords: true, maxMentions: 5 } },
  { id: "economy", name: "Economy & Credits", desc: "/daily rewards, work jobs, gambling games, and server coin store.", icon: Coins, enabled: true, color: "#f59e0b", config: { dailyReward: 500, jobCooldown: "1h", currencySymbol: "🪙" } },
  { id: "leveling", name: "Leveling & XP", desc: "Custom rank cards, XP multiplier, role rewards, and web leaderboard.", icon: Sparkles, enabled: true, color: "#3b82f6", config: { xpRate: "1.5x", announceChannel: "#bot-commands", stackRoles: true } },
  { id: "welcome", name: "Welcome & Farewell", desc: "Greet new members with custom embed cards, auto-roles, and DMs.", icon: UserCheck, enabled: true, color: "#10b981", config: { welcomeChannel: "#welcome", autoRole: "@Member", sendDM: false } },
  { id: "tickets", name: "Ticket Tool", desc: "Multi-panel ticket builder, claim system, and HTML web transcripts.", icon: Star, enabled: false, color: "#ec4899", config: { category: "Support", claimSystem: true, htmlTranscript: true } },
];

export default function ModuleSettings({ activeGuild = "default" }) {
  const [modules, setModules] = useState(INITIAL_MODULES);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    fetchGuildModules(activeGuild).then((remoteModules) => {
      if (remoteModules) {
        setModules((prev) =>
          prev.map((m) => ({
            ...m,
            enabled: remoteModules[m.id] !== undefined ? remoteModules[m.id] : m.enabled,
          }))
        );
      }
    });
  }, [activeGuild]);

  const toggleModule = async (id, e) => {
    e.stopPropagation();
    const updated = modules.map((m) =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    );
    setModules(updated);

    const payload = updated.reduce((acc, curr) => {
      acc[curr.id] = curr.enabled;
      return acc;
    }, {});
    await updateGuildModules(activeGuild, payload);
  };

  return (
    <LayoutGroup>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-purple-400" />
              Module Control Hub
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Enable or disable core bot modules with real-time sync across shards.
            </p>
          </div>
          <span className="text-xs font-mono px-3.5 py-1.5 rounded-xl bg-[#121520] border border-[#1e2333] text-purple-400 font-bold">
            {modules.filter((m) => m.enabled).length} / {modules.length} ACTIVE
          </span>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.id}
                layoutId={`card-${mod.id}`}
                onClick={() => setSelectedModule(mod)}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`dark-panel p-6 cursor-pointer relative overflow-hidden transition-all ${
                  mod.enabled ? "opacity-100" : "opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]"
                      style={{ color: mod.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{mod.name}</h3>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          mod.enabled
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30"
                        }`}
                      >
                        {mod.enabled ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={(e) => toggleModule(mod.id, e)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${
                      mod.enabled ? "bg-purple-600" : "bg-[#1e2333]"
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`w-4 h-4 rounded-full bg-white shadow-md ${
                        mod.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {mod.desc}
                </p>

                <div className="pt-3 border-t border-[#1e2333] flex items-center justify-between text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
                  <span>Configure Module</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {selectedModule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedModule(null)}
                className="absolute inset-0"
              />

              <motion.div
                layoutId={`card-${selectedModule.id}`}
                className="relative w-full max-w-xl dark-panel p-7 z-10 space-y-6 overflow-hidden border border-[#1e2333]"
              >
                <div className="flex items-center justify-between border-b border-[#1e2333] pb-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]"
                      style={{ color: selectedModule.color }}
                    >
                      {React.createElement(selectedModule.icon, { className: "w-6 h-6" })}
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-white">{selectedModule.name}</h3>
                      <p className="text-xs text-zinc-400">Module Configuration Panel</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedModule(null)}
                    className="p-2 rounded-xl bg-[#0b0d14] text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">Settings</div>
                  {Object.entries(selectedModule.config).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                      <span className="text-zinc-300 font-semibold">{key}:</span>
                      <span className="text-purple-400 font-bold">{String(val)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#1e2333] flex items-center justify-end gap-3">
                  <button
                    onClick={() => setSelectedModule(null)}
                    className="px-5 py-2 rounded-xl bg-[#0b0d14] border border-[#1e2333] text-xs text-zinc-300 font-bold hover:bg-[#1e2333] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setSelectedModule(null)}
                    className="px-6 py-2 rounded-xl gradient-active-btn text-white font-bold text-xs shadow-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
