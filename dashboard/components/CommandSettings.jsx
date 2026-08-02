// CommandSettings.jsx – UI for per‑command enable/disable and role restrictions
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sliders, Shield, Plus, X, Check, Lock } from "lucide-react";

/**
 * Props:
 *  - guildId: Discord guild snowflake (string)
 */
export default function CommandSettings({ guildId }) {
  const [commands, setCommands] = useState([]);
  const [settingsMap, setSettingsMap] = useState({}); // { commandName: { enabled, allowedRoles } }
  const [loading, setLoading] = useState(true);
  const [activeModalCmd, setActiveModalCmd] = useState(null); // command object currently open in role modal
  const [newRoleId, setNewRoleId] = useState("");
  const [modalAllowedRoles, setModalAllowedRoles] = useState([]);
  const [savingModal, setSavingModal] = useState(false);

  // Fetch command catalog and per‑guild settings
  useEffect(() => {
    if (!guildId) return;
    const fetchData = async () => {
      try {
        const catalog = await fetch(`/api/commands`).then((r) => r.json());
        setCommands(catalog || []);
        setLoading(false);
      } catch (e) {
        console.error("Failed to load command catalog", e);
        setLoading(false);
      }
    };
    fetchData();
  }, [guildId]);

  // Lazy‑load setting for a command
  const loadCommandSetting = async (name) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/command-settings/${name}`);
      const json = await res.json();
      setSettingsMap((prev) => ({ ...prev, [name]: json.setting }));
    } catch (e) {
      console.error("Failed to load setting for", name, e);
    }
  };

  const toggleCommand = async (name, current) => {
    const action = current ? "disable" : "enable";
    try {
      const existingRoles = settingsMap[name]?.allowedRoles || [];
      await fetch(`/api/guilds/${guildId}/command-settings/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, allowedRoles: existingRoles })
      });
      setSettingsMap((prev) => ({
        ...prev,
        [name]: { ...(prev[name] || {}), enabled: !current }
      }));
    } catch (e) {
      console.error("Toggle failed", e);
    }
  };

  const openRoleModal = (cmd) => {
    const setting = settingsMap[cmd.name] || { enabled: true, allowedRoles: [] };
    setActiveModalCmd(cmd);
    setModalAllowedRoles(setting.allowedRoles || []);
    setNewRoleId("");
  };

  const handleAddRole = () => {
    const trimmed = newRoleId.trim();
    if (!trimmed) return;
    if (!modalAllowedRoles.includes(trimmed)) {
      setModalAllowedRoles((prev) => [...prev, trimmed]);
    }
    setNewRoleId("");
  };

  const handleRemoveRole = (roleIdToRemove) => {
    setModalAllowedRoles((prev) => prev.filter((r) => r !== roleIdToRemove));
  };

  const handleSaveModal = async () => {
    if (!activeModalCmd) return;
    setSavingModal(true);
    const name = activeModalCmd.name;
    const currentEnabled = settingsMap[name]?.enabled !== false;
    const action = currentEnabled ? "enable" : "disable";

    try {
      await fetch(`/api/guilds/${guildId}/command-settings/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, allowedRoles: modalAllowedRoles })
      });

      setSettingsMap((prev) => ({
        ...prev,
        [name]: { ...(prev[name] || {}), allowedRoles: modalAllowedRoles }
      }));
      setActiveModalCmd(null);
    } catch (e) {
      console.error("Failed to save role settings", e);
    } finally {
      setSavingModal(false);
    }
  };

  if (loading) return <div className="text-zinc-400">Loading command controls…</div>;

  return (
    <div className="my-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" /> Command Control Hub
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Enable/disable individual slash commands and restrict them to specific Discord roles.
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2]">
          {commands.length} commands
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {commands.map((cmd) => {
          const setting = settingsMap[cmd.name] || { enabled: true, allowedRoles: [] };
          if (!settingsMap[cmd.name]) loadCommandSetting(cmd.name);
          const hasRoleRestrictions = setting.allowedRoles && setting.allowedRoles.length > 0;

          return (
            <motion.div
              key={cmd.name}
              layout
              className={`relative rounded-2xl border p-5 transition-all duration-300 ${
                setting.enabled ? "bg-white/[0.04] border-white/20 shadow-lg" : "bg-white/[0.01] border-white/5 opacity-70"
              }`}
            >
              {setting.enabled && (
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none opacity-15 blur-xl transition-opacity"
                  style={{ backgroundColor: "#5865F2" }}
                />
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.05]">
                    <span className="text-sm font-mono uppercase text-[#5865F2]">/{cmd.name}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{cmd.description || cmd.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                          setting.enabled
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30"
                        }`}
                      >
                        {setting.enabled ? "ENABLED" : "DISABLED"}
                      </span>
                      {hasRoleRestrictions && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          {setting.allowedRoles.length} ROLE{setting.allowedRoles.length > 1 ? "S" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleCommand(cmd.name, setting.enabled)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${
                    setting.enabled ? "bg-[#5865F2]" : "bg-zinc-800"
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`w-4 h-4 rounded-full bg-white shadow-md ${
                      setting.enabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <button
                  onClick={() => openRoleModal(cmd)}
                  className="text-xs font-semibold text-[#5865F2] hover:text-cyan-400 transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" /> Edit Role Restrictions →
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Role Restriction Modal */}
      <AnimatePresence>
        {activeModalCmd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121318] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    Role Restrictions for /{activeModalCmd.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Only members with at least one of these role IDs will be allowed to use this command. Leaving this empty allows all members.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModalCmd(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Allowed Roles */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Allowed Role IDs
                </label>
                {modalAllowedRoles.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic bg-white/[0.02] border border-white/5 rounded-xl p-3">
                    No role restrictions configured. All members can execute this command.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                    {modalAllowedRoles.map((roleId) => (
                      <span
                        key={roleId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/40 text-xs font-mono text-cyan-300"
                      >
                        {roleId}
                        <button
                          onClick={() => handleRemoveRole(roleId)}
                          className="hover:text-red-400 transition-colors ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Role ID */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Add Role ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Discord Role ID (e.g. 109876543210987654)"
                    value={newRoleId}
                    onChange={(e) => setNewRoleId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#5865F2]"
                  />
                  <button
                    onClick={handleAddRole}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setActiveModalCmd(null)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModal}
                  disabled={savingModal}
                  className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#5865F2]/25 transition-all flex items-center gap-1.5"
                >
                  {savingModal ? "Saving…" : <><Check className="w-4 h-4" /> Save Restrictions</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
