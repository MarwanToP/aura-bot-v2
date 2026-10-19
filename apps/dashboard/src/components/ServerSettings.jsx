"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Globe, Hash, Clock, Save, CheckCircle2 } from "lucide-react";

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

const inputCls = "glass-input";

const selectCls = "glass-select";

/* ────────────────────────────── world data ────────────────────────────── */

const FLEET = [
  { name: "Crystal Realm", emoji: "🔮", members: "12,645" },
  { name: "Dev Hub & Gaming", emoji: "⚡", members: "14,210" },
  { name: "Community Lounge", emoji: "💬", members: "4,890" },
  { name: "Support Central", emoji: "🎧", members: "2,150" },
];

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="section-label mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

export default function ServerSettings({ guilds = [] }) {
  const [prefix, setPrefix] = useState("!");
  const [lang, setLang] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  // Live guilds come from the dashboard API; fall back to the demo fleet in guest mode.
  const fleet = guilds.length > 0 ? guilds : FLEET;

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
          <span className="icon-tile icon-tile-violet h-9 w-9 rounded-xl">
            <Settings className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title">Server Settings</h2>
            <p className="card-sub mt-0.5">
              Global preferences applied across{" "}
              {guilds.length > 0 ? `the ${guilds.length} communities` : "the communities"} Aura
              manages — prefix, language, and timezone.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => showToast("Settings saved — prefix and locale updated")}
          className="btn-primary"
        >
          <Save className="h-3.5 w-3.5" /> Save changes
        </button>
      </motion.div>

      {/* Panels */}
      <motion.div variants={rise} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="glass-card glass-card-hover p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-violet h-8 w-8 rounded-lg">
              <Hash className="h-4 w-4" />
            </span>
            <h3 className="card-title">Bot Configuration</h3>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Command Prefix">
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                maxLength={3}
                className={`${inputCls} w-20 text-center font-mono`}
              />
            </Field>

            <Field label="Default Language">
              <select value={lang} onChange={(e) => setLang(e.target.value)} className={selectCls}>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="ar">العربية</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="glass-card glass-card-hover p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-cyan h-8 w-8 rounded-lg">
              <Globe className="h-4 w-4" />
            </span>
            <h3 className="card-title">Regional</h3>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Timezone">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={selectCls}
              >
                <option value="UTC">UTC</option>
                <option value="US/Eastern">US/Eastern</option>
                <option value="US/Pacific">US/Pacific</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </Field>

            <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              <span className="icon-tile icon-tile-cyan h-8 w-8 rounded-lg">
                <Clock className="h-4 w-4" />
              </span>
              <span className="text-xs text-slate-400">
                Server local time:{" "}
                <span className="font-semibold text-white">{new Date().toLocaleString()}</span>
              </span>
            </div>
          </div>
        </section>
      </motion.div>

      {/* Fleet strip */}
      <motion.div
        variants={rise}
        className="glass-card flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3"
      >
        <span className="inline-flex items-center gap-2">
          <span className="status-dot status-dot-online animate-pulse-dot" />
          <span className="section-label">Aura Fleet</span>
        </span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {fleet.map((s) => (
            <span key={s.id ?? s.name} className="inline-flex items-center gap-1.5 text-[11px]">
              {s.emoji ? (
                <span>{s.emoji}</span>
              ) : s.icon ? (
                <img
                  src={`https://cdn.discordapp.com/icons/${s.id}/${s.icon}.png?size=64`}
                  alt=""
                  className="h-4 w-4 shrink-0 rounded-full"
                />
              ) : (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#7C5CFF]/20 text-[9px] font-bold text-[#C4B5FD]">
                  {(s.name?.[0] || "#").toUpperCase()}
                </span>
              )}
              <span className="text-slate-400">{s.name}</span>
              <span className="font-mono font-bold tabular-nums text-slate-200">
                {s.emoji
                  ? s.members
                  : typeof s.memberCount === "number"
                    ? s.memberCount.toLocaleString()
                    : "—"}
              </span>
            </span>
          ))}
        </div>
        <span className="ml-auto hidden text-[11px] font-body text-slate-500 md:block">
          {guilds.length > 0
            ? `All ${guilds.length} server${guilds.length === 1 ? "" : "s"} `
            : "All four servers "}
          <span className="font-semibold text-[#6EE7B7]">online</span>.
        </span>
      </motion.div>
    </motion.div>
  );
}
