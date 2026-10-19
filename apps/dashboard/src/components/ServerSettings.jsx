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

const inputCls =
  "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C5CFF]/50 transition-colors";

const selectCls = `${inputCls} cursor-pointer [&>option]:bg-[#12141B]`;

const btnPrimary =
  "inline-flex items-center gap-2 bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] cursor-pointer";

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
            className="panel fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="h-4 w-4 text-[#39D98A]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <Settings className="h-4 w-4" />
            </span>
            Server Settings
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Global preferences applied across {guilds.length > 0 ? `the ${guilds.length} communities` : "the communities"} Aura manages — prefix, language, and timezone.
          </p>
        </div>
        <button
          type="button"
          onClick={() => showToast("Settings saved — prefix and locale updated")}
          className={btnPrimary}
        >
          <Save className="h-3.5 w-3.5" /> Save changes
        </button>
      </motion.div>

      {/* Panels */}
      <motion.div variants={rise} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="panel panel-hover p-5">
          <div className="flex items-center gap-2.5">
            <Hash className="h-4 w-4 text-[#7C5CFF]" />
            <h3 className="text-sm font-bold text-white">Bot Configuration</h3>
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

        <section className="panel panel-hover p-5">
          <div className="flex items-center gap-2.5">
            <Globe className="h-4 w-4 text-[#7C5CFF]" />
            <h3 className="text-sm font-bold text-white">Regional</h3>
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

            <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <Clock className="h-4 w-4 shrink-0 text-[#7C5CFF]" />
              <span className="text-xs text-slate-400">
                Server local time:{" "}
                <span className="font-semibold text-white">{new Date().toLocaleString()}</span>
              </span>
            </div>
          </div>
        </section>
      </motion.div>

      {/* Fleet strip */}
      <motion.div variants={rise} className="panel flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#39D98A] animate-pulse-dot" />
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
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#7C5CFF]/20 text-[9px] font-bold text-[#7C5CFF]">
                  {(s.name?.[0] || "#").toUpperCase()}
                </span>
              )}
              <span className="text-slate-400">{s.name}</span>
              <span className="font-bold text-slate-200 font-mono tabular-nums">
                {s.emoji
                  ? s.members
                  : typeof s.memberCount === "number"
                    ? s.memberCount.toLocaleString()
                    : "—"}
              </span>
            </span>
          ))}
        </div>
        <span className="ml-auto hidden text-[11px] text-slate-500 font-body md:block">
          {guilds.length > 0
            ? `All ${guilds.length} server${guilds.length === 1 ? "" : "s"} `
            : "All four servers "}
          <span className="font-semibold text-[#39D98A]">online</span>.
        </span>
      </motion.div>
    </motion.div>
  );
}
