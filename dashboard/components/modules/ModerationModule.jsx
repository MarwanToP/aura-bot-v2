"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  Ban,
  Search,
  Filter,
  Check,
  Save,
  RefreshCw,
  FileText,
  Settings,
  Sliders,
  Plus,
  Trash2,
  Eye,
  Scale,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Zap,
  UserX,
  AlertCircle,
  Link2,
  VolumeX,
  HelpCircle,
  Lock,
} from "lucide-react";

export default function ModerationModule({ guildId = "default" }) {
  const [activeTab, setActiveTab] = useState("automod");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // General & Logging Settings State
  const [modSettings, setModSettings] = useState({
    modLogChannelId: "",
    auditLogChannelId: "",
    muteRoleId: "",
    autoModEnabled: true,
    aiModEnabled: false,
    aiModSensitivity: "medium",
    warningConfig: {
      maxWarnings: 3,
      defaultAction: "timeout",
      durationMinutes: 60,
    },
    appealsConfig: {
      enabled: false,
      appealChannelId: "",
      formatInstructions: "",
    },
  });

  // Auto-Mod Specific Rules State
  const [autoModRules, setAutoModRules] = useState({
    bannedWords: [],
    inviteLinks: false,
    spamThreshold: 5,
    action: "timeout",
    durationMinutes: 10,
    exemptRoles: [],
    exemptChannels: [],
  });

  // Banned word input chip field state
  const [newWord, setNewWord] = useState("");

  // Moderation Cases Table State
  const [casesData, setCasesData] = useState({
    cases: [],
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 10,
    stats: {
      totalCases: 0,
      activeWarnings: 0,
      warnCount: 0,
      banCount: 0,
      kickCount: 0,
      timeoutCount: 0,
    },
  });

  const [caseSearch, setCaseSearch] = useState("");
  const [caseFilterType, setCaseFilterType] = useState("all");
  const [casePage, setCasePage] = useState(1);
  const [loadingCases, setLoadingCases] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial Moderation & AutoMod settings
  const fetchModuleData = useCallback(async () => {
    setLoading(true);
    try {
      const [resMod, resAuto] = await Promise.all([
        fetch(`/api/guilds/${guildId}/moderation`),
        fetch(`/api/guilds/${guildId}/automod`),
      ]);

      if (resMod.ok) {
        const modData = await resMod.json();
        setModSettings({
          modLogChannelId: modData.modLogChannelId || "",
          auditLogChannelId: modData.auditLogChannelId || "",
          muteRoleId: modData.muteRoleId || "",
          autoModEnabled: Boolean(modData.autoModEnabled),
          aiModEnabled: Boolean(modData.aiModEnabled),
          aiModSensitivity: modData.aiModSensitivity || "medium",
          warningConfig: modData.warningConfig || {
            maxWarnings: 3,
            defaultAction: "timeout",
            durationMinutes: 60,
          },
          appealsConfig: modData.appealsConfig || {
            enabled: false,
            appealChannelId: "",
            formatInstructions: "",
          },
        });
      }

      if (resAuto.ok) {
        const autoData = await resAuto.json();
        if (autoData.rules) {
          setAutoModRules({
            bannedWords: Array.isArray(autoData.rules.bannedWords) ? autoData.rules.bannedWords : [],
            inviteLinks: Boolean(autoData.rules.inviteLinks),
            spamThreshold: autoData.rules.spamThreshold || 5,
            action: autoData.rules.action || "timeout",
            durationMinutes: autoData.rules.durationMinutes || 10,
            exemptRoles: Array.isArray(autoData.rules.exemptRoles) ? autoData.rules.exemptRoles : [],
            exemptChannels: Array.isArray(autoData.rules.exemptChannels) ? autoData.rules.exemptChannels : [],
          });
        }
      }
    } catch (err) {
      console.error("[ModerationModule] Error loading moderation data:", err);
      showToast("Failed to load moderation module settings", "error");
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  // Fetch moderation cases for table
  const fetchCases = useCallback(async () => {
    setLoadingCases(true);
    try {
      const params = new URLSearchParams({
        page: casePage.toString(),
        limit: "10",
      });
      if (caseSearch.trim()) params.append("search", caseSearch.trim());
      if (caseFilterType !== "all") params.append("type", caseFilterType);

      const res = await fetch(`/api/guilds/${guildId}/cases?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCasesData({
          cases: Array.isArray(data.cases) ? data.cases : [],
          total: data.total || 0,
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          limit: data.limit || 10,
          stats: data.stats || {
            totalCases: 0,
            activeWarnings: 0,
            warnCount: 0,
            banCount: 0,
            kickCount: 0,
            timeoutCount: 0,
          },
        });
      }
    } catch (err) {
      console.error("[ModerationModule] Error fetching cases:", err);
    } finally {
      setLoadingCases(false);
    }
  }, [guildId, casePage, caseSearch, caseFilterType]);

  useEffect(() => {
    fetchModuleData();
  }, [fetchModuleData]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Save all settings (Moderation & AutoMod)
  const handleSave = async () => {
    setSaving(true);
    try {
      const [resMod, resAuto] = await Promise.all([
        fetch(`/api/guilds/${guildId}/moderation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(modSettings),
        }),
        fetch(`/api/guilds/${guildId}/automod`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: modSettings.autoModEnabled,
            aiEnabled: modSettings.aiModEnabled,
            sensitivity: modSettings.aiModSensitivity,
            rules: autoModRules,
          }),
        }),
      ]);

      if (resMod.ok && resAuto.ok) {
        showToast("Moderation & Auto-Mod settings saved successfully!", "success");
      } else {
        const err1 = await resMod.json().catch(() => ({}));
        const err2 = await resAuto.json().catch(() => ({}));
        showToast(err1.error || err2.error || "Failed to save moderation settings", "error");
      }
    } catch (err) {
      console.error("[ModerationModule] Save error:", err);
      showToast("Network error while saving moderation settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Add banned word tag chip
  const handleAddBannedWord = (e) => {
    e.preventDefault();
    const word = newWord.trim().toLowerCase();
    if (!word) return;
    if (autoModRules.bannedWords.includes(word)) {
      showToast(`"${word}" is already in the banned list`, "error");
      return;
    }
    setAutoModRules((prev) => ({
      ...prev,
      bannedWords: [...prev.bannedWords, word],
    }));
    setNewWord("");
  };

  // Remove banned word tag chip
  const handleRemoveBannedWord = (wordToRemove) => {
    setAutoModRules((prev) => ({
      ...prev,
      bannedWords: prev.bannedWords.filter((w) => w !== wordToRemove),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-[#09090b] text-white p-8 rounded-2xl border border-white/10">
        <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-400">Loading Moderation & Audit Module...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#09090b] text-white p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background Cyber Ambient Lights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
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
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-wide text-white">Moderation & Audit Engine</h1>
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                  modSettings.autoModEnabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
                }`}
              >
                {modSettings.autoModEnabled ? "AUTOMOD ACTIVE" : "AUTOMOD STANDBY"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Automated anti-spam filtering, bad words shield, warning point escalation, and moderation case logs.
            </p>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchModuleData}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 flex items-center gap-2 transition-all border border-rose-400/30"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 relative z-10">
        {[
          { id: "automod", label: "Auto-Mod Rules", icon: Zap },
          { id: "warnings_appeals", label: "Warnings & Appeals", icon: Scale },
          { id: "cases", label: "Moderation Cases", icon: FileText },
          { id: "settings", label: "Audit & Channels", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-md"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-rose-400" : "text-zinc-500"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="relative z-10">
        {/* ── TAB 1: Auto-Mod Engine & Rules ────────────────────────── */}
        {activeTab === "automod" && (
          <div className="space-y-6">
            {/* AutoMod & AI Mod Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main AutoMod Toggle Card */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Auto-Moderation Engine</h3>
                      <p className="text-xs text-zinc-400">Real-time message scanning & action enforcement</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setModSettings((prev) => ({ ...prev, autoModEnabled: !prev.autoModEnabled }))
                    }
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${
                      modSettings.autoModEnabled ? "bg-rose-600" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                        modSettings.autoModEnabled ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <div className="text-xs text-zinc-400 border-t border-white/5 pt-3">
                  Status:{" "}
                  <span className={modSettings.autoModEnabled ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                    {modSettings.autoModEnabled ? "Active — Shielding channels" : "Disabled — Messages bypass filter"}
                  </span>
                </div>
              </div>

              {/* Neural AI Moderation Toggle Card */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">AI Neural Content Filter</h3>
                      <p className="text-xs text-zinc-400">Contextual toxicity, hate-speech & harassment detection</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setModSettings((prev) => ({ ...prev, aiModEnabled: !prev.aiModEnabled }))
                    }
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${
                      modSettings.aiModEnabled ? "bg-cyan-600" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                        modSettings.aiModEnabled ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {modSettings.aiModEnabled && (
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">AI Sensitivity Level:</span>
                    <div className="flex gap-2">
                      {["low", "medium", "high"].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() =>
                            setModSettings((prev) => ({ ...prev, aiModSensitivity: lvl }))
                          }
                          className={`px-3 py-1 rounded-lg uppercase text-[10px] font-mono border transition-all ${
                            modSettings.aiModSensitivity === lvl
                              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Banned Words Configuration */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Ban className="w-5 h-5 text-rose-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Banned Words & Phrasal Filter</h3>
                    <p className="text-xs text-zinc-400">
                      Messages containing these words will be intercepted and acted upon automatically.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  {autoModRules.bannedWords.length} BANNED
                </span>
              </div>

              {/* Add Word Form */}
              <form onSubmit={handleAddBannedWord} className="flex gap-3">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Type a word or phrase and press Enter..."
                  className="flex-1 bg-zinc-900/90 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" /> Add Word
                </button>
              </form>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-2 pt-2 min-h-[48px] p-3 rounded-xl bg-zinc-950/60 border border-white/5">
                {autoModRules.bannedWords.length === 0 ? (
                  <span className="text-xs text-zinc-600 italic">No banned words added yet.</span>
                ) : (
                  autoModRules.bannedWords.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-mono"
                    >
                      {word}
                      <button
                        type="button"
                        onClick={() => handleRemoveBannedWord(word)}
                        className="hover:text-rose-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Anti-Spam & Link Protection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Discord Invite Filter */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link2 className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Block Discord Invites</h3>
                      <p className="text-xs text-zinc-400">Prevent external server invite links (discord.gg)</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setAutoModRules((prev) => ({ ...prev, inviteLinks: !prev.inviteLinks }))
                    }
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${
                      autoModRules.inviteLinks ? "bg-indigo-600" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                        autoModRules.inviteLinks ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Spam Threshold Rate Limit */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Spam Rate Limit Threshold</h3>
                    <p className="text-xs text-zinc-400">Max messages allowed per 5 seconds</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={autoModRules.spamThreshold}
                    onChange={(e) =>
                      setAutoModRules((prev) => ({
                        ...prev,
                        spamThreshold: parseInt(e.target.value, 10),
                      }))
                    }
                    className="flex-1 accent-rose-500"
                  />
                  <span className="text-sm font-mono font-bold text-amber-400 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    {autoModRules.spamThreshold} msgs
                  </span>
                </div>
              </div>
            </div>

            {/* Automated Enforcement Action */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-400" />
                Automated Enforcement Action
              </h3>
              <p className="text-xs text-zinc-400">Action taken when an Auto-Mod rule is triggered.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: "delete", label: "Delete Message Only", desc: "Purges the offending message." },
                  { id: "warn", label: "Warn User", desc: "Issues a warning point to user profile." },
                  { id: "timeout", label: "Mute / Timeout", desc: "Temporarily mutes user for set duration." },
                  { id: "kick", label: "Kick Member", desc: "Removes user from server." },
                ].map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setAutoModRules((prev) => ({ ...prev, action: act.id }))}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      autoModRules.action === act.id
                        ? "bg-rose-500/20 border-rose-500/50 text-white shadow-lg"
                        : "bg-zinc-900/60 border-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    <div className="text-xs font-bold mb-1 flex items-center justify-between">
                      {act.label}
                      {autoModRules.action === act.id && <Check className="w-3.5 h-3.5 text-rose-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-500">{act.desc}</p>
                  </button>
                ))}
              </div>

              {/* Timeout Duration Selector if action === 'timeout' */}
              {autoModRules.action === "timeout" && (
                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-xs text-zinc-300 font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" /> Timeout Punishment Duration:
                  </span>
                  <select
                    value={autoModRules.durationMinutes}
                    onChange={(e) =>
                      setAutoModRules((prev) => ({
                        ...prev,
                        durationMinutes: parseInt(e.target.value, 10),
                      }))
                    }
                    className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                  >
                    <option value={1}>1 Minute</option>
                    <option value={5}>5 Minutes</option>
                    <option value={10}>10 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={1440}>24 Hours</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: Warnings & Appeals Hub ────────────────────────── */}
        {activeTab === "warnings_appeals" && (
          <div className="space-y-6">
            {/* Warning Points Threshold Config */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Warning Point Escalation System</h3>
                  <p className="text-xs text-zinc-400">
                    Automatically trigger punitive actions when a member accumulates warning points.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Max Warning Points Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={modSettings.warningConfig?.maxWarnings || 3}
                    onChange={(e) =>
                      setModSettings((prev) => ({
                        ...prev,
                        warningConfig: {
                          ...prev.warningConfig,
                          maxWarnings: Math.max(1, parseInt(e.target.value, 10) || 1),
                        },
                      }))
                    }
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Escalation Action
                  </label>
                  <select
                    value={modSettings.warningConfig?.defaultAction || "timeout"}
                    onChange={(e) =>
                      setModSettings((prev) => ({
                        ...prev,
                        warningConfig: {
                          ...prev.warningConfig,
                          defaultAction: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="timeout">Timeout / Mute</option>
                    <option value="kick">Kick User</option>
                    <option value="ban">Ban User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Timeout Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10080"
                    value={modSettings.warningConfig?.durationMinutes || 60}
                    onChange={(e) =>
                      setModSettings((prev) => ({
                        ...prev,
                        warningConfig: {
                          ...prev.warningConfig,
                          durationMinutes: Math.max(1, parseInt(e.target.value, 10) || 1),
                        },
                      }))
                    }
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Ban Appeal Management Settings */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Ban & Warning Appeal Portal</h3>
                    <p className="text-xs text-zinc-400">
                      Enable structured appeal submissions for penalized users.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setModSettings((prev) => ({
                      ...prev,
                      appealsConfig: {
                        ...prev.appealsConfig,
                        enabled: !prev.appealsConfig?.enabled,
                      },
                    }))
                  }
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${
                    modSettings.appealsConfig?.enabled ? "bg-purple-600" : "bg-zinc-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                      modSettings.appealsConfig?.enabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {modSettings.appealsConfig?.enabled && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-2">
                      Appeals Review Channel ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 102938475610293847"
                      value={modSettings.appealsConfig?.appealChannelId || ""}
                      onChange={(e) =>
                        setModSettings((prev) => ({
                          ...prev,
                          appealsConfig: {
                            ...prev.appealsConfig,
                            appealChannelId: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-2">
                      Appeal Submission Guidelines & Instructions
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Instructions sent to users requesting an unban or warning removal..."
                      value={modSettings.appealsConfig?.formatInstructions || ""}
                      onChange={(e) =>
                        setModSettings((prev) => ({
                          ...prev,
                          appealsConfig: {
                            ...prev.appealsConfig,
                            formatInstructions: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: Moderation Cases & Audit Log ───────────────────── */}
        {activeTab === "cases" && (
          <div className="space-y-6">
            {/* Telemetry Counter Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { label: "Total Cases", val: casesData.stats.totalCases || 0, color: "text-zinc-200" },
                { label: "Active Warns", val: casesData.stats.activeWarnings || 0, color: "text-amber-400" },
                { label: "Warnings", val: casesData.stats.warnCount || 0, color: "text-yellow-400" },
                { label: "Timeouts", val: casesData.stats.timeoutCount || 0, color: "text-cyan-400" },
                { label: "Kicks", val: casesData.stats.kickCount || 0, color: "text-orange-400" },
                { label: "Bans", val: casesData.stats.banCount || 0, color: "text-rose-400" },
              ].map((st, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-xs text-zinc-400">{st.label}</div>
                  <div className={`text-xl font-extrabold font-mono mt-1 ${st.color}`}>{st.val}</div>
                </div>
              ))}
            </div>

            {/* Filter Bar & Search Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search cases by Case ID, Target User ID, Moderator ID, or Reason..."
                  value={caseSearch}
                  onChange={(e) => {
                    setCaseSearch(e.target.value);
                    setCasePage(1);
                  }}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50"
                />
              </div>

              {/* Action Type Filter Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-400" />
                <select
                  value={caseFilterType}
                  onChange={(e) => {
                    setCaseFilterType(e.target.value);
                    setCasePage(1);
                  }}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                >
                  <option value="all">All Action Types</option>
                  <option value="warn">Warn</option>
                  <option value="timeout">Timeout</option>
                  <option value="kick">Kick</option>
                  <option value="ban">Ban</option>
                  <option value="unban">Unban</option>
                  <option value="note">Note</option>
                  <option value="softban">Softban</option>
                </select>
              </div>
            </div>

            {/* Cases Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.04] text-zinc-400 uppercase font-mono border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-4">Case #</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Target User</th>
                    <th className="py-3.5 px-4">Moderator</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingCases ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-zinc-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                        Loading moderation log cases...
                      </td>
                    </tr>
                  ) : casesData.cases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-zinc-500 italic">
                        No moderation cases match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    casesData.cases.map((c) => {
                      const typeBadge = {
                        warn: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
                        timeout: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
                        kick: "bg-orange-500/10 border-orange-500/30 text-orange-300",
                        ban: "bg-rose-500/10 border-rose-500/30 text-rose-300",
                        unban: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
                        note: "bg-blue-500/10 border-blue-500/30 text-blue-300",
                      }[c.type] || "bg-zinc-800 border-zinc-700 text-zinc-300";

                      return (
                        <tr key={c.id || c.caseId} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-rose-400">
                            #{c.caseId}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono uppercase ${typeBadge}`}>
                              {c.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-300">
                            {c.userId}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-400">
                            {c.moderatorId}
                          </td>
                          <td className="py-3 px-4 text-zinc-300 max-w-xs truncate" title={c.reason}>
                            {c.reason}
                          </td>
                          <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedCase(c)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                              title="View Case Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-500 font-mono">
                Page {casesData.page} of {casesData.totalPages} ({casesData.total} total cases)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={casePage <= 1}
                  onClick={() => setCasePage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 text-xs font-semibold flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  disabled={casePage >= casesData.totalPages}
                  onClick={() => setCasePage((p) => Math.min(casesData.totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 text-xs font-semibold flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: General Settings & Logging Channels ────────────── */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-rose-400" />
                Logging Channels & Moderation Roles
              </h3>
              <p className="text-xs text-zinc-400">
                Designate channel endpoints for audit logs and role IDs for mutes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Moderation Log Channel ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 109283746501928374"
                    value={modSettings.modLogChannelId || ""}
                    onChange={(e) =>
                      setModSettings((prev) => ({ ...prev, modLogChannelId: e.target.value }))
                    }
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Server Audit Log Channel ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 109283746501928375"
                    value={modSettings.auditLogChannelId || ""}
                    onChange={(e) =>
                      setModSettings((prev) => ({ ...prev, auditLogChannelId: e.target.value }))
                    }
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Mute Role ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 109283746501928376"
                    value={modSettings.muteRoleId || ""}
                    onChange={(e) =>
                      setModSettings((prev) => ({ ...prev, muteRoleId: e.target.value }))
                    }
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Case Details Modal */}
      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#09090b] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-rose-400" />
                  Case #{selectedCase.caseId} Details
                </h3>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Action Type:</span>
                  <span className="font-mono font-bold text-rose-400 uppercase">{selectedCase.type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Target User ID:</span>
                  <span className="font-mono text-zinc-200">{selectedCase.userId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Moderator ID:</span>
                  <span className="font-mono text-zinc-200">{selectedCase.moderatorId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Issued Date:</span>
                  <span className="font-mono text-zinc-200">
                    {new Date(selectedCase.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="py-1">
                  <span className="text-zinc-400 block mb-1">Reason:</span>
                  <p className="p-3 rounded-xl bg-zinc-900 border border-white/5 text-zinc-200 leading-relaxed">
                    {selectedCase.reason}
                  </p>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
