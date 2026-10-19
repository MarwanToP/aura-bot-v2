"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Shield, X, Check, CheckCircle2 } from "lucide-react";

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

/* ────────────────────────────── shared UI atoms ────────────────────────────── */

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors cursor-pointer ${
        enabled ? "border-[#7C5CFF]/50 bg-[#7C5CFF]/80" : "border-white/[0.08] bg-white/[0.05]"
      }`}
      aria-pressed={enabled}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow ${
          enabled ? "left-[25px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function CommandSettings({ guildId = "1" }) {
  const [commands, setCommands] = useState([]);
  const [settingsMap, setSettingsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCmd, setSelectedCmd] = useState(null);
  const [allowedRoles, setAllowedRoles] = useState(["@Admin Council", "@Moderator"]);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    if (!guildId) return;
    const fetchData = async () => {
      try {
        const catalog = await fetch(`/api/commands`).then((r) => r.json());
        if (Array.isArray(catalog) && catalog.length > 0) {
          setCommands(catalog);
        } else {
          throw new Error("No data");
        }
      } catch (e) {
        setCommands([
          { name: "ban", description: "Ban a member permanently from Crystal Realm.", category: "Moderation" },
          { name: "clear", description: "Bulk delete messages in the current channel.", category: "Moderation" },
          { name: "rank", description: "Show a member's level, XP, and rank card.", category: "Leveling" },
          { name: "daily", description: "Claim daily economy credits.", category: "Economy" },
          { name: "ticket", description: "Open a support ticket panel for help.", category: "Utility" },
          { name: "verify", description: "Verify accounts through the HCaptcha portal.", category: "Security" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [guildId]);

  const toggleCommand = (name, current) => {
    setSettingsMap((prev) => ({
      ...prev,
      [name]: { ...(prev[name] || {}), enabled: !current },
    }));
  };

  const toggleRole = (role) => {
    setAllowedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  if (loading)
    return (
      <div className="flex items-center gap-2.5 text-xs font-mono text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFF] animate-pulse-dot" />
        Loading command controls…
      </div>
    );

  return (
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
              <Terminal className="h-4 w-4" />
            </span>
            Slash Command Restrictions & Control
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Enable or disable individual slash commands and configure granular role access.
          </p>
        </div>
        <span className="bg-[#7C5CFF]/10 border border-[#7C5CFF]/25 text-[#7C5CFF] text-[10px] font-bold px-2.5 py-1 rounded-full font-mono uppercase">
          {commands.length} commands registered
        </span>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {commands.map((cmd) => {
          const setting = settingsMap[cmd.name] || { enabled: true };
          return (
            <motion.div
              key={cmd.name}
              variants={rise}
              className={`panel panel-hover relative overflow-hidden p-5 flex flex-col ${
                setting.enabled ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-[#B9A6FF]">
                      /{cmd.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        setting.enabled
                          ? "bg-[#39D98A]/10 border-[#39D98A]/25 text-[#39D98A]"
                          : "bg-white/[0.03] border-white/[0.08] text-slate-500"
                      }`}
                    >
                      {setting.enabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-bold text-white">{cmd.description || cmd.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{cmd.category}</p>
                </div>

                <Toggle
                  enabled={setting.enabled}
                  onChange={() => toggleCommand(cmd.name, setting.enabled)}
                />
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setSelectedCmd(cmd)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#7C5CFF] transition-colors cursor-pointer"
                >
                  <Shield className="w-3 h-3" />
                  Edit role restrictions
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Role Restrictions Modal */}
      <AnimatePresence>
        {selectedCmd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="relative w-full max-w-md panel p-6 z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/25 flex items-center justify-center text-[#7C5CFF] shrink-0">
                    <Shield className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      /{selectedCmd.name} restrictions
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Configure role permissions for this command.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCmd(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {["@Admin Council", "@Moderator", "@Trial Mod", "@VIP Supporter", "@Member"].map(
                  (role) => {
                    const isChecked = allowedRoles.includes(role);
                    return (
                      <div
                        key={role}
                        onClick={() => toggleRole(role)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                          isChecked
                            ? "border-[#7C5CFF]/30 bg-[#7C5CFF]/10 text-white"
                            : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12]"
                        }`}
                      >
                        <span>{role}</span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isChecked
                              ? "bg-[#7C5CFF] border-[#7C5CFF] text-white"
                              : "border-white/[0.12]"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    showToast(`Role restrictions saved for /${selectedCmd.name}`);
                    setSelectedCmd(null);
                  }}
                  className="bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] cursor-pointer"
                >
                  Save permissions
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
