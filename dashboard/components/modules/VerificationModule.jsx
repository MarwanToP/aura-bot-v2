"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Shield,
  Check,
  Save,
  RefreshCw,
  Sliders,
  Lock,
  UserCheck,
  UserX,
  Hash,
  Globe,
  MousePointer,
  Calculator,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Eye,
  X,
  HelpCircle,
  Key,
} from "lucide-react";

export default function VerificationModule({ guildId = "default" }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [settings, setSettings] = useState({
    verificationEnabled: false,
    verificationRoleId: "",
    unverifiedRoleId: "",
    verificationChannelId: "",
    verificationMode: "web",
    altAgeLimit: 7,
  });

  const [roles, setRoles] = useState([]);
  const [channels, setChannels] = useState([]);

  // Interactive Panel Preview Test Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testMath, setTestMath] = useState({ a: 7, b: 5, answer: 12 });
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState(null); // "success" | "error" | null

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchVerificationData = useCallback(async () => {
    setLoading(true);
    try {
      const [resConfig, resRoles, resChannels] = await Promise.all([
        fetch(`/api/guilds/${guildId}/verification`),
        fetch(`/api/guilds/${guildId}/roles`),
        fetch(`/api/guilds/${guildId}/channels`),
      ]);

      if (resConfig.ok) {
        const data = await resConfig.json();
        setSettings({
          verificationEnabled: Boolean(data.verificationEnabled),
          verificationRoleId: data.verificationRoleId || "",
          unverifiedRoleId: data.unverifiedRoleId || "",
          verificationChannelId: data.verificationChannelId || "",
          verificationMode: data.verificationMode || "web",
          altAgeLimit: Number.isInteger(data.altAgeLimit) ? data.altAgeLimit : 7,
        });
      }

      if (resRoles.ok) {
        const roleData = await resRoles.json();
        setRoles(Array.isArray(roleData) ? roleData : []);
      }

      if (resChannels.ok) {
        const channelData = await resChannels.json();
        setChannels(Array.isArray(channelData) ? channelData : []);
      }
    } catch (err) {
      console.error("[VerificationModule] Error loading configuration:", err);
      showToast("Failed to load verification configuration", "error");
    } fontally: {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchVerificationData();
  }, [fetchVerificationData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.settings) {
          setSettings({
            verificationEnabled: Boolean(result.settings.verificationEnabled),
            verificationRoleId: result.settings.verificationRoleId || "",
            unverifiedRoleId: result.settings.unverifiedRoleId || "",
            verificationChannelId: result.settings.verificationChannelId || "",
            verificationMode: result.settings.verificationMode || "web",
            altAgeLimit: Number.isInteger(result.settings.altAgeLimit) ? result.settings.altAgeLimit : 7,
          });
        }
        showToast("Verification Gateway settings saved successfully!", "success");
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || "Failed to save verification settings", "error");
      }
    } catch (err) {
      console.error("[VerificationModule] Save error:", err);
      showToast("Network error while saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Generate new math problem for interactive preview test
  const openTestModal = () => {
    const num1 = Math.floor(Math.random() * 8) + 2;
    const num2 = Math.floor(Math.random() * 8) + 2;
    setTestMath({ a: num1, b: num2, answer: num1 + num2 });
    setTestInput("");
    setTestResult(null);
    setTestModalOpen(true);
  };

  const handleTestSubmit = (e) => {
    e.preventDefault();
    if (parseInt(testInput, 10) === testMath.answer) {
      setTestResult("success");
    } else {
      setTestResult("error");
    }
  };

  const verificationModes = [
    {
      id: "web",
      title: "Web Captcha",
      subtitle: "hCaptcha / OAuth Gateway",
      icon: Globe,
      color: "from-cyan-500 to-blue-600",
      accent: "text-cyan-400",
      border: "border-cyan-500/30",
      description: "Directs members to a secure web portal for hCaptcha verification. Maximum security against automated bot raids.",
    },
    {
      id: "button",
      title: "Interactive Button",
      subtitle: "One-Click Grant",
      icon: MousePointer,
      color: "from-emerald-500 to-teal-600",
      accent: "text-emerald-400",
      border: "border-emerald-500/30",
      description: "Members click a single button inside Discord to instantly acknowledge rules and unlock access.",
    },
    {
      id: "math",
      title: "Math Challenge",
      subtitle: "Dynamic Equation Prompt",
      icon: Calculator,
      color: "from-purple-500 to-indigo-600",
      accent: "text-purple-400",
      border: "border-purple-500/30",
      description: "Members must solve an ephemeral math equation within 60 seconds inside the Discord channel.",
    },
  ];

  const altAgePresets = [
    { days: 0, label: "Disabled", badge: "Off" },
    { days: 1, label: "24 Hours", badge: "Basic" },
    { days: 3, label: "3 Days", badge: "Standard" },
    { days: 7, label: "7 Days", badge: "Recommended" },
    { days: 14, label: "14 Days", badge: "High" },
    { days: 30, label: "30 Days", badge: "Strict" },
  ];

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-[#09090b] text-white p-8 rounded-2xl border border-white/10">
        <RefreshCw className="w-8 h-8 text-[#5865F2] animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-400">Loading Verification Gateway Module...</p>
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
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-wide text-white">Verification Gateway</h1>
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                  settings.verificationEnabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
                }`}
              >
                {settings.verificationEnabled ? "VERIFICATION ACTIVE" : "DISABLED"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Synthesize Security Bot & Wick gateway features to protect your server from raid alts and malicious bots.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={fetchVerificationData}
            className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
            title="Reload configuration"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* Section 1: Master Toggle & Mode Selector */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Captcha Verification Master Switch</h2>
                <p className="text-xs text-zinc-400">
                  Require new members to pass human verification before seeing channels
                </p>
              </div>
            </div>

            {/* Snappy Toggle */}
            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  verificationEnabled: !prev.verificationEnabled,
                }))
              }
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${
                settings.verificationEnabled ? "bg-emerald-500" : "bg-zinc-800"
              }`}
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-4 h-4 rounded-full bg-white shadow-md ${
                  settings.verificationEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Mode Selector Cards */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Verification Challenge Mode
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {verificationModes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = settings.verificationMode === mode.id;

                return (
                  <div
                    key={mode.id}
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, verificationMode: mode.id }))
                    }
                    className={`relative rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? `bg-white/[0.07] ${mode.border} shadow-lg shadow-cyan-500/5`
                        : "bg-black/30 border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-lg bg-gradient-to-br ${mode.color} text-white shadow-md`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-500/20 text-emerald-400"
                            : "border-zinc-700 bg-black/40"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-white mb-0.5">{mode.title}</h3>
                    <p className={`text-[10px] font-mono mb-2 ${mode.accent}`}>{mode.subtitle}</p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{mode.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Alt-Account Detection Threshold */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Alt-Account Age Threshold</h2>
              <p className="text-xs text-zinc-400">
                Automatically flag or reject accounts created recently
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-300">Minimum Account Age Limit</label>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  {settings.altAgeLimit === 0 ? "Disabled (0 days)" : `${settings.altAgeLimit} Days Old`}
                </span>
              </div>

              {/* Slider Control */}
              <input
                type="range"
                min="0"
                max="90"
                step="1"
                value={settings.altAgeLimit}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    altAgeLimit: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-full accent-amber-500 bg-zinc-800 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {altAgePresets.map((preset) => {
                const isActive = settings.altAgeLimit === preset.days;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, altAgeLimit: preset.days }))
                    }
                    className={`px-2 py-2 rounded-xl text-center border transition-all cursor-pointer ${
                      isActive
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md"
                        : "bg-black/30 border-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{preset.days}d</div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-400 mt-0.5">{preset.badge}</div>
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200/80">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Accounts created less than <strong className="text-amber-300 font-mono">{settings.altAgeLimit} days</strong> ago will be required to pass extra verification step or will be blocked automatically.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Roles & Channel Selectors */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Roles & Channel Gateway Assignment</h2>
              <p className="text-xs text-zinc-400">
                Configure roles awarded/removed and gateway channel
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Verified Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Verified Role (Granted upon completion)
              </label>

              {roles.length > 0 ? (
                <select
                  value={settings.verificationRoleId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, verificationRoleId: e.target.value }))
                  }
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                >
                  <option value="">Select Verified Role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      @{role.name} ({role.id})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Role ID e.g. 111111111111111111"
                  value={settings.verificationRoleId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, verificationRoleId: e.target.value }))
                  }
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono transition-all"
                />
              )}
            </div>

            {/* Unverified Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-400" />
                Unverified Role (Assigned upon joining)
              </label>

              {roles.length > 0 ? (
                <select
                  value={settings.unverifiedRoleId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, unverifiedRoleId: e.target.value }))
                  }
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition-all font-mono"
                >
                  <option value="">Select Unverified Role (Optional)...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      @{role.name} ({role.id})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Role ID e.g. 222222222222222222"
                  value={settings.unverifiedRoleId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, unverifiedRoleId: e.target.value }))
                  }
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 font-mono transition-all"
                />
              )}
            </div>

            {/* Gateway Channel Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-2">
                <Hash className="w-4 h-4 text-cyan-400" />
                Verification Gateway Channel
              </label>

              {channels.length > 0 ? (
                <select
                  value={settings.verificationChannelId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, verificationChannelId: e.target.value }))
                  }
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
                >
                  <option value="">Select Gateway Channel...</option>
                  {channels.map((chan) => (
                    <option key={chan.id} value={chan.id}>
                      #{chan.name} ({chan.id})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Channel ID e.g. 100000000000000001"
                  value={settings.verificationChannelId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, verificationChannelId: e.target.value }))
                  }
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono transition-all"
                />
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Interactive Verification Button / Panel Preview Card */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Interactive Verification Panel Live Preview</h2>
                <p className="text-xs text-zinc-400">
                  Live preview card of the verification message posted in your Discord channel
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2]">
              DISCORD EMBED PREVIEW
            </span>
          </div>

          {/* Discord Message Preview Frame */}
          <div className="bg-[#313338] rounded-xl p-4 sm:p-5 border border-black/40 shadow-2xl text-left font-sans">
            <div className="flex items-start gap-3">
              {/* Bot Avatar */}
              <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center shrink-0 shadow-md">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Bot Header */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">Aura Security Gate</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#5865F2] text-white uppercase tracking-wider">
                    BOT
                  </span>
                  <span className="text-xs text-zinc-400">Today at 12:00 PM</span>
                </div>

                {/* Discord Embed Box */}
                <div className="mt-2 rounded-lg bg-[#2b2d31] border-l-4 border-l-emerald-500 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      🛡️ Server Security Verification
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {settings.verificationMode.toUpperCase()} GATEWAY
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Welcome to the server! To prevent raid bots and automated spam, please verify your account.
                    {settings.altAgeLimit > 0 && (
                      <span className="block mt-1 text-[11px] text-amber-300/90">
                        ⚡ Note: Accounts younger than {settings.altAgeLimit} days require identity verification.
                      </span>
                    )}
                  </p>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Aura Security Gateway • Verification Gate</span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> System Operational
                    </span>
                  </div>
                </div>

                {/* Interactive Action Button Row */}
                <div className="mt-3 flex items-center gap-3">
                  {settings.verificationMode === "web" && (
                    <button
                      onClick={openTestModal}
                      className="px-4 py-2 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Verify via Web Portal
                    </button>
                  )}

                  {settings.verificationMode === "button" && (
                    <button
                      onClick={openTestModal}
                      className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Click to Verify
                    </button>
                  )}

                  {settings.verificationMode === "math" && (
                    <button
                      onClick={openTestModal}
                      className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      Solve Math Challenge
                    </button>
                  )}

                  <span className="text-[11px] text-zinc-400 italic">
                    (Click button to test interactive user flow)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Verification Test Simulation Modal */}
      <AnimatePresence>
        {testModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111214] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setTestModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {settings.verificationMode === "web" && "Web Captcha Gateway Simulation"}
                    {settings.verificationMode === "button" && "One-Click Verification Test"}
                    {settings.verificationMode === "math" && "Math Challenge Verification"}
                  </h3>
                  <p className="text-xs text-zinc-400">Interactive preview simulation</p>
                </div>
              </div>

              {settings.verificationMode === "web" && (
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed">
                    🌐 <strong>Web Captcha Flow:</strong> Users click the link to be securely redirected to an OAuth + hCaptcha page. Upon passing hCaptcha, the bot assigns the Verified Role automatically.
                  </div>
                  <button
                    onClick={() => setTestResult("success")}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Simulate hCaptcha Solved Pass ✅
                  </button>
                </div>
              )}

              {settings.verificationMode === "button" && (
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200 leading-relaxed">
                    ✅ <strong>One-Click Flow:</strong> User clicks button, bot immediately grants role <code className="text-emerald-300 font-mono">@{roles.find(r => r.id === settings.verificationRoleId)?.name || "Verified"}</code>.
                  </div>
                  <button
                    onClick={() => setTestResult("success")}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Simulate Button Verification ✅
                  </button>
                </div>
              )}

              {settings.verificationMode === "math" && (
                <form onSubmit={handleTestSubmit} className="space-y-4 py-2">
                  <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-center space-y-2">
                    <p className="text-xs text-purple-300 font-medium">Solve the equation to verify:</p>
                    <div className="text-2xl font-bold font-mono text-white tracking-widest bg-black/40 py-2 rounded-lg border border-purple-500/30">
                      {testMath.a} + {testMath.b} = ?
                    </div>
                  </div>

                  <input
                    type="number"
                    placeholder="Enter answer (e.g. 12)"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono text-center"
                    autoFocus
                  />

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Submit Answer
                  </button>
                </form>
              )}

              {/* Simulation Result Feedback */}
              {testResult === "success" && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Success! Verified role assigned to member successfully.</span>
                </div>
              )}

              {testResult === "error" && (
                <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Incorrect answer! Please try again.</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
