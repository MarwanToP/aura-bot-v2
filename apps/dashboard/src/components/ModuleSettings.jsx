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

/* module accent → icon-tile tone (keeps the colour identity of every module) */
const TONE_BY_COLOR = {
  "#F87171": "icon-tile-red",
  "#FBBF24": "icon-tile-amber",
  "#7C5CFF": "icon-tile-violet",
  "#34D399": "icon-tile-green",
  "#4C7DFF": "icon-tile-blue",
  "#22D3EE": "icon-tile-cyan",
  "#F472B6": "icon-tile-pink",
};

const toneFor = (color) => TONE_BY_COLOR[String(color).toUpperCase()] || "";

/* ────────────────────────────── shared UI atoms ────────────────────────────── */

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={(e) => onChange(!enabled, e)}
      aria-pressed={enabled}
      aria-label={enabled ? "Disable" : "Enable"}
      className={`toggle-track ${enabled ? "toggle-track-on" : ""}`}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

/* ────────────────────────────── seed data ────────────────────────────── */

const INITIAL_MODULES = [
  { id: "mod", name: "Auto Moderation", desc: "Anti-spam, word filter, link detection, and a mass-mention shield for Crystal Realm.", icon: Shield, enabled: true, color: "#F87171", config: { antispam: true, badwords: true, maxMentions: 5 } },
  { id: "economy", name: "Economy & Credits", desc: "/daily rewards, work jobs, gambling games, and the server coin store.", icon: Coins, enabled: true, color: "#FBBF24", config: { dailyReward: 500, jobCooldown: "1h", currencySymbol: "🪙" } },
  { id: "leveling", name: "Leveling & XP", desc: "Custom rank cards, XP multipliers, role rewards, and a web leaderboard.", icon: Sparkles, enabled: true, color: "#7C5CFF", config: { xpRate: "1.5x", announceChannel: "#bot-commands", stackRoles: true } },
  { id: "welcome", name: "Welcome & Farewell", desc: "Greet new members with custom embed cards, auto-roles, and welcome DMs.", icon: UserCheck, enabled: true, color: "#34D399", config: { welcomeChannel: "#general", autoRole: "@Member", sendDM: false } },
  { id: "tickets", name: "Ticket Tool", desc: "Multi-panel ticket builder, claim system, and HTML transcripts for Support Central.", icon: Star, enabled: false, color: "#4C7DFF", config: { category: "Support Central", claimSystem: true, htmlTranscript: true } },
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
              className="glass-dropdown pointer-events-none fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-white"
            >
              <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="icon-tile icon-tile-violet h-9 w-9 rounded-xl">
              <Sliders className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="card-title">Module Control Hub</h2>
              <p className="card-sub mt-0.5">
                Enable or disable core bot modules with real-time sync across shards.
              </p>
            </div>
          </div>
          <span className="chip chip-green">
            <span className="status-dot status-dot-online" />
            {enabledCount} / {modules.length} active
          </span>
        </motion.div>

        {saveError && (
          <motion.div
            variants={rise}
            className="flex items-center gap-2.5 rounded-xl border border-[#F87171]/30 bg-[#F87171]/[0.08] px-4 py-3 text-xs font-semibold text-[#FCA5A5]"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {saveError}
          </motion.div>
        )}

        {/* Modules Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.id}
                layoutId={`card-${mod.id}`}
                variants={rise}
                onClick={() => setSelectedModule(mod)}
                whileTap={{ scale: 0.98 }}
                className={`glass-card glass-card-hover group relative cursor-pointer overflow-hidden p-5 ${
                  mod.enabled ? "" : "opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`icon-tile h-10 w-10 rounded-xl ${toneFor(mod.color)}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="card-title truncate text-sm">{mod.name}</h3>
                      <span className={`chip mt-1.5 ${mod.enabled ? "chip-green" : ""}`}>
                        {mod.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <Toggle
                    enabled={mod.enabled}
                    onChange={(_, e) => toggleModule(mod.id, e)}
                  />
                </div>

                <p className="mt-3.5 text-[11px] leading-relaxed text-slate-400">{mod.desc}</p>

                <div className="hairline my-4" />

                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 transition-colors group-hover:text-[#A9C2FF]">
                  <span>Configure module</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {selectedModule && (
            <div className="modal-scrim fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedModule(null)}
                className="absolute inset-0"
              />

              <motion.div
                layoutId={`card-${selectedModule.id}`}
                className="modal-surface relative z-10 w-full max-w-xl space-y-5 overflow-hidden p-6"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className={`icon-tile h-11 w-11 rounded-xl ${toneFor(selectedModule.color)}`}
                    >
                      {React.createElement(selectedModule.icon, { className: "h-5 w-5" })}
                    </span>
                    <div className="min-w-0">
                      <h3 className="card-title truncate">{selectedModule.name}</h3>
                      <p className="card-sub mt-0.5">Module configuration</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedModule(null)}
                    className="btn-icon h-9 w-9 shrink-0 rounded-xl"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <span className="section-label">Settings</span>
                  {Object.entries(selectedModule.config).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
                    >
                      <span className="text-xs font-semibold text-slate-300">
                        {prettifyKey(key)}
                      </span>
                      <span
                        className={`font-mono text-xs font-bold ${
                          typeof val === "boolean"
                            ? val
                              ? "text-[#6EE7B7]"
                              : "text-slate-500"
                            : "text-[#C4B5FD]"
                        }`}
                      >
                        {formatValue(val)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedModule(null)}
                    className="btn-glass"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      showToast(`${selectedModule.name} settings saved`);
                      setSelectedModule(null);
                    }}
                    className="btn-primary"
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
