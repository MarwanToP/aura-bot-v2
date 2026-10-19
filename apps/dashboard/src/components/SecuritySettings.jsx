"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Bot,
  UserX,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Save,
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

const numberCls =
  "glass-input w-20 px-2 py-1.5 text-center font-mono text-xs text-white";

const rowCls =
  "flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3";

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

export default function SecuritySettings({ guildId = "1" }) {
  const [antiNuke, setAntiNuke] = useState(true);
  const [captchaGate, setCaptchaGate] = useState(true);
  const [minAccountAge, setMinAccountAge] = useState(7);
  const [antiBotJoin, setAntiBotJoin] = useState(true);
  const [massBanLimit, setMassBanLimit] = useState(5);
  const [massRoleDeleteLimit, setMassRoleDeleteLimit] = useState(3);
  const [quarantineRole, setQuarantineRole] = useState("@Quarantine");
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="glass-dropdown pointer-events-none fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-white"
          >
            <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="icon-tile icon-tile-green h-9 w-9 rounded-xl">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title">Security Shield &amp; Anti-Nuke Control</h2>
            <p className="card-sub mt-0.5">
              Enterprise defense for Crystal Realm — unauthorized bot invites, mass deletions, raids,
              and rogue admin actions.
            </p>
          </div>
        </div>
        <span className="chip chip-green">
          <span className="status-dot status-dot-online animate-pulse-dot" />
          Shield active
        </span>
      </motion.div>

      {/* Main settings grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Anti-Nuke & mass action protection */}
        <motion.section variants={rise} className="glass-card glass-card-hover p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="icon-tile icon-tile-red h-9 w-9 rounded-xl">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Anti-Nuke Protection</h3>
                <p className="card-sub mt-0.5">
                  Automatically bans admins who attempt mass destruction.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Toggle enabled={antiNuke} onChange={(v) => setAntiNuke(v)} />
              <span className={`chip ${antiNuke ? "chip-green" : "chip-amber"}`}>
                {antiNuke ? "Protected" : "Paused"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 text-xs font-medium">
            <div className={rowCls}>
              <label htmlFor="mass-ban-limit" className="text-slate-300">
                Mass ban threshold <span className="text-slate-600">(per 10 sec)</span>
              </label>
              <input
                id="mass-ban-limit"
                name="massBanLimit"
                type="number"
                min="1"
                value={massBanLimit}
                onChange={(e) => setMassBanLimit(Number(e.target.value))}
                className={numberCls}
              />
            </div>

            <div className={rowCls}>
              <label htmlFor="mass-role-limit" className="text-slate-300">
                Mass role delete limit
              </label>
              <input
                id="mass-role-limit"
                name="massRoleDeleteLimit"
                type="number"
                min="1"
                value={massRoleDeleteLimit}
                onChange={(e) => setMassRoleDeleteLimit(Number(e.target.value))}
                className={numberCls}
              />
            </div>

            <div className={rowCls}>
              <span className="flex items-center gap-2 text-slate-300">
                <Bot className="h-3.5 w-3.5 shrink-0 text-[#F87171]" />
                Block unauthorized bot additions
                <span className={`chip ${antiBotJoin ? "chip-green" : "chip-amber"}`}>
                  {antiBotJoin ? "Blocking" : "Allowed"}
                </span>
              </span>
              <Toggle enabled={antiBotJoin} onChange={(v) => setAntiBotJoin(v)} />
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#FBBF24]/25 bg-[#FBBF24]/[0.07] p-3 text-[11px] leading-relaxed text-[#FCD34D]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FBBF24]" />
            <span>
              Violations quarantine the offender instantly and alert the @Admin Council in #mod-logs.
            </span>
          </div>
        </motion.section>

        {/* Captcha verification gate */}
        <motion.section variants={rise} className="glass-card glass-card-hover p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="icon-tile icon-tile-blue h-9 w-9 rounded-xl">
                <Key className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Captcha Verification Gate</h3>
                <p className="card-sub mt-0.5">
                  Require a web or button captcha before unlocking channels.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Toggle enabled={captchaGate} onChange={(v) => setCaptchaGate(v)} />
              <span className={`chip ${captchaGate ? "chip-green" : "chip-amber"}`}>
                {captchaGate ? "Enforced" : "Off"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 text-xs font-medium">
            <div className={rowCls}>
              <label
                htmlFor="min-account-age"
                className="flex items-center gap-2 text-slate-300"
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-[#4C7DFF]" />
                Minimum account age (days)
                <span className="chip chip-blue">{minAccountAge}d</span>
              </label>
              <input
                id="min-account-age"
                name="minAccountAge"
                type="number"
                min="0"
                value={minAccountAge}
                onChange={(e) => setMinAccountAge(Number(e.target.value))}
                className={numberCls}
              />
            </div>

            <div className={rowCls}>
              <label
                htmlFor="quarantine-role"
                className="flex items-center gap-2 text-slate-300"
              >
                <UserX className="h-3.5 w-3.5 shrink-0 text-[#4C7DFF]" />
                Quarantine role name
              </label>
              <input
                id="quarantine-role"
                name="quarantineRole"
                type="text"
                value={quarantineRole}
                onChange={(e) => setQuarantineRole(e.target.value)}
                className="glass-input w-32 px-2.5 py-1.5 font-mono text-xs text-[#C4B5FD]"
              />
            </div>
          </div>

          <p className="mt-3 text-[10px] text-slate-500">
            New joiners stay locked until they pass the gate in #support-desk.
          </p>
        </motion.section>
      </div>

      {/* Action footer */}
      <motion.div variants={rise} className="flex justify-end border-t border-white/[0.06] pt-4">
        <button
          type="button"
          onClick={() => showToast("Security settings saved — Crystal Realm is protected")}
          className="btn-primary"
        >
          <Save className="h-3.5 w-3.5" />
          Save Security Settings
        </button>
      </motion.div>
    </motion.div>
  );
}
