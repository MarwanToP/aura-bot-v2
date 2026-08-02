"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hash,
  Users,
  Radio,
  Bot,
  Target,
  Sparkles,
  RefreshCw,
  Save,
  Check,
  Shield,
  Zap,
  Volume2,
  Layers,
  Info,
  Activity,
  BarChart3,
} from "lucide-react";

export default function CountersModule({ guildId = "default" }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [settings, setSettings] = useState({
    statsEnabled: false,
    statsMemberChannelId: "",
    statsOnlineChannelId: "",
    statsBotChannelId: "",
    statsCustomChannelId: "",
    statsMemberFormat: "👥 Members: {count}",
    statsOnlineFormat: "🟢 Online: {count}",
    statsBotFormat: "🤖 Bots: {count}",
    statsCustomFormat: "🎯 Goal: {count}/{target}",
    customGoalTarget: 2000,
  });

  const [previewStats, setPreviewStats] = useState({
    memberCount: 1542,
    onlineCount: 384,
    botCount: 14,
    caseCount: 42,
    ticketCount: 18,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCounterData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/counters`);
      if (res.ok) {
        const data = await res.json();
        setSettings({
          statsEnabled: Boolean(data.statsEnabled),
          statsMemberChannelId: data.statsMemberChannelId || "",
          statsOnlineChannelId: data.statsOnlineChannelId || "",
          statsBotChannelId: data.statsBotChannelId || "",
          statsCustomChannelId: data.statsCustomChannelId || "",
          statsMemberFormat: data.statsMemberFormat || "👥 Members: {count}",
          statsOnlineFormat: data.statsOnlineFormat || "🟢 Online: {count}",
          statsBotFormat: data.statsBotFormat || "🤖 Bots: {count}",
          statsCustomFormat: data.statsCustomFormat || "🎯 Goal: {count}/{target}",
          customGoalTarget: Number(data.customGoalTarget) || 2000,
        });

        if (data.livePreviewStats) {
          setPreviewStats((prev) => ({ ...prev, ...data.livePreviewStats }));
        }
      } else {
        showToast("Failed to fetch counter channel settings", "error");
      }
    } catch (err) {
      console.error("[CountersModule] Error loading counter settings:", err);
      showToast("Failed to load counter module configuration", "error");
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchCounterData();
  }, [fetchCounterData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/counters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.settings) {
          setSettings((prev) => ({
            ...prev,
            statsEnabled: Boolean(result.settings.statsEnabled),
            statsMemberChannelId: result.settings.statsMemberChannelId || "",
            statsOnlineChannelId: result.settings.statsOnlineChannelId || "",
            statsBotChannelId: result.settings.statsBotChannelId || "",
            statsCustomChannelId: result.settings.statsCustomChannelId || "",
            statsMemberFormat: result.settings.statsMemberFormat || "👥 Members: {count}",
            statsOnlineFormat: result.settings.statsOnlineFormat || "🟢 Online: {count}",
            statsBotFormat: result.settings.statsBotFormat || "🤖 Bots: {count}",
            statsCustomFormat: result.settings.statsCustomFormat || "🎯 Goal: {count}/{target}",
            customGoalTarget: Number(result.settings.customGoalTarget) || 2000,
          }));
        }
        showToast("Server counter channels configuration saved successfully!", "success");
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || "Failed to save counter settings", "error");
      }
    } catch (err) {
      console.error("[CountersModule] Save error:", err);
      showToast("Network error while saving counter settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const insertTag = (fieldKey, tag) => {
    setSettings((prev) => ({
      ...prev,
      [fieldKey]: (prev[fieldKey] || "") + tag,
    }));
  };

  const formatPreview = (template, count, target) => {
    if (!template) return "";
    let str = template.replace(/\{count\}/g, Number(count).toLocaleString());
    if (target !== undefined) {
      str = str.replace(/\{target\}/g, Number(target).toLocaleString());
    }
    return str;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-[#09090b] text-white p-8 rounded-2xl border border-white/10">
        <RefreshCw className="w-8 h-8 text-[#5865F2] animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-400">Loading Server Counter Channels Module...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#09090b] text-white p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background Ambient Glow */}
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

      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] shadow-inner">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-wide text-white">Server Counter Channels</h1>
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                  settings.statsEnabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
                }`}
              >
                {settings.statsEnabled ? "STATS ACTIVE" : "DISABLED"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Synthesize live server statistics into dynamic Discord voice counter channels.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={fetchCounterData}
            className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
            title="Reload counter settings"
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Card 1: Master Switch for Dynamic Stats Counters */}
        <div className="lg:col-span-3 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Master Switch — Dynamic Stats Counters</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatically refresh configured channel names every 10 minutes with live server metrics.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                statsEnabled: !prev.statsEnabled,
              }))
            }
            className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${
              settings.statsEnabled ? "bg-[#5865F2]" : "bg-zinc-800"
            }`}
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`w-5 h-5 rounded-full bg-white shadow-md ${
                settings.statsEnabled ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Counter Channel Builders (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Members Counter */}
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Members Counter</h3>
                  <p className="text-xs text-zinc-400">Total member count channel</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                👥 MEMBERS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Voice Channel ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 102938475610293847"
                  value={settings.statsMemberChannelId}
                  onChange={(e) =>
                    setSettings({ ...settings, statsMemberChannelId: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5865F2] font-mono transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Format Template
                  </label>
                  <button
                    type="button"
                    onClick={() => insertTag("statsMemberFormat", "{count}")}
                    className="text-[10px] font-mono text-cyan-300 hover:underline cursor-pointer"
                  >
                    + {"{count}"}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="👥 Members: {count}"
                  value={settings.statsMemberFormat}
                  onChange={(e) =>
                    setSettings({ ...settings, statsMemberFormat: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5865F2] font-mono transition-all"
                />
              </div>
            </div>
          </div>

          {/* Online Counter */}
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Online Members Counter</h3>
                  <p className="text-xs text-zinc-400">Live online human members channel</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                🟢 ONLINE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Voice Channel ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 102938475610293848"
                  value={settings.statsOnlineChannelId}
                  onChange={(e) =>
                    setSettings({ ...settings, statsOnlineChannelId: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5865F2] font-mono transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Format Template
                  </label>
                  <button
                    type="button"
                    onClick={() => insertTag("statsOnlineFormat", "{count}")}
                    className="text-[10px] font-mono text-emerald-300 hover:underline cursor-pointer"
                  >
                    + {"{count}"}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="🟢 Online: {count}"
                  value={settings.statsOnlineFormat}
                  onChange={(e) =>
                    setSettings({ ...settings, statsOnlineFormat: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5865F2] font-mono transition-all"
                />
              </div>
            </div>
          </div>

          {/* Bots Counter */}
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Bots Counter</h3>
                  <p className="text-xs text-zinc-400">Total bot count channel</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300">
                🤖 BOTS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Voice Channel ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 102938475610293849"
                  value={settings.statsBotChannelId}
                  onChange={(e) =>
                    setSettings({ ...settings, statsBotChannelId: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5865F2] font-mono transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Format Template
                  </label>
                  <button
                    type="button"
                    onClick={() => insertTag("statsBotFormat", "{count}")}
                    className="text-[10px] font-mono text-purple-300 hover:underline cursor-pointer"
                  >
                    + {"{count}"}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="🤖 Bots: {count}"
                  value={settings.statsBotFormat}
                  onChange={(e) =>
                    setSettings({ ...settings, statsBotFormat: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5865F2] font-mono transition-all"
                />
              </div>
            </div>
          </div>

          {/* Custom Goal Counter */}
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Custom Goal Counter</h3>
                  <p className="text-xs text-zinc-400">Target goal tracking channel</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                🎯 GOAL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Voice Channel ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 102938475610293850"
                  value={settings.statsCustomChannelId}
                  onChange={(e) =>
                    setSettings({ ...settings, statsCustomChannelId: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5865F2] font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Goal Target Number
                </label>
                <input
                  type="number"
                  placeholder="2000"
                  value={settings.customGoalTarget}
                  onChange={(e) =>
                    setSettings({ ...settings, customGoalTarget: Number(e.target.value) || 0 })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5865F2] font-mono transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Format Template
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => insertTag("statsCustomFormat", "{count}")}
                      className="text-[10px] font-mono text-amber-300 hover:underline cursor-pointer"
                    >
                      + {"{count}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTag("statsCustomFormat", "{target}")}
                      className="text-[10px] font-mono text-amber-300 hover:underline cursor-pointer"
                    >
                      + {"{target}"}
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="🎯 Goal: {count}/{target}"
                  value={settings.statsCustomFormat}
                  onChange={(e) =>
                    setSettings({ ...settings, statsCustomFormat: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5865F2] font-mono transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Counter Preview Card (Right Column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6 sticky top-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Live Counter Preview</h3>
                  <p className="text-xs text-zinc-400">Discord sidebar preview</p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Live
              </span>
            </div>

            {/* Simulated Discord Channel List */}
            <div className="bg-black/60 rounded-xl border border-white/10 p-4 space-y-3 font-mono text-xs">
              <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-between pb-2 border-b border-white/5">
                <span>🔊 SERVER COUNTERS</span>
                <span className="text-[9px] text-zinc-600 font-normal">10m sync</span>
              </div>

              {/* Channel Item 1: Members */}
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.04] border border-white/5 hover:border-cyan-500/30 transition-all">
                <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs text-zinc-200 font-medium truncate">
                  {formatPreview(settings.statsMemberFormat, previewStats.memberCount)}
                </span>
              </div>

              {/* Channel Item 2: Online */}
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.04] border border-white/5 hover:border-emerald-500/30 transition-all">
                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-zinc-200 font-medium truncate">
                  {formatPreview(settings.statsOnlineFormat, previewStats.onlineCount)}
                </span>
              </div>

              {/* Channel Item 3: Bots */}
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.04] border border-white/5 hover:border-purple-500/30 transition-all">
                <Volume2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs text-zinc-200 font-medium truncate">
                  {formatPreview(settings.statsBotFormat, previewStats.botCount)}
                </span>
              </div>

              {/* Channel Item 4: Custom Goal */}
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.04] border border-white/5 hover:border-amber-500/30 transition-all">
                <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-zinc-200 font-medium truncate">
                  {formatPreview(
                    settings.statsCustomFormat,
                    previewStats.memberCount,
                    settings.customGoalTarget
                  )}
                </span>
              </div>
            </div>

            {/* Quick Information */}
            <div className="p-3.5 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-start gap-2.5 text-xs text-zinc-300">
              <Info className="w-4 h-4 text-[#5865F2] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-zinc-400">
                To activate counter channels on Discord, create locked voice channels in your server and paste their channel IDs above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
