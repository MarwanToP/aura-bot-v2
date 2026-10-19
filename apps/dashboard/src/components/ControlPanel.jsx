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
  auth: { label: "Auth", color: "#5B8CFF" },
  config: { label: "Config", color: "#7C5CFF" },
  mod: { label: "Moderation", color: "#FFB547" },
  system: { label: "System", color: "#39D98A" },
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
              <Folder className="h-4 w-4" />
            </span>
            Control Panel & Mod Actions
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Dashboard audit logs, configuration changes, and moderator action history.
          </p>
        </div>
      </motion.div>

      <motion.div variants={rise} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Control panel logs */}
        <section className="panel panel-hover relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 p-5 pb-4">
            <span className="w-9 h-9 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/25 flex items-center justify-center text-[#7C5CFF] shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white">Control Panel Logs</h3>
              <p className="text-xs text-slate-500 mt-0.5">Most recent dashboard activity</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold text-[#39D98A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39D98A] animate-pulse-dot" />
              LIVE
            </span>
          </div>

          <div className="divide-y divide-white/[0.04] border-t border-white/[0.04]">
            {CONTROL_LOGS.map((log, i) => {
              const meta = TYPE_META[log.type] || TYPE_META.system;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.06, duration: 0.35, ease: EASE }}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                  >
                    <Activity className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-bold text-white">{log.action}</span>
                      <span className="text-[10px] text-slate-500">by {log.user}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{log.detail}</p>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono shrink-0 whitespace-nowrap">{log.time}</span>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Mod actions */}
        <section className="panel panel-hover relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 p-5 pb-4">
            <span className="w-9 h-9 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/25 flex items-center justify-center text-[#7C5CFF] shrink-0">
              <Scale className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white">Mod Actions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Bulk tools for the moderation team</p>
            </div>
          </div>

          <div className="divide-y divide-white/[0.04] border-t border-white/[0.04]">
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
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 text-[#7C5CFF]">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-white truncate">{item.action}</span>
                    <span className="block text-[10px] text-slate-500 truncate">{item.desc}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                </motion.button>
              );
            })}
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
}
