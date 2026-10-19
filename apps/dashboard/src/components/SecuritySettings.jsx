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
  "w-16 bg-white/[0.03] border border-white/[0.08] rounded-lg px-2.5 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-[#7C5CFF]/50 transition-colors";

const btnPrimary =
  "inline-flex items-center gap-2 bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] cursor-pointer";

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors ${
        enabled ? "border-[#7C5CFF]/50 bg-[#7C5CFF]/80" : "border-white/[0.08] bg-white/[0.05]"
      }`}
      aria-pressed={enabled}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow ${
          enabled ? "left-[25px]" : "left-[3px]"
        }`}
      />
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
            className="fixed bottom-6 right-6 z-[90] panel px-4 py-3 flex items-center gap-2.5 text-xs font-semibold shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="w-4 h-4 text-[#39D98A]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            Security Shield & Anti-Nuke Control
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Enterprise defense for Crystal Realm — unauthorized bot invites, mass deletions, raids, and rogue admin actions.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#39D98A]/25 bg-[#39D98A]/10 px-2.5 py-1 text-[10px] font-bold text-[#39D98A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#39D98A] animate-pulse-dot" />
          SHIELD ACTIVE
        </span>
      </motion.div>

      {/* Main settings grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Anti-Nuke & mass action protection */}
        <motion.section variants={rise} className="panel panel-hover p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#FF5C7A]/25 bg-[#FF5C7A]/10 text-[#FF5C7A]">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">Anti-Nuke Protection</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Automatically bans admins who attempt mass destruction.
                </p>
              </div>
            </div>
            <Toggle enabled={antiNuke} onChange={setAntiNuke} />
          </div>

          <div className="mt-4 space-y-2.5 text-xs font-medium">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
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

            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
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

            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
              <span className="flex items-center gap-2 text-slate-300">
                <Bot className="h-3.5 w-3.5 shrink-0 text-[#FF5C7A]" />
                Block unauthorized bot additions
              </span>
              <Toggle enabled={antiBotJoin} onChange={setAntiBotJoin} />
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#FFB547]/20 bg-[#FFB547]/[0.06] p-3 text-[11px] leading-relaxed text-[#FFB547]/90">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FFB547]" />
            <span>
              Violations quarantine the offender instantly and alert the @Admin Council in #mod-logs.
            </span>
          </div>
        </motion.section>

        {/* Captcha verification gate */}
        <motion.section variants={rise} className="panel panel-hover p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#5B8CFF]/25 bg-[#5B8CFF]/10 text-[#5B8CFF]">
                <Key className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">Captcha Verification Gate</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Require a web or button captcha before unlocking channels.
                </p>
              </div>
            </div>
            <Toggle enabled={captchaGate} onChange={setCaptchaGate} />
          </div>

          <div className="mt-4 space-y-2.5 text-xs font-medium">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
              <label htmlFor="min-account-age" className="flex items-center gap-2 text-slate-300">
                <Clock className="h-3.5 w-3.5 shrink-0 text-[#5B8CFF]" />
                Minimum account age (days)
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

            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
              <label htmlFor="quarantine-role" className="flex items-center gap-2 text-slate-300">
                <UserX className="h-3.5 w-3.5 shrink-0 text-[#5B8CFF]" />
                Quarantine role name
              </label>
              <input
                id="quarantine-role"
                name="quarantineRole"
                type="text"
                value={quarantineRole}
                onChange={(e) => setQuarantineRole(e.target.value)}
                className="w-32 bg-white/[0.03] border border-white/[0.08] rounded-lg px-2.5 py-1 font-mono text-xs text-[#7C5CFF] focus:outline-none focus:border-[#7C5CFF]/50 transition-colors"
              />
            </div>
          </div>

          <p className="mt-3 text-[10px] text-slate-600">
            New joiners stay locked until they pass the gate in #support-desk.
          </p>
        </motion.section>
      </div>

      {/* Action footer */}
      <motion.div variants={rise} className="flex justify-end border-t border-white/[0.06] pt-4">
        <button
          type="button"
          onClick={() => showToast("Security settings saved — Crystal Realm is protected")}
          className={btnPrimary}
        >
          <Save className="h-3.5 w-3.5" />
          Save Security Settings
        </button>
      </motion.div>
    </motion.div>
  );
}
