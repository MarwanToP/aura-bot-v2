"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Volume2,
  Layers,
  Link2,
  Sparkles,
  RefreshCw,
  Users,
  Check,
  Save,
  Info,
  Radio,
  Gamepad2,
  User,
  Shield,
  Zap,
} from "lucide-react";

export default function VoiceModule({ guildId = "default" }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingActive, setRefreshingActive] = useState(false);
  const [toast, setToast] = useState(null);

  const [settings, setSettings] = useState({
    tempVoiceEnabled: false,
    tempVoiceCreatorId: "",
    tempVoiceCategoryId: "",
    tempVoiceNameTemplate: "{user}'s Room",
    voiceTextLinkedChannelId: "",
  });

  const [activeChannels, setActiveChannels] = useState([]);

  // Tag helper variables for live preview
  const previewUser = "Marwan";
  const previewGame = "Valorant";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchVoiceData = useCallback(async () => {
    setLoading(true);
    try {
      const [resSettings, resActive] = await Promise.all([
        fetch(`/api/guilds/${guildId}/voice`),
        fetch(`/api/guilds/${guildId}/voice/active`),
      ]);

      if (resSettings.ok) {
        const data = await resSettings.json();
        setSettings({
          tempVoiceEnabled: Boolean(data.tempVoiceEnabled),
          tempVoiceCreatorId: data.tempVoiceCreatorId || "",
          tempVoiceCategoryId: data.tempVoiceCategoryId || "",
          tempVoiceNameTemplate: data.tempVoiceNameTemplate || "{user}'s Room",
          voiceTextLinkedChannelId: data.voiceTextLinkedChannelId || "",
        });
      }

      if (resActive.ok) {
        const activeData = await resActive.json();
        setActiveChannels(Array.isArray(activeData) ? activeData : []);
      }
    } catch (err) {
      console.error("[VoiceModule] Error loading voice configuration:", err);
      showToast("Failed to load voice configuration", "error");
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  const refreshActiveChannels = async () => {
    setRefreshingActive(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/voice/active`);
      if (res.ok) {
        const data = await res.json();
        setActiveChannels(Array.isArray(data) ? data : []);
        showToast("Active channels refreshed", "success");
      }
    } catch (err) {
      console.error("[VoiceModule] Error refreshing active channels:", err);
    } finally {
      setRefreshingActive(false);
    }
  };

  useEffect(() => {
    fetchVoiceData();
  }, [fetchVoiceData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.settings) {
          setSettings({
            tempVoiceEnabled: Boolean(result.settings.tempVoiceEnabled),
            tempVoiceCreatorId: result.settings.tempVoiceCreatorId || "",
            tempVoiceCategoryId: result.settings.tempVoiceCategoryId || "",
            tempVoiceNameTemplate: result.settings.tempVoiceNameTemplate || "{user}'s Room",
            voiceTextLinkedChannelId: result.settings.voiceTextLinkedChannelId || "",
          });
        }
        showToast("Voice module settings saved successfully!", "success");
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || "Failed to save voice settings", "error");
      }
    } catch (err) {
      console.error("[VoiceModule] Save error:", err);
      showToast("Network error while saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const insertTag = (tag) => {
    setSettings((prev) => ({
      ...prev,
      tempVoiceNameTemplate: (prev.tempVoiceNameTemplate || "") + tag,
    }));
  };

  // Generate live name preview
  const getLivePreview = () => {
    const template = settings.tempVoiceNameTemplate || "{user}'s Room";
    let formatted = template.replace(/{user}/g, previewUser);

    if (template.includes("{game}")) {
      formatted = formatted.replace(/{game}/g, previewGame);
    } else {
      formatted = `🎮 ${previewGame} - ${formatted}`;
    }
    return formatted;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-[#09090b] text-white p-8 rounded-2xl border border-white/10">
        <RefreshCw className="w-8 h-8 text-[#5865F2] animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-400">Loading Voice Topologies Module...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#09090b] text-white p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#5865F2]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

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
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-wide text-white">Voice Topologies</h1>
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                  settings.tempVoiceEnabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
                }`}
              >
                {settings.tempVoiceEnabled ? "TEMP VOICE ACTIVE" : "DISABLED"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Synthesize ephemeral voice channels, dynamic activity naming, and voice-text linking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={fetchVoiceData}
            className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 transition-all flex items-center gap-2 text-xs font-medium"
            title="Reload configuration"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs transition-all shadow-lg shadow-[#5865F2]/25 flex items-center gap-2 disabled:opacity-50"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Card 1: Master Ephemeral Toggle & Channel Setup */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Radio className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Join to Create Master Toggle</h2>
                <p className="text-xs text-zinc-400">
                  Enable dynamic ephemeral voice room creation
                </p>
              </div>
            </div>

            {/* Snappy Toggle */}
            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  tempVoiceEnabled: !prev.tempVoiceEnabled,
                }))
              }
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${
                settings.tempVoiceEnabled ? "bg-[#5865F2]" : "bg-zinc-800"
              }`}
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-4 h-4 rounded-full bg-white shadow-md ${
                  settings.tempVoiceEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="border-t border-white/5 pt-5 space-y-4">
            {/* Creator Voice Channel ID */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                Creator Voice Channel ID
              </label>
              <input
                type="text"
                placeholder="e.g. 102938475610293847"
                value={settings.tempVoiceCreatorId}
                onChange={(e) =>
                  setSettings({ ...settings, tempVoiceCreatorId: e.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5865F2] font-mono transition-all"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Channel that users join to automatically spawn their temporary voice room.
              </p>
            </div>

            {/* Target Category ID */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Target Category ID
              </label>
              <input
                type="text"
                placeholder="e.g. 987654321098765432"
                value={settings.tempVoiceCategoryId}
                onChange={(e) =>
                  setSettings({ ...settings, tempVoiceCategoryId: e.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#5865F2] font-mono transition-all"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Discord category under which new temporary channels will be placed.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Voice-Text Linked Channel */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <Link2 className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Voice-Text Linked Channel</h2>
              <p className="text-xs text-zinc-400">
                Synchronize visibility & permissions for voice members
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-purple-400" />
                Linked Text Channel ID
              </label>
              <input
                type="text"
                placeholder="e.g. 112233445566778899"
                value={settings.voiceTextLinkedChannelId}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    voiceTextLinkedChannelId: e.target.value,
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono transition-all"
              />
            </div>

            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-start gap-3 text-xs text-purple-200/80">
              <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                When users enter any temporary voice channel, they are automatically granted view and message access to this linked text channel. Access is revoked upon exit.
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Dynamic Channel Name Template Builder */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Dynamic Channel Name Template</h2>
                <p className="text-xs text-zinc-400">
                  Build custom room names with live Rich Presence activity tags
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Channel Name Template
              </label>
              <input
                type="text"
                value={settings.tempVoiceNameTemplate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    tempVoiceNameTemplate: e.target.value,
                  })
                }
                placeholder="{user}'s Lounge"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#5865F2] font-mono transition-all"
              />
            </div>

            {/* Live Tag Helpers */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-zinc-400 font-medium mr-1">Insert Tag:</span>
              <button
                type="button"
                onClick={() => insertTag("{user}")}
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-mono text-cyan-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                {"{user}"}
                <span className="text-[10px] text-zinc-400 font-sans">(User Name)</span>
              </button>

              <button
                type="button"
                onClick={() => insertTag("{game}")}
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-mono text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                {"{game}"}
                <span className="text-[10px] text-zinc-400 font-sans">(Game Activity)</span>
              </button>
            </div>

            {/* Real-time Live Preview */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase font-mono tracking-wider">
                <span>Live Channel Preview</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Rich Presence Active
                </span>
              </div>
              <div className="flex items-center gap-3 bg-white/[0.04] p-3 rounded-lg border border-white/5">
                <Volume2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-sm font-semibold text-white font-mono">
                  {getLivePreview()}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Sample preview based on user &quot;{previewUser}&quot; currently playing &quot;{previewGame}&quot;.
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Active Temporary Voice Channels Monitor Table */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Active Temporary Voice Channels</h2>
                <p className="text-xs text-zinc-400">
                  Real-time monitor of active temp channels in this server
                </p>
              </div>
            </div>

            <button
              onClick={refreshActiveChannels}
              disabled={refreshingActive}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-xs text-zinc-300 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshingActive ? "animate-spin" : ""}`}
              />
              Refresh Table
            </button>
          </div>

          <div className="overflow-x-auto">
            {activeChannels.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-black/20">
                <Volume2 className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-zinc-400 font-medium">
                  No active temporary voice channels right now.
                </p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Active rooms will appear here when users join the creator channel.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-white/[0.04] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Channel ID</th>
                    <th className="px-4 py-3">Owner ID</th>
                    <th className="px-4 py-3">Text Channel</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {activeChannels.map((chan) => (
                    <tr key={chan.id || chan.channelId} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white font-medium">
                        {chan.channelId || chan.id}
                      </td>
                      <td className="px-4 py-3 text-cyan-300">{chan.ownerId || "N/A"}</td>
                      <td className="px-4 py-3 text-purple-300">
                        {chan.textChannelId || "None"}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {chan.createdAt
                          ? new Date(chan.createdAt).toLocaleTimeString()
                          : "Recently"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          LIVE
                        </span>
                      </td>
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
