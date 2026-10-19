"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  Scale,
  FileText,
  Activity,
  Terminal,
  CheckCircle2,
  ChevronRight,
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

/* ────────────────────────────── data ────────────────────────────── */

const TYPE_META = {
  auth: { label: "Auth", color: "#4C7DFF", chip: "chip-blue" },
  config: { label: "Config", color: "#7C5CFF", chip: "chip-violet" },
  mod: { label: "Moderation", color: "#FBBF24", chip: "chip-amber" },
  system: { label: "System", color: "#34D399", chip: "chip-green" },
};

const CONTROL_LOGS = [
  { id: 1, action: "Dashboard login", user: "Aurora", detail: "New sign-in — Chrome on Windows", time: "2h ago", type: "auth" },
  { id: 2, action: "Welcome message updated", user: "Kai", detail: "Greeting refreshed in #general", time: "5h ago", type: "config" },
  { id: 3, action: "Leveling module disabled", user: "Kai", detail: "XP gain paused during event week", time: "1d ago", type: "config" },
  { id: 4, action: "Config backup created", user: "Aura", detail: "Snapshot #1042 — Crystal Realm settings", time: "2d ago", type: "system" },
  { id: 5, action: "/ban restricted", user: "Aurora", detail: "Locked to @Moderator in #general", time: "3d ago", type: "mod" },
];

const MOD_ACTIONS = [
  { action: "Mass Ban Recovery", desc: "Review and restore incorrectly banned members", icon: Scale, toast: "Ban recovery scan queued — 3 cases flagged for review" },
  { action: "Warning Review", desc: "Resolve the 6 active warnings across Crystal Realm", icon: FileText, toast: "Warning review opened — 6 active warnings" },
  { action: "Moderator Activity", desc: "Track Aurora and Kai's duty hours this week", icon: Activity, toast: "Moderator activity report generated" },
  { action: "Audit Log Export", desc: "Download the last 90 days of audit trail as JSON", icon: Terminal, toast: "Audit log export started — download link on the way" },
];

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function ControlPanel() {
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
            className="panel fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display flex items-center gap-3 text-lg font-extrabold tracking-tight text-white">
            <span className="icon-tile icon-tile-violet h-9 w-9 rounded-xl">
              <Folder className="h-4 w-4" />
            </span>
            Control Panel &amp; Mod Actions
          </h2>
          <p className="mt-2 font-body text-xs text-slate-400">
            Dashboard audit logs, configuration changes, and moderator action history.
          </p>
        </div>
        <span className="chip chip-green">
          <span className="status-dot status-dot-online animate-pulse-dot h-1.5 w-1.5" />
          All systems monitored
        </span>
      </motion.div>

      <motion.div variants={rise} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Control panel logs */}
        <section className="panel panel-hover relative flex flex-col overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-14 h-48 w-48 rounded-full bg-[#4C7DFF]/[0.07] blur-3xl" />

          <div className="relative flex items-center gap-3 p-5 pb-4">
            <span className="icon-tile icon-tile-blue h-9 w-9 rounded-xl">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Control Panel Logs</h3>
              <p className="card-sub mt-0.5">Most recent dashboard activity</p>
            </div>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-[10px] font-bold text-[#34D399]">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#34D399]" />
              LIVE
            </span>
          </div>

          <div className="hairline mx-5" />

          <div className="relative flex flex-col gap-0.5 p-3 pt-2">
            {CONTROL_LOGS.map((log, i) => {
              const meta = TYPE_META[log.type] || TYPE_META.system;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.06, duration: 0.35, ease: EASE }}
                  className="list-row items-start px-2.5 py-2.5"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] border"
                    style={{
                      backgroundColor: `${meta.color}1A`,
                      borderColor: `${meta.color}3D`,
                      color: meta.color,
                    }}
                  >
                    <Activity className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-bold text-white">{log.action}</span>
                      <span className="text-[10px] text-slate-500">by {log.user}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">{log.detail}</p>
                  </div>
                  <span className={`chip ${meta.chip} hidden shrink-0 sm:inline-flex`}>{meta.label}</span>
                  <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-slate-600">
                    {log.time}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Mod actions */}
        <section className="panel panel-hover relative flex flex-col overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -left-14 h-48 w-48 rounded-full bg-[#7C5CFF]/[0.08] blur-3xl" />

          <div className="relative flex items-center gap-3 p-5 pb-4">
            <span className="icon-tile icon-tile-violet h-9 w-9 rounded-xl">
              <Scale className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Mod Actions</h3>
              <p className="card-sub mt-0.5">Bulk tools for the moderation team</p>
            </div>
          </div>

          <div className="hairline mx-5" />

          <div className="relative flex flex-col gap-0.5 p-3 pt-2">
            {MOD_ACTIONS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.action}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.06, duration: 0.35, ease: EASE }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => showToast(item.toast)}
                  className="list-row w-full cursor-pointer text-left"
                >
                  <span className="icon-tile icon-tile-amber h-8 w-8 rounded-[11px]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-white">{item.action}</span>
                    <span className="block truncate text-[10.5px] text-slate-500">{item.desc}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
                </motion.button>
              );
            })}
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
}
