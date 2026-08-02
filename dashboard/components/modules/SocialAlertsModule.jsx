"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Tv,
  Youtube,
  Radio,
  Rss,
  Twitter,
  Plus,
  Trash2,
  Send,
  Check,
  RefreshCw,
  Save,
  Shield,
  Info,
  Search,
  Sparkles,
  Filter,
  AtSign,
  Tag,
  Zap,
  Play,
  Share2,
  CheckCircle2,
  AlertCircle,
  Sliders,
} from "lucide-react";

const PLATFORMS = [
  { id: "youtube", name: "YouTube", emoji: "🔴", color: "from-red-500/20 to-red-600/10", borderColor: "border-red-500/30", badgeColor: "bg-red-500/10 text-red-400 border-red-500/30", icon: Youtube, placeholder: "e.g. UCX6OQ3DkcsbYNE6H8uQQuVA or @PewDiePie" },
  { id: "twitch", name: "Twitch", emoji: "🟣", color: "from-purple-500/20 to-purple-600/10", borderColor: "border-purple-500/30", badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: Tv, placeholder: "e.g. ninja or shroud" },
  { id: "kick", name: "Kick", emoji: "🎮", color: "from-emerald-500/20 to-emerald-600/10", borderColor: "border-emerald-500/30", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: Play, placeholder: "e.g. xqc or trainwreckstv" },
  { id: "twitter", name: "Twitter / X", emoji: "🐦", color: "from-sky-500/20 to-sky-600/10", borderColor: "border-sky-500/30", badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30", icon: Twitter, placeholder: "e.g. @ElonMusk" },
  { id: "rss", name: "RSS Feed", emoji: "📡", color: "from-amber-500/20 to-amber-600/10", borderColor: "border-amber-500/30", badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: Rss, placeholder: "e.g. https://news.ycombinator.com/rss" },
  { id: "reddit", name: "Reddit", emoji: "🟠", color: "from-orange-500/20 to-orange-600/10", borderColor: "border-orange-500/30", badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/30", icon: Radio, placeholder: "e.g. gaming or AskReddit" },
  { id: "instagram", name: "Instagram", emoji: "📷", color: "from-pink-500/20 to-pink-600/10", borderColor: "border-pink-500/30", badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/30", icon: Share2, placeholder: "e.g. instagram_username" },
  { id: "tiktok", name: "TikTok", emoji: "🎵", color: "from-cyan-500/20 to-cyan-600/10", borderColor: "border-cyan-500/30", badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", icon: Radio, placeholder: "e.g. @tiktok_creator" },
  { id: "bluesky", name: "Bluesky", emoji: "🦋", color: "from-blue-500/20 to-blue-600/10", borderColor: "border-blue-500/30", badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: Share2, placeholder: "e.g. handle.bsky.social" },
  { id: "podcast", name: "Podcast Feed", emoji: "🎙️", color: "from-violet-500/20 to-violet-600/10", borderColor: "border-violet-500/30", badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/30", icon: Radio, placeholder: "e.g. https://feeds.podcast.com/rss" },
];

export default function SocialAlertsModule({ guildId = "default" }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const [config, setConfig] = useState({ enabled: true });

  // Filter & Search
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Setup Form State
  const [form, setForm] = useState({
    platform: "youtube",
    identifier: "",
    channelId: "",
    pingRoleId: "",
    message: "{name} just posted a new update! Check it out: {url}",
    enabled: true,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSocialAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/social-alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        if (data.config) setConfig(data.config);
      } else {
        showToast("Failed to fetch social alerts feed data", "error");
      }
    } catch (err) {
      console.error("[SocialAlertsModule] Fetch error:", err);
      showToast("Error connecting to server for social alerts", "error");
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchSocialAlerts();
  }, [fetchSocialAlerts]);

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    if (!form.identifier.trim()) {
      showToast("Please provide a channel handle or feed URL", "error");
      return;
    }
    if (!form.channelId.trim()) {
      showToast("Please specify a target Discord channel ID", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/social-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.alerts) setAlerts(data.alerts);
        else if (data.alert) setAlerts((prev) => [...prev, data.alert]);
        showToast(`Successfully subscribed to ${form.platform.toUpperCase()} feed for ${form.identifier}!`, "success");
        setForm((prev) => ({
          ...prev,
          identifier: "",
        }));
      } else {
        showToast(data.error || "Failed to create subscription", "error");
      }
    } catch (err) {
      console.error("[SocialAlertsModule] Create error:", err);
      showToast("Network error while adding feed subscription", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestAlert = async (id) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/guilds/${guildId}/social-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Test alert sent to Discord channel!", "success");
      } else {
        showToast(data.error || "Failed to trigger test alert", "error");
      }
    } catch (err) {
      console.error("[SocialAlertsModule] Test error:", err);
      showToast("Error triggering test social alert", "error");
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteAlert = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/guilds/${guildId}/social-alerts/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlerts((prev) => prev.filter((a) => Number(a.id) !== Number(id)));
        showToast("Social alert feed subscription deleted successfully!", "success");
      } else {
        showToast(data.error || "Failed to delete social alert", "error");
      }
    } catch (err) {
      console.error("[SocialAlertsModule] Delete error:", err);
      showToast("Error deleting social alert subscription", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const insertTemplateTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      message: (prev.message || "") + tag,
    }));
  };

  const activePlatformConfig = PLATFORMS.find((p) => p.id === form.platform) || PLATFORMS[0];

  const filteredAlerts = alerts.filter((alert) => {
    const matchesPlatform = selectedPlatformFilter === "all" || alert.platform === selectedPlatformFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      alert.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.channelId.includes(searchQuery) ||
      (alert.message && alert.message.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPlatform && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-[#09090b] text-white p-8 rounded-2xl border border-white/10">
        <RefreshCw className="w-8 h-8 text-[#5865F2] animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-400">Loading Social Alerts & Feed Subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#09090b] text-white p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
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
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 shadow-inner">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-wide text-white">Social Alerts & Notifications</h1>
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border bg-purple-500/10 border-purple-500/30 text-purple-300">
                ⭐ PREMIUM MODULE
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Synthesize live notifications from Twitch, YouTube, Kick, Twitter/X, RSS feeds, Reddit, and Podcasts directly into your server.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={fetchSocialAlerts}
            className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
            title="Refresh Social Alert feeds"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 relative z-10">
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-zinc-400 uppercase font-medium">Total Feeds</p>
            <p className="text-lg font-bold text-white">{alerts.length} / 50</p>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-zinc-400 uppercase font-medium">Active Monitors</p>
            <p className="text-lg font-bold text-white">{alerts.filter((a) => a.enabled !== false).length}</p>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-zinc-400 uppercase font-medium">Poll Interval</p>
            <p className="text-lg font-bold text-white">5 Minutes</p>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-zinc-400 uppercase font-medium">Supported Platforms</p>
            <p className="text-lg font-bold text-white">{PLATFORMS.length}</p>
          </div>
        </div>
      </div>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Column: Platform Selector & Subscription Setup Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Plus className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="text-base font-bold text-white">Add Feed Subscription</h2>
                <p className="text-xs text-zinc-400">Configure new social media monitoring rules</p>
              </div>
            </div>

            {/* Platform Manager Icons Grid */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">Select Platform</label>
              <div className="grid grid-cols-5 gap-2">
                {PLATFORMS.map((p) => {
                  const isSelected = form.platform === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, platform: p.id }))}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? `bg-gradient-to-b ${p.color} ${p.borderColor} text-white ring-2 ring-purple-500/40 shadow-lg`
                          : "bg-black/30 border-white/5 text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                      }`}
                      title={p.name}
                    >
                      <span className="text-sm">{p.emoji}</span>
                      <span className="text-[10px] font-medium truncate w-full text-center">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleAddSubscription} className="space-y-4 pt-2">
              {/* Identifier / Handle */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Channel Handle / Account / URL</span>
                  <span className="text-[10px] text-purple-400 font-mono">{activePlatformConfig.name}</span>
                </label>
                <input
                  type="text"
                  placeholder={activePlatformConfig.placeholder}
                  value={form.identifier}
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono transition-all"
                />
              </div>

              {/* Target Channel ID */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Target Discord Channel ID</label>
                <input
                  type="text"
                  placeholder="e.g. 102938475610293847"
                  value={form.channelId}
                  onChange={(e) => setForm({ ...form, channelId: e.target.value })}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono transition-all"
                />
              </div>

              {/* Ping Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Ping Role ID (Optional)</label>
                <div className="relative">
                  <AtSign className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. 987654321098765432 (Leave blank for no ping)"
                    value={form.pingRoleId}
                    onChange={(e) => setForm({ ...form, pingRoleId: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono transition-all"
                  />
                </div>
              </div>

              {/* Custom Message Template */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">Custom Alert Message</label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => insertTemplateTag("{name}")}
                      className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 hover:bg-purple-500/20 cursor-pointer"
                    >
                      + {"{name}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTemplateTag("{title}")}
                      className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 hover:bg-purple-500/20 cursor-pointer"
                    >
                      + {"{title}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTemplateTag("{url}")}
                      className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 hover:bg-purple-500/20 cursor-pointer"
                    >
                      + {"{url}"}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={3}
                  placeholder="{name} just posted a new update! Check it out: {url}"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-sans transition-all resize-none"
                />
              </div>

              {/* Enable Toggle & Submit */}
              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="w-4 h-4 accent-purple-500 rounded bg-black/50 border-white/10"
                  />
                  <span>Enable Alert Immediately</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {submitting ? "Adding..." : "Add Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Active Feed Subscriptions Table & Platform Filter */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Active Feed Subscriptions</h2>
                <p className="text-xs text-zinc-400">Manage, test, and remove configured alerts</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search feeds or channel IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono transition-all"
                />
              </div>
            </div>

            {/* Platform Filter Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedPlatformFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  selectedPlatformFilter === "all"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    : "bg-black/30 text-zinc-400 border border-white/5 hover:text-zinc-200"
                }`}
              >
                All Feeds ({alerts.length})
              </button>
              {PLATFORMS.map((p) => {
                const count = alerts.filter((a) => a.platform === p.id).length;
                if (count === 0 && selectedPlatformFilter !== p.id) return null;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlatformFilter(p.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      selectedPlatformFilter === p.id
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : "bg-black/30 text-zinc-400 border border-white/5 hover:text-zinc-200"
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.name}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Table */}
            {filteredAlerts.length === 0 ? (
              <div className="min-h-[220px] flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-xl bg-black/20 text-center">
                <Bell className="w-8 h-8 text-zinc-600 mb-3" />
                <h3 className="text-sm font-semibold text-zinc-300">No feed subscriptions found</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  {searchQuery || selectedPlatformFilter !== "all"
                    ? "No alerts match your search query or platform filter."
                    : "Use the subscription form on the left to monitor YouTube, Twitch, Kick, Twitter, or RSS feeds."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-white/10 rounded-xl bg-black/40">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-white/[0.04] border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
                    <tr>
                      <th className="p-3.5">Platform</th>
                      <th className="p-3.5">Target / Account</th>
                      <th className="p-3.5">Discord Channel</th>
                      <th className="p-3.5">Ping Role</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {filteredAlerts.map((alert) => {
                      const platformInfo = PLATFORMS.find((p) => p.id === alert.platform) || {
                        name: alert.platform,
                        emoji: "📱",
                        badgeColor: "bg-zinc-800 text-zinc-300 border-zinc-700",
                      };
                      return (
                        <tr key={alert.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${platformInfo.badgeColor}`}>
                              <span>{platformInfo.emoji}</span>
                              <span>{platformInfo.name}</span>
                            </span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className="text-white font-medium">{alert.identifier}</span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap text-zinc-400">
                            <span className="bg-black/60 px-2 py-1 rounded border border-white/5 text-purple-300">
                              #{alert.channelId}
                            </span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap text-zinc-400">
                            {alert.pingRoleId ? (
                              <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20 text-[11px]">
                                @{alert.pingRoleId}
                              </span>
                            ) : (
                              <span className="text-zinc-600">None</span>
                            )}
                          </td>

                          <td className="p-3.5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleTestAlert(alert.id)}
                                disabled={testingId === alert.id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                                title="Send test alert to Discord channel"
                              >
                                {testingId === alert.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                <span>Test</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteAlert(alert.id)}
                                disabled={deletingId === alert.id}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                                title="Delete feed subscription"
                              >
                                {deletingId === alert.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
