"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Lock,
  Unlock,
  Webhook,
  Bot,
  UserX,
  UserCheck,
  RefreshCw,
  Save,
  Check,
  Flame,
  AlertTriangle,
} from "lucide-react";

export default function SecurityModule({ guildId = "default" }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingVault, setRefreshingVault] = useState(false);
  const [unquarantiningId, setUnquarantiningId] = useState(null);
  const [toast, setToast] = useState(null);

  // Security Configuration State
  const [security, setSecurity] = useState({
    antiNukeEnabled: false,
    antiRaidEnabled: false,
    verificationEnabled: false,
    botAddLock: false,
    webhookProtection: true,
    heatThresholds: {
      velocity: 10,
      linkDensity: 3.0,
      accountAgeDays: 7,
      quarantineThreshold: 30.0,
    },
    lockdownActive: false,
  });

  // Quarantined Users List State
  const [quarantineVault, setQuarantineVault] = useState([]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const [resSec, resQuarantine] = await Promise.all([
        fetch(`/api/guilds/${guildId}/security`),
        fetch(`/api/guilds/${guildId}/quarantine`),
      ]);

      if (resSec.ok) {
        const secData = await resSec.json();
        setSecurity({
          antiNukeEnabled: Boolean(secData.antiNukeEnabled),
          antiRaidEnabled: Boolean(secData.antiRaidEnabled),
          verificationEnabled: Boolean(secData.verificationEnabled),
          botAddLock: Boolean(secData.botAddLock),
          webhookProtection: Boolean(secData.webhookProtection),
          heatThresholds: {
            velocity: secData.heatThresholds?.velocity ?? 10,
            linkDensity: secData.heatThresholds?.linkDensity ?? 3.0,
            accountAgeDays: secData.heatThresholds?.accountAgeDays ?? 7,
            quarantineThreshold: secData.heatThresholds?.quarantineThreshold ?? 30.0,
          },
          lockdownActive: Boolean(secData.lockdownActive),
        });
      }

      if (resQuarantine.ok) {
        const qData = await resQuarantine.json();
        setQuarantineVault(Array.isArray(qData) ? qData : []);
      }
    } catch (err) {
      console.error("[SecurityModule] Error loading security data:", err);
      showToast("Failed to load security settings", "error");
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  const refreshVault = async () => {
    setRefreshingVault(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/quarantine`);
      if (res.ok) {
        const data = await res.json();
        setQuarantineVault(Array.isArray(data) ? data : []);
        showToast("Quarantine Vault refreshed", "success");
      }
    } catch (err) {
      console.error("[SecurityModule] Vault refresh error:", err);
    } finally {
      setRefreshingVault(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/security`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(security),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.settings) {
          setSecurity((prev) => ({
            ...prev,
            antiNukeEnabled: Boolean(result.settings.antiNukeEnabled),
            antiRaidEnabled: Boolean(result.settings.antiRaidEnabled),
            verificationEnabled: Boolean(result.settings.verificationEnabled),
            botAddLock: Boolean(result.settings.botAddLock),
            webhookProtection: Boolean(result.settings.webhookProtection),
            heatThresholds: result.settings.heatThresholds || prev.heatThresholds,
            lockdownActive: Boolean(result.settings.lockdownActive),
          }));
        }
        showToast("Security configuration saved successfully!", "success");
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || "Failed to save security settings", "error");
      }
    } catch (err) {
      console.error("[SecurityModule] Save error:", err);
      showToast("Network error while saving security settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLockdown = async () => {
    const nextState = !security.lockdownActive;
    setSecurity((prev) => ({ ...prev, lockdownActive: nextState }));
    try {
      const res = await fetch(`/api/guilds/${guildId}/security`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...security, lockdown: nextState }),
      });

      if (res.ok) {
        showToast(
          nextState
            ? "🚨 EMERGENCY LOCKDOWN ACTIVATED!"
            : "✅ Emergency Lockdown Lifted",
          nextState ? "error" : "success"
        );
      }
    } catch (err) {
      console.error("[SecurityModule] Lockdown toggle error:", err);
      showToast("Failed to toggle emergency lockdown state", "error");
    }
  };

  const handleUnquarantineUser = async (userId) => {
    setUnquarantiningId(userId);
    try {
      const res = await fetch(
        `/api/guilds/${guildId}/quarantine/${userId}/unquarantine`,
        { method: "POST" }
      );

      if (res.ok) {
        setQuarantineVault((prev) => prev.filter((u) => u.userId !== userId));
        showToast(`User ${userId} successfully restored from Quarantine Vault!`, "success");
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || "Failed to unquarantine user", "error");
      }
    } catch (err) {
      console.error("[SecurityModule] Unquarantine error:", err);
      showToast("Error communicating with server to restore user", "error");
    } finally {
      setUnquarantiningId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center bg-[#09090b] text-white p-8 rounded-2xl border border-white/10">
        <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-400">
          Synthesizing Security & Anti-Nuke Matrix...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#09090b] text-white p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-3 backdrop-blur-md text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300"
                : "bg-rose-950/80 border-rose-500/30 text-rose-300"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-wide text-white">
                Security & Anti-Nuke Matrix
              </h1>
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                  security.antiNukeEnabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
                }`}
              >
                {security.antiNukeEnabled ? "SHIELD ARMED" : "DISARMED"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Synthesized defense engine (Wick, Vetox, Security Bot) with heat accumulation & automated quarantine vault.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Emergency Lockdown Action Button */}
          <button
            onClick={handleToggleLockdown}
            className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
              security.lockdownActive
                ? "bg-rose-600 hover:bg-rose-700 border-rose-500 text-white shadow-rose-600/30"
                : "bg-zinc-900 hover:bg-rose-950/40 border-rose-500/30 text-rose-400 hover:text-rose-300"
            }`}
          >
            {security.lockdownActive ? (
              <>
                <Lock className="w-4 h-4 animate-pulse" /> LOCKDOWN ACTIVE
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" /> TRIGGER LOCKDOWN
              </>
            )}
          </button>

          <button
            onClick={fetchSecurityData}
            className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
            title="Reload configuration"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-600/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Matrix"}
          </button>
        </div>
      </div>

      {/* Main Defense Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 mb-8">
        {/* Card 1: Interactive Defense Toggles */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-rose-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Live Defense Toggles</h2>
                <p className="text-xs text-zinc-400">
                  Real-time perimeter shields & automated enforcement
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Toggle 1: Anti-Nuke */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">Anti-Nuke Shield</h3>
                  <p className="text-[11px] text-zinc-400">
                    Blocks rapid channel/role deletions and unauthorized bans.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSecurity((prev) => ({
                    ...prev,
                    antiNukeEnabled: !prev.antiNukeEnabled,
                  }))
                }
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${
                  security.antiNukeEnabled ? "bg-rose-600" : "bg-zinc-800"
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`w-4 h-4 rounded-full bg-white shadow-md ${
                    security.antiNukeEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Anti-Raid */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">Anti-Raid Velocity Filter</h3>
                  <p className="text-[11px] text-zinc-400">
                    Detects join spikes, alt patterns & username similarity.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSecurity((prev) => ({
                    ...prev,
                    antiRaidEnabled: !prev.antiRaidEnabled,
                  }))
                }
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${
                  security.antiRaidEnabled ? "bg-amber-500" : "bg-zinc-800"
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`w-4 h-4 rounded-full bg-white shadow-md ${
                    security.antiRaidEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Bot Add Lock */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">Bot Add Lock</h3>
                  <p className="text-[11px] text-zinc-400">
                    Immediately bans non-whitelisted unauthorized bot additions.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSecurity((prev) => ({
                    ...prev,
                    botAddLock: !prev.botAddLock,
                  }))
                }
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${
                  security.botAddLock ? "bg-cyan-500" : "bg-zinc-800"
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`w-4 h-4 rounded-full bg-white shadow-md ${
                    security.botAddLock ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 4: Webhook Protection */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-3">
                <Webhook className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">Webhook Protection</h3>
                  <p className="text-[11px] text-zinc-400">
                    Monitors & deletes unauthorized webhook creations & spam.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSecurity((prev) => ({
                    ...prev,
                    webhookProtection: !prev.webhookProtection,
                  }))
                }
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${
                  security.webhookProtection ? "bg-purple-600" : "bg-zinc-800"
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`w-4 h-4 rounded-full bg-white shadow-md ${
                    security.webhookProtection ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Heat Score Thresholds & Heuristics Sliders */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-orange-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Heat Score Heuristics</h2>
                <p className="text-xs text-zinc-400">
                  Calibrate cumulative threat scoring thresholds
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300">
              ALGORITHM ACTIVE
            </span>
          </div>

          <div className="space-y-5">
            {/* Slider 1: Message Velocity */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                <span className="text-zinc-300">Message Burst Velocity Limit</span>
                <span className="text-orange-400 font-mono font-bold">
                  {security.heatThresholds.velocity} msgs/min
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={security.heatThresholds.velocity}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    heatThresholds: {
                      ...prev.heatThresholds,
                      velocity: Number(e.target.value),
                    },
                  }))
                }
                className="w-full accent-orange-500 bg-black/40 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Max permitted message frequency per minute before adding heat penalties.
              </p>
            </div>

            {/* Slider 2: Link Density */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                <span className="text-zinc-300">Link Density Multiplier</span>
                <span className="text-amber-400 font-mono font-bold">
                  {security.heatThresholds.linkDensity}x multiplier
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={security.heatThresholds.linkDensity}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    heatThresholds: {
                      ...prev.heatThresholds,
                      linkDensity: Number(e.target.value),
                    },
                  }))
                }
                className="w-full accent-amber-500 bg-black/40 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Weight added to message heat score per URL/invite link sent.
              </p>
            </div>

            {/* Slider 3: Account Age Heuristics */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                <span className="text-zinc-300">Account Age Threshold</span>
                <span className="text-cyan-400 font-mono font-bold">
                  &lt; {security.heatThresholds.accountAgeDays} Days Old
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={security.heatThresholds.accountAgeDays}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    heatThresholds: {
                      ...prev.heatThresholds,
                      accountAgeDays: Number(e.target.value),
                    },
                  }))
                }
                className="w-full accent-cyan-500 bg-black/40 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Accounts created more recently than this threshold incur 1.5x heat penalty.
              </p>
            </div>

            {/* Slider 4: Quarantine Heat Threshold */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                <span className="text-zinc-300">Quarantine Trigger Threshold</span>
                <span className="text-rose-400 font-mono font-bold">
                  {security.heatThresholds.quarantineThreshold} Heat Pts
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={security.heatThresholds.quarantineThreshold}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    heatThresholds: {
                      ...prev.heatThresholds,
                      quarantineThreshold: Number(e.target.value),
                    },
                  }))
                }
                className="w-full accent-rose-500 bg-black/40 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Accumulated heat points that automatically isolate user in Quarantine Vault.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Quarantine Vault Table */}
      <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6 relative z-10">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <UserX className="w-5 h-5 text-rose-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Quarantine Vault</h2>
              <p className="text-xs text-zinc-400">
                Isolates high-risk users breaching heat thresholds with instant restore/unquarantine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {quarantineVault.length} ISOLATED USERS
            </span>
            <button
              onClick={refreshVault}
              disabled={refreshingVault}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-xs text-zinc-300 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshingVault ? "animate-spin" : ""}`}
              />
              Refresh Vault
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {quarantineVault.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-black/20">
              <ShieldCheck className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
              <p className="text-xs text-zinc-300 font-semibold">
                Quarantine Vault is currently empty.
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                No users are currently quarantined in this server.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-white/[0.04] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">User Details</th>
                  <th className="px-4 py-3">Quarantine Reason</th>
                  <th className="px-4 py-3">Triggered At</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Vault Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {quarantineVault.map((user) => (
                  <tr key={user.userId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-300 text-xs font-bold">
                          {user.userTag ? user.userTag.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <p className="text-white font-medium font-sans text-xs">
                            {user.userTag || user.username || user.userId}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            ID: {user.userId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-rose-300 font-sans text-xs">
                      {user.reason || "Heat Threshold Exceeded"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {user.quarantinedAt
                        ? new Date(user.quarantinedAt).toLocaleString()
                        : "Recently"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] uppercase font-bold">
                        QUARANTINED
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleUnquarantineUser(user.userId)}
                        disabled={unquarantiningId === user.userId}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 transition-all text-xs font-sans font-semibold flex items-center gap-1.5 ml-auto disabled:opacity-50 cursor-pointer"
                      >
                        {unquarantiningId === user.userId ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        {unquarantiningId === user.userId
                          ? "Restoring..."
                          : "Restore User"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
