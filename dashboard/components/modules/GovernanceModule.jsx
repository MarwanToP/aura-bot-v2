"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote,
  CheckSquare,
  Plus,
  Trash2,
  Clock,
  Shield,
  Sparkles,
  RefreshCw,
  Save,
  MessageSquare,
  Check,
  X,
  Sliders,
  EyeOff,
  Lock,
  Scale,
  Zap,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Rocket,
  Search,
  Filter,
  Users,
} from "lucide-react";

const EMOJI_NUMBERS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export default function GovernanceModule({ guildId = "default" }) {
  const [activeTab, setActiveTab] = useState("creator"); // "creator" | "polls" | "suggestions"
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Polls State
  const [polls, setPolls] = useState([]);
  const [pollFilter, setPollFilter] = useState("all"); // "all" | "active" | "ended"
  const [pollSearch, setPollSearch] = useState("");
  const [submittingPoll, setSubmittingPoll] = useState(false);

  // Poll Creator Form State
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["Option 1", "Option 2"]);
  const [duration, setDuration] = useState("24h");
  const [anonymous, setAnonymous] = useState(false);
  const [singleVote, setSingleVote] = useState(true);
  const [roleMultipliers, setRoleMultipliers] = useState([
    { role: "VIP", multiplier: 1.5 },
    { role: "Admin", multiplier: 2.0 },
  ]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleMult, setNewRoleMult] = useState("1.5");

  // Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionSettings, setSuggestionSettings] = useState({
    suggestionsEnabled: false,
    suggestionsChannelId: "",
  });
  const [suggestionStatusFilter, setSuggestionStatusFilter] = useState("pending");
  const [savingSettings, setSavingSettings] = useState(false);
  const [modNote, setModNote] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Polls Data
  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/polls`);
      if (res.ok) {
        const data = await res.json();
        setPolls(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("[GovernanceModule] Error fetching polls:", err);
    }
  }, [guildId]);

  // Fetch Suggestions Data
  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/suggestions`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        if (data.settings) {
          setSuggestionSettings({
            suggestionsEnabled: Boolean(data.settings.suggestionsEnabled),
            suggestionsChannelId: data.settings.suggestionsChannelId || "",
          });
        }
      }
    } catch (err) {
      console.error("[GovernanceModule] Error fetching suggestions:", err);
    }
  }, [guildId]);

  // Load All Data
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPolls(), fetchSuggestions()]);
    setLoading(false);
  }, [fetchPolls, fetchSuggestions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll Option Handlers
  const handleAddOption = () => {
    if (options.length >= 10) {
      showToast("Maximum 10 options allowed", "error");
      return;
    }
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      showToast("A poll requires at least 2 options", "error");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  // Role Multiplier Handlers
  const handleAddRoleMultiplier = () => {
    if (!newRoleName.trim()) return;
    const multNum = parseFloat(newRoleMult) || 1.0;
    setRoleMultipliers([
      ...roleMultipliers.filter((r) => r.role.toLowerCase() !== newRoleName.trim().toLowerCase()),
      { role: newRoleName.trim(), multiplier: multNum },
    ]);
    setNewRoleName("");
    setNewRoleMult("1.5");
  };

  const handleRemoveRoleMultiplier = (roleName) => {
    setRoleMultipliers(roleMultipliers.filter((r) => r.role !== roleName));
  };

  // Create Poll Handler
  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      showToast("Please enter a poll question", "error");
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      showToast("At least 2 non-empty options required", "error");
      return;
    }

    const multipliersObj = {};
    roleMultipliers.forEach((r) => {
      multipliersObj[r.role] = r.multiplier;
    });

    setSubmittingPoll(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          options: validOptions,
          duration,
          anonymous,
          singleVote,
          roleVoteMultipliers: multipliersObj,
        }),
      });

      if (res.ok) {
        showToast("Democratic poll created successfully!", "success");
        setQuestion("");
        setOptions(["Option 1", "Option 2"]);
        fetchPolls();
        setActiveTab("polls");
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || "Failed to create poll", "error");
      }
    } catch (err) {
      console.error("[GovernanceModule] Create poll error:", err);
      showToast("Network error creating poll", "error");
    } finally {
      setSubmittingPoll(false);
    }
  };

  // Poll Action Handler (End / Delete)
  const handlePollAction = async (pollId, action) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, action }),
      });

      if (res.ok) {
        showToast(`Poll ${action === "delete" ? "deleted" : "ended"} successfully`, "success");
        fetchPolls();
      } else {
        showToast(`Failed to ${action} poll`, "error");
      }
    } catch (err) {
      console.error(`[GovernanceModule] Error handling poll action ${action}:`, err);
      showToast(`Error performing ${action}`, "error");
    }
  };

  // Save Suggestion Settings Handler
  const handleSaveSuggestionSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(suggestionSettings),
      });

      if (res.ok) {
        showToast("Suggestion settings updated successfully!", "success");
      } else {
        showToast("Failed to update suggestion settings", "error");
      }
    } catch (err) {
      console.error("[GovernanceModule] Error saving suggestion settings:", err);
      showToast("Network error saving settings", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // Moderate Suggestion Handler
  const handleModerateSuggestion = async (suggestionId, status) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: status,
          suggestionId,
          note: modNote || null,
        }),
      });

      if (res.ok) {
        showToast(`Suggestion marked as ${status}!`, "success");
        setModNote("");
        fetchSuggestions();
      } else {
        showToast("Failed to moderate suggestion", "error");
      }
    } catch (err) {
      console.error("[GovernanceModule] Error moderating suggestion:", err);
      showToast("Network error moderating suggestion", "error");
    }
  };

  // Filtered Polls List
  const filteredPolls = polls.filter((p) => {
    const matchesStatus =
      pollFilter === "all" ? true : pollFilter === "active" ? p.status === "active" : p.status === "ended";
    const matchesSearch = p.question.toLowerCase().includes(pollSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered Suggestions List
  const filteredSuggestions = suggestions.filter((s) => {
    if (suggestionStatusFilter === "all") return true;
    return s.status === suggestionStatusFilter;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8 font-sans border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl relative overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl border shadow-xl flex items-center gap-3 text-sm font-medium ${
              toast.type === "error"
                ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
                : "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
            }`}
          >
            {toast.type === "error" ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient background light gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-cyan-500/20 border border-white/10 text-cyan-400">
              <Vote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                Polls & Community Governance
                <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Mr. Poll Engine
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Democratic decision making with role vote multipliers, single-vote integrity, and community suggestion queues.
              </p>
            </div>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-zinc-950/60 p-1.5 rounded-2xl border border-white/10 w-fit relative z-10">
        <button
          onClick={() => setActiveTab("creator")}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === "creator"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Poll Creator
        </button>
        <button
          onClick={() => setActiveTab("polls")}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === "polls"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Active & Ended Polls ({polls.length})
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === "suggestions"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Suggestion Box ({suggestions.length})
        </button>
      </div>

      {/* Tab 1: Democratic Poll Creator */}
      {activeTab === "creator" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10"
        >
          {/* Main Poll Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleCreatePoll} className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  Democratic Poll Builder
                </h2>
                <p className="text-xs text-zinc-400">
                  Configure questions, options, duration, and weighted voting rules for your community.
                </p>
              </div>

              {/* Question Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  Poll Question / Topic <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Which game tournament should we host next weekend?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                  required
                />
              </div>

              {/* Dynamic Options List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">
                    Poll Choices (Min 2, Max 10)
                  </label>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {options.length} / 10 Options
                  </span>
                </div>

                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-base select-none w-7 text-center">
                        {EMOJI_NUMBERS[idx] || `${idx + 1}.`}
                      </span>
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="flex-1 bg-zinc-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                        required
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 10 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-semibold text-cyan-400 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Choice
                  </button>
                )}
              </div>

              {/* Duration Select */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-400" /> Poll Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="1h">1 Hour</option>
                    <option value="6h">6 Hours</option>
                    <option value="12h">12 Hours</option>
                    <option value="24h">24 Hours (1 Day)</option>
                    <option value="3d">3 Days</option>
                    <option value="7d">7 Days (1 Week)</option>
                    <option value="">No Limit / Indefinite</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-cyan-400" /> Democratic Model
                  </label>
                  <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-white/10 text-xs text-zinc-400">
                    Weighted role votes enabled via multiplier stack
                  </div>
                </div>
              </div>

              {/* Integrity Switches */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" /> Single-Vote & Integrity Switches
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Anonymous Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/60 border border-white/10">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <EyeOff className="w-4 h-4 text-purple-400" /> Anonymous Voting
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Hide voter identities on results
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnonymous(!anonymous)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${
                        anonymous ? "bg-purple-600" : "bg-zinc-800"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                          anonymous ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Single Vote Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/60 border border-white/10">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-emerald-400" /> Single-Vote Integrity
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Enforce 1 vote per member limit
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSingleVote(!singleVote)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${
                        singleVote ? "bg-emerald-600" : "bg-zinc-800"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                          singleVote ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submittingPoll}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all duration-200"
                >
                  {submittingPoll ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Vote className="w-5 h-5" /> Launch Democratic Poll
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar: Role Vote Multipliers & Rules (1 col) */}
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" /> Role Vote Multipliers
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Grant higher vote weight to specific member roles (e.g., VIPs = 1.5x, Admins = 2.0x).
                </p>
              </div>

              {/* Existing Multipliers List */}
              <div className="space-y-2">
                {roleMultipliers.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-white/10 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-semibold text-white">{r.role}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-bold border border-cyan-500/20">
                        {r.multiplier}x Weight
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRoleMultiplier(r.role)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Multiplier Input */}
              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Role (e.g., Booster)"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    value={newRoleMult}
                    onChange={(e) => setNewRoleMult(e.target.value)}
                    className="bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2.0">2.0x</option>
                    <option value="2.5">2.5x</option>
                    <option value="3.0">3.0x</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddRoleMultiplier}
                  className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-cyan-400 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Multiplier Rule
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Active & Ended Polls Table */}
      {activeTab === "polls" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 relative z-10"
        >
          {/* Table Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
            {/* Status Filter Badges */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPollFilter("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  pollFilter === "all"
                    ? "bg-white/10 text-white border border-white/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All Polls ({polls.length})
              </button>
              <button
                onClick={() => setPollFilter("active")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  pollFilter === "active"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Active ({polls.filter((p) => p.status === "active").length})
              </button>
              <button
                onClick={() => setPollFilter("ended")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  pollFilter === "ended"
                    ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Ended ({polls.filter((p) => p.status === "ended").length})
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search polls..."
                value={pollSearch}
                onChange={(e) => setPollSearch(e.target.value)}
                className="w-full bg-zinc-950/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Polls List / Table */}
          {filteredPolls.length === 0 ? (
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-12 text-center space-y-3">
              <Vote className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-400">No Polls Found</h3>
              <p className="text-xs text-zinc-500">
                {pollSearch ? "No polls match your search query." : "No polls created yet for this guild."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPolls.map((poll) => {
                const totalVotes = poll.counts ? poll.counts.reduce((a, b) => a + b, 0) : 0;
                return (
                  <div
                    key={poll.id}
                    className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-lg hover:border-white/20 transition-all space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                              poll.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700"
                            }`}
                          >
                            {poll.status === "active" ? "🟢 ACTIVE" : "🔴 ENDED"}
                          </span>

                          {poll.anonymous && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              🔒 Anonymous
                            </span>
                          )}

                          {poll.singleVote && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              🛡️ Single Vote
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-white">{poll.question}</h3>
                        <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
                          <span>Total Votes: <strong className="text-white">{totalVotes}</strong></span>
                          {poll.endsAt && (
                            <span>Ends: <strong className="text-zinc-300">{new Date(poll.endsAt).toLocaleString()}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {poll.status === "active" && (
                          <button
                            onClick={() => handlePollAction(poll.id, "end")}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition-all"
                          >
                            End Poll
                          </button>
                        )}
                        <button
                          onClick={() => handlePollAction(poll.id, "delete")}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs transition-all"
                          title="Delete Poll"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Results / Vote Progress Bars */}
                    <div className="space-y-3">
                      {poll.options?.map((opt, idx) => {
                        const count = poll.counts?.[idx] || 0;
                        const wCount = poll.weightedCounts?.[idx] || count;
                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-zinc-200">
                                {EMOJI_NUMBERS[idx]} {opt}
                              </span>
                              <span className="text-zinc-400 font-mono">
                                {count} votes ({pct}%) • <span className="text-cyan-400">{wCount.toFixed(1)} pts</span>
                              </span>
                            </div>
                            <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-white/5">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Tab 3: Community Suggestion Box & Moderation */}
      {activeTab === "suggestions" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 relative z-10"
        >
          {/* Suggestions Box Settings Card */}
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" /> Suggestion Box Settings
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Configure the channel where community members submit and vote on suggestions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enable Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/60 border border-white/10">
                <div>
                  <div className="text-xs font-bold text-white">Suggestions System</div>
                  <div className="text-[11px] text-zinc-400">Enable `/suggest` command & button voting</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSuggestionSettings((prev) => ({
                      ...prev,
                      suggestionsEnabled: !prev.suggestionsEnabled,
                    }))
                  }
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${
                    suggestionSettings.suggestionsEnabled ? "bg-cyan-500" : "bg-zinc-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                      suggestionSettings.suggestionsEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Suggestions Channel ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Suggestions Channel ID</label>
                <input
                  type="text"
                  placeholder="e.g. 102938475610293847"
                  value={suggestionSettings.suggestionsChannelId}
                  onChange={(e) =>
                    setSuggestionSettings((prev) => ({
                      ...prev,
                      suggestionsChannelId: e.target.value,
                    }))
                  }
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSuggestionSettings}
                disabled={savingSettings}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
              >
                {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Suggestion Settings
              </button>
            </div>
          </div>

          {/* Suggestion Queue Moderation Card */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                {["pending", "approved", "rejected", "implemented", "all"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSuggestionStatusFilter(status)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${
                      suggestionStatusFilter === status
                        ? status === "pending"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : status === "approved"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : status === "rejected"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : status === "implemented"
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                          : "bg-white/10 text-white border border-white/20"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestion Cards Queue */}
            {filteredSuggestions.length === 0 ? (
              <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-12 text-center space-y-3">
                <MessageSquare className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-sm font-bold text-zinc-400">No Suggestions Found</h3>
                <p className="text-xs text-zinc-500">No community suggestions match the selected status.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSuggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4 relative flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          #{sug.id}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            sug.status === "pending"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : sug.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : sug.status === "rejected"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          }`}
                        >
                          {sug.status}
                        </span>
                      </div>

                      <p className="text-sm text-zinc-200 leading-relaxed">{sug.content}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <ThumbsUp className="w-3.5 h-3.5" /> {sug.upvotes || 0}
                          </span>
                          <span className="flex items-center gap-1 text-rose-400">
                            <ThumbsDown className="w-3.5 h-3.5" /> {sug.downvotes || 0}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500">
                          User: {sug.userId}
                        </span>
                      </div>

                      {sug.moderatorNote && (
                        <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5 text-xs text-zinc-400">
                          <strong className="text-zinc-300">Mod Note:</strong> {sug.moderatorNote}
                        </div>
                      )}

                      {/* Moderation Actions Bar */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleModerateSuggestion(sug.id, "approved")}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleModerateSuggestion(sug.id, "rejected")}
                          className="flex-1 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => handleModerateSuggestion(sug.id, "implemented")}
                          className="p-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold transition-all"
                          title="Mark Implemented"
                        >
                          <Rocket className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
