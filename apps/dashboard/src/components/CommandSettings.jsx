"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/* ────────────────────────────── guest demo data ────────────────────────────── */

/* Humanized fallback — used for guests and when the catalog request fails. */
const DEMO_COMMANDS = [
  { name: "ban", description: "Ban a member permanently from Crystal Realm.", category: "Moderation" },
  { name: "clear", description: "Bulk delete messages in the current channel.", category: "Moderation" },
  { name: "rank", description: "Show a member's level, XP, and rank card.", category: "Leveling" },
  { name: "daily", description: "Claim daily economy credits.", category: "Economy" },
  { name: "ticket", description: "Open a support ticket panel for help.", category: "Utility" },
  { name: "verify", description: "Verify accounts through the HCaptcha portal.", category: "Security" },
];

const DEMO_ROLES = [
  "@Admin Council",
  "@Moderator",
  "@Trial Mod",
  "@VIP Supporter",
  "@Member",
];

/* Demo preset for the role restrictions modal. */
const DEMO_ALLOWED_ROLES = ["@Admin Council", "@Moderator"];

/* ────────────────────────────── payload helpers ────────────────────────────── */

function normalizeSettings(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [name, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object") continue;
    out[name] = {
      enabled: value.enabled !== false,
      allowedRoles: Array.isArray(value.allowedRoles) ? value.allowedRoles.map(String) : [],
    };
  }
  return out;
}

