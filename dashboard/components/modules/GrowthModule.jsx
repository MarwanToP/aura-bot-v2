"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  UserPlus,
  Users,
  UserMinus,
  Shield,
  ShieldAlert,
  Check,
  Save,
  RefreshCw,
  Info,
  Award,
  Trash2,
  Plus,
  Clock,
  Sparkles,
  Layers,
  PieChart,
} from "lucide-react";

export default function GrowthModule({ guildId = "default" }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingLeaderboard, setRefreshingLeaderboard] = useState(false);
  const [toast, setToast] = useState(null);

  const [settings, setSettings] = useState({
    inviteTrackEnabled: false,
    fakeShieldEnabled: true,
    minAccountAgeDays: 7,
    rankRewards: [],
  });

  const [metrics, setMetrics] = useState({
    totalJoins: 0,
    fakeJoins: 0,
    leftUsers: 0,
    retentionRate: 100,
  });

  const [leaderboard, setLeaderboard] = useState([]);

  // Form state for adding new Rank Reward Role
  const [newReward, setNewReward] = useState({
    invites: "",
    roleId: "",
    roleName: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchGrowthData = useCallback(async () => {
    setLoading(true);
    try {
      const [resInvites, resLeaderboard] = await Promise.all([
        fetch(`/api/guilds/${guildId}/invites`),
        fetch(`/api/guilds/${guildId}/invites/leaderboard`),
      ]);

      if (resInvites.ok) {
        const data = await resInvites.json();
        setSettings({
          inviteTrackEnabled: Boolean(data.inviteTrackEnabled),
          fakeShieldEnabled: data.fakeShieldEnabled ?? true,
          minAccountAgeDays: data.minAccountAgeDays ?? 7,
          rankRewards: Array.isArray(data.rankRewards) ? data.rankRewards : [],
        });
        if (data.metrics) {
          setMetrics({
            totalJoins: data.metrics.totalJoins || 0,
            fakeJoins: data.metrics.fakeJoins || 0,
            leftUsers: data.metrics.leftUsers || 0,
            retentionRate: typeof data.metrics.retentionRate === "number" ? data.metrics.retentionRate : 100,
          });
        }
      }

      if (resLeaderboard.ok) {
        const lbData = await resLeaderboard.json();
        setLeaderboard(Array.isArray(lbData) ? lbData : []);
      }
    } catch (err) {
      console.error("[GrowthModule] Error loading invite tracker data:", err);
      showToast("Failed to load invite analytics data", "error");
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  const refreshLeaderboard = async () => {
    setRefreshingLeaderboard(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/invites/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(Array.isArray(data) ? data : []);
        showToast("Inviter leaderboard refreshed", "success");
      }
    } catch (err) {
      console.error("[GrowthModule] Error refreshing inviter leaderboard:", err);
    } finally {
      setRefreshingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchGrowthData();
  }, [fetchGrowthData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.settings) {
          setSettings({
            inviteTrackEnabled: Boolean(result.settings.inviteTrackEnabled),
            fakeShieldEnabled: Boolean(result.settings.fakeShieldEnabled),
            minAccountAgeDays: result.settings.minAccountAgeDays ?? 7,
            rankRewards: Array.isArray(result.settings.rankRewards) ? result.settings.rankRewards : [],
          });
        }
        showToast("Growth & Invite module settings saved successfully!", "success");
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || "Failed to save invite settings", "error");
      }
    } catch (err) {
      console.error("[GrowthModule] Save error:", err);
      showToast("Network error while saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddReward = (e) => {
    e.preventDefault();
    const invitesNum = parseInt(newReward.invites, 10);
    const trimmedRoleId = newReward.roleId.trim();

    if (!invitesNum || invitesNum < 1) {
      showToast("Required invite threshold must be at least 1", "error");
      return;
    }
    if (!trimmedRoleId) {
      showToast("Please enter a valid Role ID", "error");
      return;
    }

    const rewardItem = {
      invites: invitesNum,
      roleId: trimmedRoleId,
      roleName: newReward.roleName.trim() || undefined,
    };

    setSettings((prev) => ({
      ...prev,
      rankRewards: [...prev.rankRewards, rewardItem].sort((a, b) => a.invites - b.invites),
    }));

    setNewReward({ invites: "", roleId: "", roleName: "" });
    showToast("Rank reward role added", "success");
  };

  const handleRemoveReward = (index) => {
    setSettings((prev) => ({
      ...prev,
      rankRewards: prev.rankRewards.filter((_, i) => i !== index),
    }));
    showToast("Rank reward role removed", "success");
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-[#09090b] text-white p-8 rounded-2xl border border-white/10">
        <RefreshCw className="w-8 h-8 text-[#5865F2] animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-400">Loading Growth & Invite Analytics...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#09090b] text-white p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#5865F2]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

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
              <Shield className="w-4 h-4 text-rose-400" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-wide text-white">Growth & Invite Analytics</h1>
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                  settings.inviteTrackEnabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
                }`}
              >
                {settings.inviteTrackEnabled ? "INVITE TRACKER ACTIVE" : "DISABLED"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Synthesizing Invite Tracker: Attribution metrics, Fake Invite Shield, and rank reward role automation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={fetchGrowthData}
            className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
            title="Reload configuration"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs transition-all shadow-lg shadow-[#5865F2]/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Invite Attribution Metrics Summary (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-10">
        {/* Total Joins */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">Total Joins</p>
            <p className="text-2xl font-black text-white mt-1">{metrics.totalJoins}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Fake Joins */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">Fake Joins</p>
            <p className="text-2xl font-black text-rose-400 mt-1">{metrics.fakeJoins}</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Left Users */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">Left Users</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{metrics.leftUsers}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <UserMinus className="w-5 h-5" />
          </div>
        </div>

        {/* Retention Rate */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">Retention Rate</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.retentionRate}%</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Card 1: Invite Tracker & Fake Shield Configuration */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Invite Tracker Master Toggle</h2>
                <p className="text-xs text-zinc-400">
                  Synthesize real-time invite code attribution and join tracking
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  inviteTrackEnabled: !prev.inviteTrackEnabled,
                }))
              }
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${
                settings.inviteTrackEnabled ? "bg-[#5865F2]" : "bg-zinc-800"
              }`}
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-4 h-4 rounded-full bg-white shadow-md ${
                  settings.inviteTrackEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="border-t border-white/5 pt-5 space-y-5">
            {/* Fake Invite Shield Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <h3 className="text-xs font-semibold text-white">Fake Invite Shield</h3>
                  <p className="text-[11px] text-zinc-400">
                    Flag joins from newly created accounts as fake invites
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    fakeShieldEnabled: !prev.fakeShieldEnabled,
                  }))
                }
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center cursor-pointer ${
                  settings.fakeShieldEnabled ? "bg-cyan-500" : "bg-zinc-800"
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`w-4 h-4 rounded-full bg-white shadow-md ${
                    settings.fakeShieldEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Account Age Filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Account Age Filter (Days)
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={settings.minAccountAgeDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minAccountAgeDays: Math.max(0, parseInt(e.target.value, 10) || 0),
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#5865F2] font-mono transition-all"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Accounts created less than this many days ago will be flagged as fake invites.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-cyan-200/80">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Invite Tracker caches guild invite usages in Redis (7 days TTL) to accurately attribute each new member to their inviter.
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Rank Reward Role Configuration */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Rank Reward Role Configuration</h2>
              <p className="text-xs text-zinc-400">
                Automatically assign Discord roles when inviters reach milestone thresholds
              </p>
            </div>
          </div>

          {/* Form to add new reward */}
          <form onSubmit={handleAddReward} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Required Invites
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={newReward.invites}
                  onChange={(e) => setNewReward({ ...newReward, invites: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Role ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1092837465..."
                  value={newReward.roleId}
                  onChange={(e) => setNewReward({ ...newReward, roleId: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Role Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bronze Inviter"
                  value={newReward.roleName}
                  onChange={(e) => setNewReward({ ...newReward, roleName: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Rank Reward Role
            </button>
          </form>

          {/* List of active rank rewards */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
              Configured Rank Rewards ({settings.rankRewards.length})
            </h3>

            {settings.rankRewards.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-white/10 rounded-xl bg-black/20 text-xs text-zinc-500">
                No rank reward roles configured yet. Add one above.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {settings.rankRewards.map((reward, index) => (
                  <div
                    key={`${reward.roleId}-${index}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[11px] font-bold">
                        {reward.invites} {reward.invites === 1 ? "Invite" : "Invites"}
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {reward.roleName || `Role ID: ${reward.roleId}`}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">{reward.roleId}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveReward(index)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Remove reward"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Inviter Leaderboard Table */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Inviter Leaderboard Table</h2>
                <p className="text-xs text-zinc-400">
                  Real-time ranking of top server inviters with attribution metrics breakdown
                </p>
              </div>
            </div>

            <button
              onClick={refreshLeaderboard}
              disabled={refreshingLeaderboard}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-xs text-zinc-300 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingLeaderboard ? "animate-spin" : ""}`} />
              Refresh Leaderboard
            </button>
          </div>

          <div className="overflow-x-auto">
            {leaderboard.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-black/20">
                <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-zinc-400 font-medium">
                  No invite records found for this server yet.
                </p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Inviter stats will accumulate as new members join using invite links.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-white/[0.04] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Inviter ID</th>
                    <th className="px-4 py-3 text-center">Real Invites</th>
                    <th className="px-4 py-3 text-center">Fake</th>
                    <th className="px-4 py-3 text-center">Left</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {leaderboard.map((item, idx) => (
                    <tr key={item.inviterId} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        {idx === 0 ? (
                          <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-bold text-[10px]">
                            🥇 #1
                          </span>
                        ) : idx === 1 ? (
                          <span className="px-2 py-0.5 rounded bg-slate-400/20 text-slate-200 border border-slate-400/30 font-bold text-[10px]">
                            🥈 #2
                          </span>
                        ) : idx === 2 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-700/20 text-amber-400 border border-amber-700/30 font-bold text-[10px]">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="text-zinc-500">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{item.inviterId}</td>
                      <td className="px-4 py-3 text-center text-emerald-400 font-bold">
                        {item.realInvites}
                      </td>
                      <td className="px-4 py-3 text-center text-rose-400">{item.fakeInvites}</td>
                      <td className="px-4 py-3 text-center text-amber-400">{item.leftInvites}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{item.totalInvites}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
