"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Shield,
  Coins,
  Sparkles,
  Star,
  UserCheck,
  Sliders,
  X,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { fetchGuildModules, updateGuildModules } from "../app/lib/api";

/* ────────────────────────────── motion helpers ────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.03 } },
};

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/* ────────────────────────────── helpers ────────────────────────────── */

const prettifyKey = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const formatValue = (v) => (typeof v === "boolean" ? (v ? "On" : "Off") : String(v));

/* ────────────────────────────── seed data ────────────────────────────── */

const INITIAL_MODULES = [
  { id: "mod", name: "Auto Moderation", desc: "Anti-spam, word filter, link detection, and a mass-mention shield for Crystal Realm.", icon: Shield, enabled: true, color: "#FF5C7A", config: { antispam: true, badwords: true, maxMentions: 5 } },
  { id: "economy", name: "Economy & Credits", desc: "/daily rewards, work jobs, gambling games, and the server coin store.", icon: Coins, enabled: true, color: "#FFB547", config: { dailyReward: 500, jobCooldown: "1h", currencySymbol: "🪙" } },
  { id: "leveling", name: "Leveling & XP", desc: "Custom rank cards, XP multipliers, role rewards, and a web leaderboard.", icon: Sparkles, enabled: true, color: "#7C5CFF", config: { xpRate: "1.5x", announceChannel: "#bot-commands", stackRoles: true } },
  { id: "welcome", name: "Welcome & Farewell", desc: "Greet new members with custom embed cards, auto-roles, and welcome DMs.", icon: UserCheck, enabled: true, color: "#39D98A", config: { welcomeChannel: "#general", autoRole: "@Member", sendDM: false } },
  { id: "tickets", name: "Ticket Tool", desc: "Multi-panel ticket builder, claim system, and HTML transcripts for Support Central.", icon: Star, enabled: false, color: "#5B8CFF", config: { category: "Support Central", claimSystem: true, htmlTranscript: true } },
];

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function ModuleSettings({ activeGuild = "default" }) {
  const [modules, setModules] = useState(INITIAL_MODULES);
  const [selectedModule, setSelectedModule] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

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
    const previous = modules;
    const updated = modules.map((m) =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    );
    setModules(updated);

    const payload = updated.reduce((acc, curr) => {
      acc[curr.id] = curr.enabled;
      return acc;
    }, {});
    const result = await updateGuildModules(activeGuild, payload);
    if (!result?.success) {
      // Revert the optimistic toggle and surface the failure.
      setModules(previous);
      setSaveError(result?.error || "Failed to save module settings");
    } else {
      setSaveError(null);
    }
  };

  const enabledCount = modules.filter((m) => m.enabled).length;

  return (
    <LayoutGroup>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              className="fixed bottom-6 right-6 z-[90] panel px-4 py-3 flex items-center gap-2.5 text-xs font-semibold shadow-2xl shadow-black/60"
            >
              <CheckCircle2 className="w-4 h-4 text-[#39D98A]" />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
                <Sliders className="h-4 w-4" />
              </span>
              Module Control Hub
            </h2>
            <p className="mt-1.5 font-body text-xs text-slate-500">
              Enable or disable core bot modules with real-time sync across shards.
            </p>
          </div>
          <span className="bg-[#39D98A]/10 border border-[#39D98A]/25 text-[#39D98A] text-[10px] font-bold px-2.5 py-1 rounded-full font-mono uppercase">
            {enabledCount} / {modules.length} active
          </span>
        </motion.div>

        {saveError && (
          <motion.div
            variants={rise}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#FF5C7A]/10 border border-[#FF5C7A]/25 text-[#FF5C7A] text-xs font-semibold"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {saveError}
          </motion.div>
        )}

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.id}
                layoutId={`card-${mod.id}`}
                variants={rise}
                onClick={() => setSelectedModule(mod)}
                whileTap={{ scale: 0.98 }}
                className={`panel panel-hover p-5 cursor-pointer relative overflow-hidden ${
                  mod.enabled ? "" : "opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${mod.color}1A`,
                        borderColor: `${mod.color}40`,
                        color: mod.color,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-white truncate">{mod.name}</h3>
                      <span
                        className={`inline-flex mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          mod.enabled
                            ? "bg-[#39D98A]/10 border-[#39D98A]/25 text-[#39D98A]"
                            : "bg-white/[0.03] border-white/[0.08] text-slate-500"
                        }`}
                      >
                        {mod.enabled ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={(e) => toggleModule(mod.id, e)}
                    className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors cursor-pointer ${
                      mod.enabled
                        ? "border-[#7C5CFF]/50 bg-[#7C5CFF]/80"
                        : "border-white/[0.08] bg-white/[0.05]"
                    }`}
                    aria-pressed={mod.enabled}
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow ${
                        mod.enabled ? "left-[25px]" : "left-[3px]"
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">{mod.desc}</p>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-[#7C5CFF] transition-colors">
                  <span>Configure module</span>
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
                className="relative w-full max-w-xl panel p-6 z-10 space-y-5 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${selectedModule.color}1A`,
                        borderColor: `${selectedModule.color}40`,
                        color: selectedModule.color,
                      }}
                    >
                      {React.createElement(selectedModule.icon, { className: "w-5 h-5" })}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-white truncate">
                        {selectedModule.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Module configuration</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedModule(null)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <span className="section-label">Settings</span>
                  {Object.entries(selectedModule.config).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                    >
                      <span className="text-xs text-slate-400 font-semibold">
                        {prettifyKey(key)}
                      </span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          typeof val === "boolean"
                            ? val
                              ? "text-[#39D98A]"
                              : "text-slate-500"
                            : "text-[#B9A6FF]"
                        }`}
                      >
                        {formatValue(val)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModule(null)}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      showToast(`${selectedModule.name} settings saved`);
                      setSelectedModule(null);
                    }}
                    className="inline-flex items-center gap-2 bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] cursor-pointer"
                  >
                    Save changes
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}
