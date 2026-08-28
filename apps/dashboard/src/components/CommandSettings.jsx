"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Shield, X, Check } from "lucide-react";

export default function CommandSettings({ guildId = "1" }) {
  const [commands, setCommands] = useState([]);
  const [settingsMap, setSettingsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCmd, setSelectedCmd] = useState(null);
  const [allowedRoles, setAllowedRoles] = useState(["@Administrator", "@Moderator"]);

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
          { name: "ban", description: "Ban a user permanently from the guild.", category: "Moderation" },
          { name: "clear", description: "Bulk delete messages in the current channel.", category: "Moderation" },
          { name: "rank", description: "Display member level rank card and stats.", category: "Leveling" },
          { name: "daily", description: "Claim daily economy credit rewards.", category: "Economy" },
          { name: "ticket", description: "Open a support ticket panel for help.", category: "Utility" },
          { name: "verify", description: "Verify account through HCaptcha portal.", category: "Security" },
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

  if (loading) return <div className="text-zinc-400 font-mono text-xs">Loading command controls…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-purple-400" />
            Slash Command Restrictions & Control
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Enable or disable individual slash commands and configure granular role access.
          </p>
        </div>
        <span className="text-xs font-mono px-3.5 py-1.5 rounded-xl bg-[#121520] border border-[#1e2333] text-purple-400 font-bold">
          {commands.length} COMMANDS REGISTERED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {commands.map((cmd) => {
          const setting = settingsMap[cmd.name] || { enabled: true };
          return (
            <motion.div
              key={cmd.name}
              whileHover={{ y: -3, scale: 1.01 }}
              className={`dark-panel p-6 relative overflow-hidden transition-all ${
                setting.enabled ? "opacity-100" : "opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-xl bg-[#0b0d14] border border-[#1e2333] font-mono text-xs font-extrabold text-purple-400">
                    /{cmd.name}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{cmd.description || cmd.name}</h3>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        setting.enabled
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30"
                      }`}
                    >
                      {setting.enabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleCommand(cmd.name, setting.enabled)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                    setting.enabled ? "bg-purple-600" : "bg-[#1e2333]"
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`w-4 h-4 rounded-full bg-white shadow-md ${
                      setting.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t border-[#1e2333] flex items-center justify-between text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
                <button onClick={() => setSelectedCmd(cmd)} className="cursor-pointer hover:underline flex items-center gap-1">
                  <span>Edit Role Restrictions →</span>
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
              className="relative w-full max-w-md dark-panel p-6 z-10 space-y-5 border border-[#1e2333]"
            >
              <div className="flex items-center justify-between border-b border-[#1e2333] pb-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">/{selectedCmd.name} Restrictions</h3>
                    <p className="text-[11px] text-zinc-400">Configure role permissions for this command.</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCmd(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {["@Administrator", "@Moderator", "@VIP Supporter", "@Everyone"].map((role) => {
                  const isChecked = allowedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      onClick={() => toggleRole(role)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333] text-xs font-medium cursor-pointer hover:border-purple-500/40 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-purple-500"
                    >
                      <span className="text-zinc-200">{role}</span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isChecked ? "bg-purple-600 border-purple-500 text-white" : "border-[#1e2333]"}`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#1e2333] flex justify-end">
                <button
                  onClick={() => setSelectedCmd(null)}
                  className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold shadow-lg cursor-pointer"
                >
                  Save Permissions
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