function normalizeRoles(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((role) => role && role.id)
    .map((role) => ({ id: String(role.id), name: String(role.name || role.id) }));
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function CommandSettings({ guildId }) {
  const [commands, setCommands] = useState(DEMO_COMMANDS);
  const [settingsMap, setSettingsMap] = useState({});
  const [loading, setLoading] = useState(() => Boolean(guildId));
  const [selectedCmd, setSelectedCmd] = useState(null);
  const [roles, setRoles] = useState(() => DEMO_ROLES.map((name) => ({ id: name, name })));
  const [roleDraft, setRoleDraft] = useState(DEMO_ALLOWED_ROLES);
  const [toast, setToast] = useState(null);
  /* true only when the catalog AND the per-guild settings came from the API */
  const [live, setLive] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  /* request guard — only the latest load may write state */
  const requestSeq = useRef(0);

  const loadCommands = useCallback(async () => {
    const requestId = ++requestSeq.current;

    /* Guest mode: no real guild, so there is nothing to load — never hit the network. */
    if (!guildId) {
      setCommands(DEMO_COMMANDS);
      setSettingsMap({});
      setRoles(DEMO_ROLES.map((name) => ({ id: name, name })));
      setLive(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    const [catalogRes, settingsRes, rolesRes] = await Promise.allSettled([
      fetch("/api/commands"),
      fetch(`/api/commands/${guildId}`),
      fetch(`/api/guilds/${guildId}/roles`),
    ]);

    if (requestId !== requestSeq.current) return; // stale response from a previous guild

    let catalogLive = false;
    let settingsLive = false;

    /* One warning per load cycle, listing exactly which read failed. */
    const failures = [];
    let firstError = null;
    const failure = (label, res) => {
      failures.push(label);
      if (!firstError) {
        firstError =
          res.status === "rejected" ? res.reason : new Error(`HTTP ${res.value?.status}`);
      }
    };

    if (catalogRes.status === "fulfilled" && catalogRes.value.ok) {
      const data = await catalogRes.value.json();
      if (requestId !== requestSeq.current) return;
      /* The catalog route answers with a bare array of commands. */
      setCommands(Array.isArray(data) ? data.filter((cmd) => cmd && cmd.name) : []);
      catalogLive = true;
    } else {
      failure("the command catalog", catalogRes);
      setCommands(DEMO_COMMANDS);
    }

    if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
      const data = await settingsRes.value.json();
      if (requestId !== requestSeq.current) return;
      setSettingsMap(normalizeSettings(data?.settings));
      settingsLive = true;
    } else {
      failure("command settings", settingsRes);
      setSettingsMap({});
    }

    if (rolesRes.status === "fulfilled" && rolesRes.value.ok) {
      const data = await rolesRes.value.json();
      if (requestId !== requestSeq.current) return;
      setRoles(normalizeRoles(data?.roles));
    } else {
      failure("guild roles", rolesRes);
      setRoles([]);
    }

    if (failures.length > 0) {
      console.warn(
        `[CommandSettings] Failed to load ${failures.join(", ")} — showing demo data:`,
        firstError
      );
    }

    setLive(catalogLive && settingsLive);
    setLoading(false);
  }, [guildId]);

  useEffect(() => {
    loadCommands();
    return () => {
      // Invalidate in-flight loads so a previous guild's response can't clobber state.
      requestSeq.current += 1;
    };
  }, [loadCommands]);

  /* Real roles, plus a placeholder for a role id that no longer exists. */
  const roleOptions = useMemo(() => {
    if (!live) return roles;
    const known = new Set(roles.map((role) => role.id));
    const extras = (settingsMap[selectedCmd?.name]?.allowedRoles || [])
      .filter((id) => !known.has(id))
      .map((id) => ({ id, name: "Unknown role" }));
    return [...roles, ...extras];
  }, [roles, settingsMap, selectedCmd, live]);

  const openRolePicker = (cmd) => {
    setSelectedCmd(cmd);
    if (!guildId) {
      setRoleDraft(DEMO_ALLOWED_ROLES);
      return;
    }
    setRoleDraft(settingsMap[cmd.name]?.allowedRoles || []);
  };

  const toggleCommand = async (name, current) => {
    /* Guest demo: the toggle is local only — nothing is persisted. */
    if (!guildId) {
      setSettingsMap((prev) => ({
        ...prev,
        [name]: { ...(prev[name] || {}), enabled: !current },
      }));
      return;
    }
    if (!live) {
      showToast("Couldn't load live settings — nothing was saved");
      return;
    }
    const next = !current;
    const allowedRoles = settingsMap[name]?.allowedRoles || [];
    try {
      const res = await fetch(`/api/commands/${guildId}/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next, allowedRoles }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || `Failed to update /${name}`);
        return;
      }
      setSettingsMap((prev) => ({
        ...prev,
        [name]: { ...(prev[name] || {}), enabled: next, allowedRoles },
      }));
      showToast(`/${name} ${next ? "enabled" : "disabled"}`);
    } catch (err) {
      console.warn("[CommandSettings] Failed to update a command setting:", err);
      showToast("Network error while saving command settings");
    }
  };

  const toggleRole = (roleId) => {
    setRoleDraft((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const saveRoleRestrictions = async () => {
    const name = selectedCmd?.name;
    if (!name) return;

    /* Guest demo: nothing is persisted anywhere, so keep the original local feedback. */
    if (!guildId) {
      showToast(`Role restrictions saved for /${name}`);
      setSelectedCmd(null);
      return;
    }
    if (!live) {
      showToast("Couldn't load live settings — nothing was saved");
      return;
    }

    const enabled = settingsMap[name]?.enabled !== false;
    try {
      const res = await fetch(`/api/commands/${guildId}/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, allowedRoles: roleDraft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || `Failed to save restrictions for /${name}`);
        return;
      }
      setSettingsMap((prev) => ({
        ...prev,
        [name]: { ...(prev[name] || {}), enabled, allowedRoles: roleDraft },
      }));
      setSelectedCmd(null);
      showToast(`Role restrictions saved for /${name}`);
    } catch (err) {
      console.warn("[CommandSettings] Failed to save role restrictions:", err);
      showToast("Network error while saving role restrictions");
    }
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
      {commands.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <Terminal className="h-4 w-4" />
          </span>
          <span className="empty-state-title">No commands registered</span>
          <span>The bot has not registered any slash commands for this server yet.</span>
        </div>
      ) : (
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
                  onClick={() => openRolePicker(cmd)}
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
      )}

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

              {roleOptions.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">
                    <Shield className="h-4 w-4" />
                  </span>
                  <span className="empty-state-title">No roles available</span>
                  <span>
                    This server has no roles the dashboard can read, so nobody can be restricted.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {roleOptions.map((role) => {
                    const isChecked = roleDraft.includes(role.id);
                    return (
                      <div
                        key={role.id}
                        onClick={() => toggleRole(role.id)}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-colors ${
                          isChecked
                            ? "border-[#4C7DFF]/40 bg-[#4C7DFF]/[0.12] text-white"
                            : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.14]"
                        }`}
                      >
                        <span>{role.name}</span>
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
                  })}
                </div>
              )}

              <p className="text-[10px] text-slate-500">
                {roleDraft.length === 0
                  ? "No roles selected — this command stays available to everyone."
                  : "Only members with one of the selected roles can use this command."}
              </p>

              <div className="flex justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  onClick={saveRoleRestrictions}
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
