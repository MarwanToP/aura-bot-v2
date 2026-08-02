"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Coins,
  Sparkles,
  ShoppingBag,
  Award,
  TrendingDown,
  Plus,
  Trash2,
  Edit2,
  Save,
  RefreshCw,
  Check,
  Shield,
  Zap,
  Clock,
  Percent,
  Tag,
  Flame,
  X,
  Crown,
} from "lucide-react";

export default function GamificationModule({ guildId = "default" }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Economy & Leveling Settings
  const [settings, setSettings] = useState({
    levelingEnabled: true,
    xpMultiplier: 1.0,
    xpDecayEnabled: true,
    xpDecayGraceDays: 7,
    xpDecayHalfLifeDays: 14,
    levelUpChannelId: "",
    levelUpMessage: "",
  });

  // Shop Items
  const [shopItems, setShopItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: 100,
    stock: -1,
    roleId: "",
    enabled: true,
  });

  // Level Rewards & Leaderboard
  const [levelRewards, setLevelRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [rewardForm, setRewardForm] = useState({
    level: 5,
    roleId: "",
    removeOnNext: false,
  });

  // Toast Helper
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resEconomy, resShop, resLeveling] = await Promise.all([
        fetch(`/api/guilds/${guildId}/economy`),
        fetch(`/api/guilds/${guildId}/economy/shop`),
        fetch(`/api/guilds/${guildId}/leveling`),
      ]);

      if (resEconomy.ok) {
        const data = await resEconomy.json();
        setSettings((prev) => ({
          ...prev,
          levelingEnabled: Boolean(data.levelingEnabled ?? true),
          xpMultiplier: Number(data.xpMultiplier || 1.0),
          xpDecayEnabled: Boolean(data.xpDecayEnabled ?? true),
          xpDecayGraceDays: Number(data.xpDecayGraceDays ?? 7),
          xpDecayHalfLifeDays: Number(data.xpDecayHalfLifeDays ?? 14),
          levelUpChannelId: data.levelUpChannelId || "",
          levelUpMessage: data.levelUpMessage || "",
        }));
      }

      if (resShop.ok) {
        const shopData = await resShop.json();
        setShopItems(Array.isArray(shopData) ? shopData : []);
      }

      if (resLeveling.ok) {
        const levData = await resLeveling.json();
        setLevelRewards(Array.isArray(levData.rewards) ? levData.rewards : []);
        setLeaderboard(Array.isArray(levData.leaderboard) ? levData.leaderboard : []);
      }
    } catch (err) {
      console.error("[GamificationModule] Error loading data:", err);
      showToast("Failed to load gamification configuration", "error");
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save Economy & Leveling Settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/economy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        showToast("Gamification & Economy settings saved!", "success");
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Failed to save settings", "error");
      }
    } catch (err) {
      console.error("[GamificationModule] Save error:", err);
      showToast("Network error while saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Shop Item Handlers
  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const payload = editingItem
        ? { id: editingItem.id, ...itemForm }
        : itemForm;

      const res = await fetch(`/api/guilds/${guildId}/economy/shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(
          editingItem ? "Shop item updated!" : "Shop item added!",
          "success"
        );
        setIsAddingItem(false);
        setEditingItem(null);
        setItemForm({
          name: "",
          description: "",
          price: 100,
          stock: -1,
          roleId: "",
          enabled: true,
        });
        const resShop = await fetch(`/api/guilds/${guildId}/economy/shop`);
        if (resShop.ok) {
          setShopItems(await resShop.json());
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Failed to save shop item", "error");
      }
    } catch (err) {
      showToast("Network error saving shop item", "error");
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/economy/shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, action: "delete" }),
      });

      if (res.ok) {
        showToast("Shop item deleted", "success");
        setShopItems((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        showToast("Failed to delete shop item", "error");
      }
    } catch (err) {
      showToast("Network error deleting item", "error");
    }
  };

  const startEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price || 100,
      stock: item.stock !== undefined ? item.stock : -1,
      roleId: item.roleId || "",
      enabled: item.enabled ?? true,
    });
    setIsAddingItem(true);
  };

  // Level Rewards Handlers
  const handleAddReward = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/guilds/${guildId}/leveling/rewards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rewardForm),
      });

      if (res.ok) {
        showToast("Level reward saved!", "success");
        setRewardForm({ level: 5, roleId: "", removeOnNext: false });
        const resLev = await fetch(`/api/guilds/${guildId}/leveling`);
        if (resLev.ok) {
          const data = await resLev.json();
          setLevelRewards(Array.isArray(data.rewards) ? data.rewards : []);
        }
      } else {
        showToast("Failed to save level reward", "error");
      }
    } catch (err) {
      showToast("Network error saving level reward", "error");
    }
  };

  const handleDeleteReward = async (rewardId) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/leveling/rewards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rewardId, action: "delete" }),
      });

      if (res.ok) {
        showToast("Level reward removed", "success");
        setLevelRewards((prev) => prev.filter((r) => r.id !== rewardId));
      } else {
        showToast("Failed to delete level reward", "error");
      }
    } catch (err) {
      showToast("Network error deleting level reward", "error");
    }
  };

  // Calculate live decay preview rate
  const getDecayPreviewRate = () => {
    const halfLife = Math.max(0.1, settings.xpDecayHalfLifeDays);
    const lambda = Math.LN2 / halfLife;
    const sampleInactiveDays = 14;
    const decayFactor = Math.exp(-lambda * sampleInactiveDays);
    const retainedPercent = Math.round(decayFactor * 100);
    return {
      retainedPercent,
      lostPercent: 100 - retainedPercent,
    };
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-[#09090b] text-white p-8 rounded-2xl border border-white/10">
        <RefreshCw className="w-8 h-8 text-[#5865F2] animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-400">
          Loading Gamification & Economy Module...
        </p>
      </div>
    );
  }

  const decayPreview = getDecayPreviewRate();

  return (
    <div className="bg-[#09090b] text-white p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#5865F2]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

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
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold tracking-wide text-white">
                Gamification & Classic Leveling System
              </h1>
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                  settings.levelingEnabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
                }`}
              >
                {settings.levelingEnabled ? "LEVELING ACTIVE" : "DISABLED"}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                100% UNLOCKED • CLASSIC FREE LEVELING
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Classic un-paywalled XP leveling, custom rank card visual builder, level role rewards, & Time-Decay retention.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
            title="Reload module configuration"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Config"}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Card 1: Time-Decay Leveling Configuration */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-white">
                  Time-Decay Leveling Engine
                </h2>
                <p className="text-xs text-zinc-400">
                  Configure XP generation & inactivity decay rates
                </p>
              </div>
            </div>

            {/* Master Leveling Toggle */}
            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  levelingEnabled: !prev.levelingEnabled,
                }))
              }
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${
                settings.levelingEnabled ? "bg-amber-500" : "bg-zinc-800"
              }`}
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-4 h-4 rounded-full bg-black shadow-md ${
                  settings.levelingEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="border-t border-white/5 pt-5 space-y-5">
            {/* Time-Decay Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-xs font-semibold text-white">
                    XP Time-Decay System
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Gradually decay XP for inactive members after grace period
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    xpDecayEnabled: !prev.xpDecayEnabled,
                  }))
                }
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center cursor-pointer ${
                  settings.xpDecayEnabled ? "bg-cyan-500" : "bg-zinc-800"
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`w-4 h-4 rounded-full bg-black shadow-md ${
                    settings.xpDecayEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Grace Period Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Inactivity Grace Period
                </label>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {settings.xpDecayGraceDays} Days
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={settings.xpDecayGraceDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    xpDecayGraceDays: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-emerald-400 bg-zinc-800 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Days an inactive member can stay without losing any XP.
              </p>
            </div>

            {/* Half-Life / XP Decay Rate Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  XP Decay Rate (Half-Life)
                </label>
                <span className="text-xs font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {settings.xpDecayHalfLifeDays} Days
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                value={settings.xpDecayHalfLifeDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    xpDecayHalfLifeDays: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-rose-400 bg-zinc-800 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Time required for active XP to reduce by 50% during inactivity.
              </p>
            </div>

            {/* Live Decay Rate Formula Box */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase font-mono tracking-wider">
                <span>Decay Formula Live Simulation</span>
                <span className="text-cyan-400 flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Formula Engine
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/[0.04] p-3 rounded-lg border border-white/5 font-mono text-xs">
                <span className="text-zinc-300">
                  Inactivity (Grace + 14d):
                </span>
                <span className="text-rose-400 font-bold">
                  -{decayPreview.lostPercent}% XP lost ({decayPreview.retainedPercent}% retained)
                </span>
              </div>
            </div>

            {/* XP Multiplier */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  XP Multiplier
                </label>
                <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {settings.xpMultiplier}x
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={settings.xpMultiplier}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    xpMultiplier: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-amber-400 bg-zinc-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Level Rewards Setup */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Level Roles Rewards</h2>
              <p className="text-xs text-zinc-400">
                Automatically grant roles when members reach level milestones
              </p>
            </div>
          </div>

          {/* Add Reward Form */}
          <form
            onSubmit={handleAddReward}
            className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Target Level
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={rewardForm.level}
                  onChange={(e) =>
                    setRewardForm({
                      ...rewardForm,
                      level: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Discord Role ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1029384756"
                  value={rewardForm.roleId}
                  onChange={(e) =>
                    setRewardForm({ ...rewardForm, roleId: e.target.value })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rewardForm.removeOnNext}
                  onChange={(e) =>
                    setRewardForm({
                      ...rewardForm,
                      removeOnNext: e.target.checked,
                    })
                  }
                  className="rounded bg-black border-white/10 accent-purple-500"
                />
                Remove lower roles on higher rank promotion
              </label>

              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Reward
              </button>
            </div>
          </form>

          {/* Configured Rewards Table */}
          <div className="overflow-x-auto">
            {levelRewards.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-black/20">
                <Award className="w-6 h-6 text-zinc-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-zinc-400">
                  No level role rewards configured yet.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-white/[0.04] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/10">
                  <tr>
                    <th className="px-3 py-2">Level</th>
                    <th className="px-3 py-2">Role ID</th>
                    <th className="px-3 py-2">Exclusive</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {levelRewards.map((r) => (
                    <tr key={r.id || r.level} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5 text-amber-400 font-bold">
                        Level {r.level}
                      </td>
                      <td className="px-3 py-2.5 text-purple-300">
                        {r.roleId}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400">
                        {r.removeOnNext ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteReward(r.id)}
                          className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="Delete reward"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Card 3: Virtual Server Shop Item Editor */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-white">
                  Virtual Server Shop Item Editor
                </h2>
                <p className="text-xs text-zinc-400">
                  Manage virtual items, prices, role rewards, & stock inventory
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingItem(null);
                setItemForm({
                  name: "",
                  description: "",
                  price: 100,
                  stock: -1,
                  roleId: "",
                  enabled: true,
                });
                setIsAddingItem(!isAddingItem);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              {isAddingItem ? (
                <X className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isAddingItem ? "Cancel" : "Add Shop Item"}
            </button>
          </div>

          {/* Add / Edit Item Form Modal/Collapsible */}
          <AnimatePresence>
            {isAddingItem && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSaveItem}
                className="p-5 rounded-xl bg-black/60 border border-emerald-500/30 space-y-4 overflow-hidden"
              >
                <h3 className="text-xs font-bold text-emerald-400 uppercase font-mono tracking-wider">
                  {editingItem ? "Edit Shop Item" : "Create New Shop Item"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Item Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VIP Role Pass"
                      value={itemForm.name}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, name: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Price (Coins)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="1000"
                      value={itemForm.price}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          price: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Inventory Stock (-1 = Unlimited)
                    </label>
                    <input
                      type="number"
                      placeholder="-1"
                      value={itemForm.stock}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          stock: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Role Reward ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1092837465"
                      value={itemForm.roleId}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, roleId: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Item Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Grants access to exclusive VIP lounge channels"
                      value={itemForm.description}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.enabled}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, enabled: e.target.checked })
                      }
                      className="rounded bg-black border-white/10 accent-emerald-500"
                    />
                    Item Enabled for Sale
                  </label>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs transition-all cursor-pointer"
                  >
                    {editingItem ? "Update Item" : "Create Item"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Shop Items Grid / List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopItems.length === 0 ? (
              <div className="col-span-full text-center py-10 border border-dashed border-white/10 rounded-xl bg-black/20">
                <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-zinc-400 font-medium">
                  The server shop is empty. Click &quot;Add Shop Item&quot; above to create virtual items.
                </p>
              </div>
            ) : (
              shopItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-white/20 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-400" />
                        {item.name}
                      </h3>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                          item.enabled
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                        }`}
                      >
                        {item.enabled ? "ACTIVE" : "DISABLED"}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {item.description || "No description provided."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <div className="text-amber-400 font-bold flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {item.price.toLocaleString()} coins
                    </div>

                    <div className="text-zinc-400 text-[11px]">
                      Stock: {item.stock === -1 ? "∞" : item.stock}
                    </div>
                  </div>

                  {item.roleId && (
                    <div className="text-[11px] text-purple-300 font-mono flex items-center gap-1 bg-purple-950/30 px-2 py-1 rounded border border-purple-500/20">
                      <Crown className="w-3 h-3 text-purple-400" />
                      Role: {item.roleId}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => startEditItem(item)}
                      className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 transition-colors cursor-pointer"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 4: Leaderboard Preview Table */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-white">
                  Leaderboard Real-Time Preview
                </h2>
                <p className="text-xs text-zinc-400">
                  Top ranking server members with time-decayed active XP
                </p>
              </div>
            </div>

            <button
              onClick={fetchData}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-xs text-zinc-300 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Ranks
            </button>
          </div>

          <div className="overflow-x-auto">
            {leaderboard.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-black/20">
                <Crown className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-zinc-400 font-medium">
                  No member profiles registered on the leaderboard yet.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-white/[0.04] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">Active XP</th>
                    <th className="px-4 py-3">Messages</th>
                    <th className="px-4 py-3 text-right">Voice Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {leaderboard.map((user, idx) => {
                    const rankMedals = ["🥇", "🥈", "🥉"];
                    return (
                      <tr
                        key={user.userId}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 text-white font-bold">
                          {rankMedals[idx] || `#${idx + 1}`}
                        </td>
                        <td className="px-4 py-3 text-cyan-300 font-medium">
                          {user.userId}
                        </td>
                        <td className="px-4 py-3 text-amber-400 font-bold">
                          Lvl {user.level}
                        </td>
                        <td className="px-4 py-3 text-emerald-300">
                          {Number(user.xp || 0).toLocaleString()} XP
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {Number(user.totalMessages || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-400">
                          {Number(user.voiceMinutes || 0).toLocaleString()}m
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
