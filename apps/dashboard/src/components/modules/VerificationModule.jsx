"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
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
  CheckCircle2,
  ExternalLink,
  Eye,
  X,
} from "lucide-react";

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

/* ────────────────────────────── shared styles ────────────────────────────── */

const fieldCls = "glass-input text-xs";

const selectCls = "glass-select text-xs";

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

/* single source of truth for turning an API payload into form state */
function mapVerification(data) {
  return {
    verificationEnabled: Boolean(data?.verificationEnabled),
    verificationRoleId: data?.verificationRoleId || "",
    unverifiedRoleId: data?.unverifiedRoleId || "",
    verificationChannelId: data?.verificationChannelId || "",
    verificationMode: data?.verificationMode || "web",
    altAgeLimit: Number.isInteger(data?.altAgeLimit) ? data.altAgeLimit : 7,
  };
}

export default function VerificationModule({ guildId = null }) {
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

  /* Refs to the verification-mode radio buttons — used for roving focus. */
  const modeOptionRefs = useRef([]);

  // Interactive Panel Preview Test Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testMath, setTestMath] = useState({ a: 7, b: 5, answer: 12 });
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState(null); // "success" | "error" | null

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchVerificationData = useCallback(async () => {
    /* Guest mode: no real guild, so there is nothing to load — never hit the network. */
    if (!guildId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [resConfig, resRoles, resChannels] = await Promise.all([
        fetch(`/api/guilds/${guildId}/verification`),
        fetch(`/api/guilds/${guildId}/roles`),
        fetch(`/api/guilds/${guildId}/channels`),
      ]);

      if (resConfig.ok) {
        const data = await resConfig.json();
        setSettings(mapVerification(data));
      }

      if (resRoles.ok) {
        const roleData = await resRoles.json();
        // The API returns { roles: [...] } / { channels: [...] }; accept a bare
        // array too so the pickers are never silently empty.
        setRoles(Array.isArray(roleData) ? roleData : Array.isArray(roleData?.roles) ? roleData.roles : []);
      }

      if (resChannels.ok) {
        const channelData = await resChannels.json();
        setChannels(Array.isArray(channelData) ? channelData : Array.isArray(channelData?.channels) ? channelData.channels : []);
      }
    } catch (err) {
      console.error("[VerificationModule] Error loading configuration:", err);
      showToast("Failed to load verification configuration", "error");
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchVerificationData();
  }, [fetchVerificationData]);

  const handleSave = async () => {
    /* Guest demo: nothing is persisted anywhere, so keep the original local feedback
       and skip the network entirely. */
    if (!guildId) {
      showToast("Verification Gateway settings saved — demo mode", "success");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        /* The save endpoint deliberately does not echo the request body, so never read state
           back off the response. Re-read the real config from GET .../verification instead. */
        try {
          const resConfig = await fetch(`/api/guilds/${guildId}/verification`);
          if (resConfig.ok) {
            const data = await resConfig.json();
            setSettings(mapVerification(data));
          }
        } catch (err) {
          /* Follow-up read failed — keep the locally edited state rather than blanking the form. */
          console.warn("[VerificationModule] Saved, but could not re-read configuration:", err);
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
      color: "#4C7DFF",
      description: "Directs members to a secure web portal for hCaptcha verification — maximum security against automated bot raids.",
    },
    {
      id: "button",
      title: "Interactive Button",
      subtitle: "One-Click Grant",
      icon: MousePointer,
      color: "#34D399",
      description: "Members click a single button inside Discord to acknowledge the rules and unlock access instantly.",
    },
    {
      id: "math",
      title: "Math Challenge",
      subtitle: "Dynamic Equation Prompt",
      icon: Calculator,
      color: "#7C5CFF",
      description: "Members solve an ephemeral math equation within 60 seconds inside the verification channel.",
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

  /* Roving tabindex: the checked option is the group's single tab stop. */
  const selectedModeIndex = Math.max(
    0,
    verificationModes.findIndex((m) => m.id === settings.verificationMode)
  );

  /* Arrow keys move between the options and select the focused one (radiogroup). */
  const handleModeKeyDown = (event, index) => {
    const total = verificationModes.length;
    let nextIndex = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % total;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + total) % total;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = total - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    setSettings((prev) => ({ ...prev, verificationMode: verificationModes[nextIndex].id }));
    const nextOption = modeOptionRefs.current[nextIndex];
    if (nextOption) nextOption.focus();
  };

  if (loading) {
    return (
      <div className="glass-card flex min-h-[400px] flex-col items-center justify-center p-8 text-white">
        <RefreshCw className="mb-4 h-8 w-8 animate-spin text-[#4C7DFF]" />
        <p className="text-sm font-medium text-slate-400">Loading Verification Gateway...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="glass-card relative overflow-hidden p-6 text-white sm:p-8"
    >
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute -top-24 -right-20 h-96 w-96 rounded-full bg-[#7C5CFF]/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-96 w-96 rounded-full bg-[#34D399]/[0.05] blur-3xl" />

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="glass-dropdown pointer-events-none fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-white"
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-[#F87171]" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module header */}
      <motion.div
        variants={rise}
        className="relative z-10 mb-6 flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-center"
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="icon-tile icon-tile-green h-9 w-9 rounded-xl">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="card-title">Verification Gateway</h2>
              <span className={`chip ${settings.verificationEnabled ? "chip-green" : ""}`}>
                {settings.verificationEnabled ? "Verification active" : "Disabled"}
              </span>
            </div>
            <p className="card-sub mt-1">
              Human verification that keeps raid alts and malicious bots out of Crystal Realm.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button type="button"
            onClick={fetchVerificationData}
            className="btn-icon h-9 w-9 rounded-xl"
            title="Reload configuration"
            aria-label="Reload configuration"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>

      {/* Main form grid */}
      <div className="relative z-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Section 1: master toggle & mode selector */}
        <motion.section variants={rise} className="glass-card glass-card-hover space-y-5 p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="icon-tile icon-tile-violet h-9 w-9 rounded-xl">
                <Lock className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="card-title">Captcha Verification Master Switch</h2>
                <p className="card-sub mt-0.5">
                  Require new members to pass human verification before seeing channels
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <Toggle
                enabled={settings.verificationEnabled}
                onChange={(v) => setSettings((prev) => ({ ...prev, verificationEnabled: v }))}
              />
              <span className={`chip ${settings.verificationEnabled ? "chip-green" : ""}`}>
                {settings.verificationEnabled ? "Enforced" : "Off"}
              </span>
            </div>
          </div>

          <div>
            <span className="section-label mb-3 flex items-center gap-2 text-slate-400">
              <Sliders className="h-3.5 w-3.5 text-[#A9C2FF]" />
              Verification Challenge Mode
            </span>

            <div
              role="radiogroup"
              aria-label="Verification Challenge Mode"
              className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3"
            >
              {verificationModes.map((mode, index) => {
                const Icon = mode.icon;
                const isSelected = settings.verificationMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={mode.title}
                    tabIndex={index === selectedModeIndex ? 0 : -1}
                    ref={(el) => {
                      modeOptionRefs.current[index] = el;
                    }}
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, verificationMode: mode.id }))
                    }
                    onKeyDown={(event) => handleModeKeyDown(event, index)}
                    className={`relative block w-full appearance-none cursor-pointer rounded-xl border p-4 text-left text-inherit font-inherit transition-colors ${
                      isSelected
                        ? "border-[#4C7DFF]/45 bg-[#4C7DFF]/[0.10] shadow-[0_12px_30px_rgba(76,125,255,0.18)]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${mode.color}1A`, color: mode.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        aria-hidden="true"
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-[#34D399] bg-[#34D399]/20 text-[#34D399]"
                            : "border-white/[0.12] bg-white/[0.03]"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                    </div>

                    <h3 className="mb-0.5 text-xs font-bold text-white">{mode.title}</h3>
                    <p className="mb-2 font-mono text-[10px] font-bold" style={{ color: mode.color }}>
                      {mode.subtitle}
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-400">{mode.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Section 2: alt-account detection threshold */}
        <motion.section variants={rise} className="glass-card glass-card-hover space-y-5 p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-amber h-9 w-9 rounded-xl">
              <Clock className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="card-title">Alt-Account Age Threshold</h2>
              <p className="card-sub mt-0.5">
                Automatically flag or reject accounts created recently
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="alt-age-limit"
                  className="text-xs font-semibold text-slate-300"
                >
                  Minimum Account Age Limit
                </label>
                <span className="chip chip-amber font-mono">
                  {settings.altAgeLimit === 0 ? "Disabled (0 days)" : `${settings.altAgeLimit} Days Old`}
                </span>
              </div>

              {/* Slider control */}
              <input
                id="alt-age-limit"
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
                className="h-2 w-full cursor-pointer rounded-lg accent-[#FBBF24]"
              />
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {altAgePresets.map((preset) => {
                const isActive = settings.altAgeLimit === preset.days;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, altAgeLimit: preset.days }))
                    }
                    className={`cursor-pointer rounded-xl border px-2 py-2 text-center transition-colors ${
                      isActive
                        ? "border-[#FBBF24]/45 bg-[#FBBF24]/[0.10] text-[#FCD34D]"
                        : "border-white/[0.07] bg-white/[0.02] text-slate-300 hover:border-white/[0.14] hover:text-slate-200"
                    }`}
                  >
                    <div className="font-mono text-xs font-bold">{preset.days}d</div>
                    <div className="mt-0.5 text-[9px] uppercase tracking-wider opacity-80">
                      {preset.badge}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-[#FBBF24]/25 bg-[#FBBF24]/[0.07] p-3.5 text-xs leading-relaxed text-[#FCD34D]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FBBF24]" />
              <span>
                Accounts created less than{" "}
                <strong className="font-mono text-[#FCD34D]">{settings.altAgeLimit} days</strong> ago
                will be required to pass an extra verification step or will be blocked automatically.
              </span>
            </div>
          </div>
        </motion.section>

        {/* Section 3: roles & channel selectors */}
        <motion.section variants={rise} className="glass-card glass-card-hover space-y-5 p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-blue h-9 w-9 rounded-xl">
              <UserCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="card-title">Roles &amp; Channel Gateway Assignment</h2>
              <p className="card-sub mt-0.5">
                Configure roles awarded or removed and the gateway channel
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Verified role selector */}
            <div>
              <label
                htmlFor="verification-role"
                className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300"
              >
                <UserCheck className="h-3.5 w-3.5 text-[#6EE7B7]" />
                Verified Role (Granted upon completion)
              </label>

              {roles.length > 0 ? (
                <select
                  id="verification-role"
                  value={settings.verificationRoleId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, verificationRoleId: e.target.value }))
                  }
                  className={selectCls}
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
                  id="verification-role"
                  type="text"
                  placeholder="Role ID e.g. 1128439813574934590"
                  value={settings.verificationRoleId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, verificationRoleId: e.target.value }))
                  }
                  className={`${fieldCls} font-mono`}
                />
              )}
            </div>

            {/* Unverified role selector */}
            <div>
              <label
                htmlFor="unverified-role"
                className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300"
              >
                <UserX className="h-3.5 w-3.5 text-[#FCA5A5]" />
                Unverified Role (Assigned upon joining)
              </label>

              {roles.length > 0 ? (
                <select
                  id="unverified-role"
                  value={settings.unverifiedRoleId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, unverifiedRoleId: e.target.value }))
                  }
                  className={selectCls}
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
                  id="unverified-role"
                  type="text"
                  placeholder="Role ID e.g. 1128439813574934591"
                  value={settings.unverifiedRoleId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, unverifiedRoleId: e.target.value }))
                  }
                  className={`${fieldCls} font-mono`}
                />
              )}
            </div>

            {/* Gateway channel selector */}
            <div>
              <label
                htmlFor="verification-channel"
                className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300"
              >
                <Hash className="h-3.5 w-3.5 text-[#A9C2FF]" />
                Verification Gateway Channel
              </label>

              {channels.length > 0 ? (
                <select
                  id="verification-channel"
                  value={settings.verificationChannelId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, verificationChannelId: e.target.value }))
                  }
                  className={selectCls}
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
                  id="verification-channel"
                  type="text"
                  placeholder="Channel ID e.g. 1128439813574934600"
                  value={settings.verificationChannelId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, verificationChannelId: e.target.value }))
                  }
                  className={`${fieldCls} font-mono`}
                />
              )}
            </div>
          </div>
        </motion.section>

        {/* Section 4: interactive verification panel live preview */}
        <motion.section variants={rise} className="glass-card glass-card-hover space-y-5 p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="icon-tile icon-tile-violet h-9 w-9 rounded-xl">
                <Eye className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="card-title">Interactive Verification Panel Live Preview</h2>
                <p className="card-sub mt-0.5">
                  Live preview card of the verification message posted in your Discord channel
                </p>
              </div>
            </div>

            <span className="chip chip-violet uppercase tracking-wider">Discord embed preview</span>
          </div>

          {/* Discord message preview frame */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#313338] p-4 text-left font-sans shadow-2xl sm:p-5">
            <div className="flex items-start gap-3">
              {/* Bot avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4C7DFF] to-[#7C5CFF] shadow-md">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>

              <div className="min-w-0 flex-1">
                {/* Bot header */}
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Aura Security Gate</span>
                  <span className="rounded bg-[#3A62E0] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white ring-1 ring-inset ring-white/30">
                    BOT
                  </span>
                  <span className="text-xs text-zinc-400">Today at 12:00 PM</span>
                </div>

                {/* Discord embed box */}
                <div className="mt-2 space-y-3 rounded-lg border-l-4 border-l-[#34D399] bg-[#2b2d31] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                      🛡️ Server Security Verification
                    </h3>
                    <span className="chip chip-green font-mono">
                      {settings.verificationMode.toUpperCase()} GATEWAY
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-zinc-300">
                    Welcome to Crystal Realm! To prevent raid bots and automated spam, please verify your account.
                    {settings.altAgeLimit > 0 && (
                      <span className="mt-1 block text-[11px] text-[#FCD34D]/90">
                        ⚡ Note: Accounts younger than {settings.altAgeLimit} days require identity verification.
                      </span>
                    )}
                  </p>

                  <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-2 text-[11px] text-zinc-400">
                    <span>Aura Security Gateway • Verification Gate</span>
                    <span className="flex items-center gap-1 text-[#34D399]">
                      <CheckCircle2 className="h-3 w-3" /> System Operational
                    </span>
                  </div>
                </div>

                {/* Interactive action button row */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {settings.verificationMode === "web" && (
                    <button type="button"
                      onClick={openTestModal}
                      className="flex cursor-pointer items-center gap-2 rounded-md bg-[#3A62E0] px-4 py-2 text-xs font-medium text-white shadow-md ring-1 ring-inset ring-white/30 transition-all hover:opacity-90"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Verify via Web Portal
                    </button>
                  )}

                  {settings.verificationMode === "button" && (
                    <button type="button"
                      onClick={openTestModal}
                      className="flex cursor-pointer items-center gap-2 rounded-md bg-[#34D399] px-4 py-2 text-xs font-bold text-[#06120C] shadow-md transition-all hover:opacity-90"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Click to Verify
                    </button>
                  )}

                  {settings.verificationMode === "math" && (
                    <button type="button"
                      onClick={openTestModal}
                      className="flex cursor-pointer items-center gap-2 rounded-md bg-[#7049F5] px-4 py-2 text-xs font-medium text-white shadow-md ring-1 ring-inset ring-white/30 transition-all hover:opacity-90"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      Solve Math Challenge
                    </button>
                  )}

                  <span className="text-[11px] italic text-zinc-400">
                    (Click button to test interactive user flow)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Interactive verification test simulation modal */}
      <AnimatePresence>
        {testModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-scrim fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-surface relative w-full max-w-md p-6 shadow-2xl"
            >
              <button type="button"
                onClick={() => setTestModalOpen(false)}
                className="btn-icon absolute right-4 top-4 h-9 w-9 rounded-xl"
                aria-label="Close interactive preview"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 flex items-center gap-3">
                <span className="icon-tile icon-tile-green h-9 w-9 rounded-xl">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="card-title">
                    {settings.verificationMode === "web" && "Web Captcha Gateway Simulation"}
                    {settings.verificationMode === "button" && "One-Click Verification Test"}
                    {settings.verificationMode === "math" && "Math Challenge Verification"}
                  </h3>
                  <p className="card-sub">Interactive preview simulation</p>
                </div>
              </div>

              {settings.verificationMode === "web" && (
                <div className="space-y-4 py-2">
                  <div className="rounded-xl border border-[#4C7DFF]/25 bg-[#4C7DFF]/[0.08] p-4 text-xs leading-relaxed text-slate-300">
                    🌐 <strong className="text-[#A9C2FF]">Web Captcha Flow:</strong> Users click the
                    link to be securely redirected to an OAuth + hCaptcha page. Upon passing
                    hCaptcha, the bot assigns the Verified Role automatically.
                  </div>
                  <button type="button"
                    onClick={() => setTestResult("success")}
                    className="btn-primary w-full"
                  >
                    Simulate hCaptcha Solved Pass ✅
                  </button>
                </div>
              )}

              {settings.verificationMode === "button" && (
                <div className="space-y-4 py-2">
                  <div className="rounded-xl border border-[#34D399]/25 bg-[#34D399]/[0.08] p-4 text-xs leading-relaxed text-slate-300">
                    ✅ <strong className="text-[#6EE7B7]">One-Click Flow:</strong> User clicks the
                    button, the bot immediately grants role{" "}
                    <code className="font-mono text-[#6EE7B7]">
                      @{roles.find((r) => r.id === settings.verificationRoleId)?.name || "Verified"}
                    </code>
                    .
                  </div>
                  <button type="button"
                    onClick={() => setTestResult("success")}
                    className="btn-primary w-full"
                  >
                    Simulate Button Verification ✅
                  </button>
                </div>
              )}

              {settings.verificationMode === "math" && (
                <form onSubmit={handleTestSubmit} className="space-y-4 py-2">
                  <div className="space-y-2 rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/[0.08] p-4 text-center">
                    <label
                      htmlFor="math-challenge-answer"
                      className="block text-xs font-medium text-slate-300"
                    >
                      Solve the equation to verify:
                    </label>
                    <div className="rounded-lg border border-[#7C5CFF]/25 bg-white/[0.03] py-2 font-mono text-2xl font-bold tracking-widest text-white">
                      {testMath.a} + {testMath.b} = ?
                    </div>
                  </div>

                  <input
                    id="math-challenge-answer"
                    type="number"
                    placeholder="Enter the sum..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className={`${fieldCls} text-center font-mono`}
                    autoFocus
                  />

                  <button
                    type="submit"
                    className="btn-primary w-full"
                  >
                    Submit Answer
                  </button>
                </form>
              )}

              {/* Simulation result feedback */}
              {testResult === "success" && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#34D399]/30 bg-[#34D399]/[0.08] p-3 text-xs text-[#6EE7B7]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#34D399]" />
                  <span>Verified! The member is unlocked and the verified role was assigned.</span>
                </div>
              )}

              {testResult === "error" && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#F87171]/30 bg-[#F87171]/[0.08] p-3 text-xs text-[#FCA5A5]">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-[#F87171]" />
                  <span>Incorrect answer! Please try again.</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
