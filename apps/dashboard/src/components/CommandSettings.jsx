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
      aria-pressed={enabled}
      aria-label={enabled ? "Disable" : "Enable"}
      className={`toggle-track ${enabled ? "toggle-track-on" : ""}`}
    >
      <span className="toggle-thumb" />
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
      <div className="glass-card flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4C7DFF] animate-pulse-dot" />
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
          <span className="icon-tile icon-tile-blue h-9 w-9 rounded-xl">
            <Terminal className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title">Slash Command Restrictions</h2>
            <p className="card-sub mt-0.5">
              Enable or disable individual slash commands and configure granular role access.
            </p>
          </div>
        </div>
        <span className="chip chip-violet">{commands.length} commands registered</span>
      </motion.div>

      {/* Command list */}
      <motion.div
        variants={rise}
        className="glass-card divide-y divide-white/[0.05] overflow-hidden p-1.5"
      >
        {commands.map((cmd) => {
          const setting = settingsMap[cmd.name] || { enabled: true };
          return (
            <motion.div
              key={cmd.name}
              variants={rise}
              className={`list-row flex-wrap gap-3 px-3.5 py-3 ${
                setting.enabled ? "" : "opacity-70"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <span className="icon-tile icon-tile-violet h-9 w-9 rounded-xl">
                  <Terminal className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-white">
                      /{cmd.name}
                    </span>
                    {cmd.category && <span className="chip chip-violet">{cmd.category}</span>}
                    {!setting.enabled && <span className="chip">Paused</span>}
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-400">
                    {cmd.description || cmd.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCmd(cmd)}
                className="btn-ghost shrink-0 text-[11px]"
              >
                <Shield className="h-3.5 w-3.5" />
                Roles
              </button>

              <Toggle
                enabled={setting.enabled}
                onChange={() => toggleCommand(cmd.name, setting.enabled)}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Role Restrictions Modal */}
      <AnimatePresence>
        {selectedCmd && (
          <div className="modal-scrim fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="modal-surface relative z-10 w-full max-w-md space-y-5 p-6"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-3">
                  <span className="icon-tile icon-tile-violet h-9 w-9 rounded-xl">
                    <Shield className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="card-title">/{selectedCmd.name} restrictions</h3>
                    <p className="card-sub mt-0.5">
                      Configure role permissions for this command.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCmd(null)}
                  className="btn-icon h-9 w-9 shrink-0 rounded-xl"
                >
                  <X className="h-4 w-4" />
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
                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-colors ${
                          isChecked
                            ? "border-[#4C7DFF]/40 bg-[#4C7DFF]/[0.12] text-white"
                            : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.14]"
                        }`}
                      >
                        <span>{role}</span>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            isChecked
                              ? "border-[#4C7DFF] bg-[#4C7DFF] text-white"
                              : "border-white/[0.12]"
                          }`}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="flex justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    showToast(`Role restrictions saved for /${selectedCmd.name}`);
                    setSelectedCmd(null);
                  }}
                  className="btn-primary"
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
