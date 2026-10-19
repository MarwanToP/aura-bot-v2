"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardDrive, Save, Download, RotateCcw, CheckCircle2, Clock, Shield } from "lucide-react";

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

/* ────────────────────────────── helpers ────────────────────────────── */

function timeAgo(ms) {
  const minutes = Math.max(0, Math.floor((Date.now() - ms) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  const h = minutes / 60;
  if (h < 24) return `${h < 10 ? h.toFixed(1) : Math.round(h)}h ago`;
  const d = Math.round(h / 24);
  return d < 14 ? `${d}d ago` : `${Math.round(d / 7)}w ago`;
}

/* ────────────────────────────── world data ────────────────────────────── */

const INITIAL_BACKUPS = [
  {
    id: "1042",
    name: "Crystal Realm · Full Snapshot",
    created: Date.now() - 26 * 60 * 60 * 1000,
    channels: 24,
    roles: 16,
    categories: 5,
    size: "2.4 MB",
    by: "Aurora",
  },
  {
    id: "1041",
    name: "Crystal Realm · Pre-Event Snapshot",
    created: Date.now() - 3 * 24 * 60 * 60 * 1000,
    channels: 24,
    roles: 16,
    categories: 5,
    size: "2.3 MB",
    by: "Kai",
  },
  {
    id: "1040",
    name: "Crystal Realm · Weekly Snapshot",
    created: Date.now() - 12 * 24 * 60 * 60 * 1000,
    channels: 23,
    roles: 15,
    categories: 5,
    size: "2.2 MB",
    by: "Aurora",
  },
];

export default function BackupSettings() {
  const [creating, setCreating] = useState(false);
  const [backups, setBackups] = useState(INITIAL_BACKUPS);
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  const createBackup = () => {
    if (creating) return;
    setCreating(true);
    setTimeout(() => {
      const id = String(1043 + (backups.length - INITIAL_BACKUPS.length));
      const snapshot = {
        id,
        name: "Crystal Realm · Manual Snapshot",
        created: Date.now(),
        channels: 24,
        roles: 16,
        categories: 5,
        size: "2.4 MB",
        by: "You",
      };
      setBackups((list) => [snapshot, ...list]);
      setCreating(false);
      showToast(`Backup complete — snapshot #${id} stored`);
    }, 1600);
  };

  const lastBackup = backups[0];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="glass-dropdown fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-white shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-violet h-10 w-10 rounded-[14px]">
            <HardDrive className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[17px]">Server Backups</h2>
            <p className="card-sub mt-1 max-w-xl">
              Full snapshots of Crystal Realm — channels, roles, permissions, and settings, restorable
              in one click.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="chip chip-amber">
            <Shield className="h-3 w-3" /> Premium
          </span>
          <button type="button" onClick={createBackup} disabled={creating} className="btn-primary">
            {creating ? (
              <RotateCcw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {creating ? "Creating…" : "Create backup"}
          </button>
        </div>
      </motion.div>

      <motion.div variants={rise} className="grid gap-4 lg:grid-cols-3">
        {/* Backup info */}
        <section className="glass-card rounded-[20px] p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-blue h-10 w-10 rounded-[14px]">
              <Shield className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Backup Info</h3>
              <p className="card-sub mt-0.5">Retention and restore limits.</p>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              <span className="text-[11px] text-slate-400">Total backups</span>
              <span className="text-xs font-bold text-white tabular-nums">{backups.length}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              <span className="text-[11px] text-slate-400">Last backup</span>
              <span className="text-xs font-bold text-white">
                {lastBackup ? timeAgo(lastBackup.created) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              <span className="text-[11px] text-slate-400">Restore limit</span>
              <span className="text-xs font-bold text-white">5/day</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              <span className="text-[11px] text-slate-400">Retention</span>
              <span className="text-xs font-bold text-white">30 days</span>
            </div>
          </div>
        </section>

        {/* Backup history */}
        <section className="glass-card overflow-hidden rounded-[20px] lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile-violet h-10 w-10 rounded-[14px]">
                <Clock className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Backup History</h3>
                <p className="card-sub mt-0.5">Restore or grab an archive of any snapshot.</p>
              </div>
            </div>
            <span className="chip chip-blue">{backups.length} snapshots</span>
          </div>

          {backups.length === 0 ? (
            <div className="p-5">
              <div className="empty-state">
                <span className="empty-state-icon">
                  <HardDrive className="h-5 w-5" />
                </span>
                <p className="empty-state-title">No backups yet</p>
                <p className="text-[11px] text-slate-500">
                  Create a snapshot to protect channels, roles, and settings.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-white/[0.04]">
              {backups.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-xs font-bold text-white">{b.name}</span>
                      <span className="chip font-mono">#{b.id}</span>
                      <span className="text-[10px] font-mono text-slate-500">{b.size}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        {timeAgo(b.created)}
                      </span>
                      <span className="text-[10px] text-slate-500">{b.channels} channels</span>
                      <span className="text-[10px] text-slate-500">{b.roles} roles</span>
                      <span className="text-[10px] text-slate-600">by {b.by}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => showToast(`Restore queued — ${b.name} rolling back Crystal Realm`)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-3 py-1.5 text-[10px] font-bold text-[#6EE7B7] transition-colors hover:bg-[#34D399]/20 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" /> Restore
                    </button>
                    <span
                      title="Archive files are stored by the bot — restore is what this panel offers"
                      className="inline-flex"
                    >
                      <button
                        type="button"
                        disabled
                        aria-label="Download archive (unavailable)"
                        className="btn-icon h-8 w-8 cursor-not-allowed opacity-40"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </motion.div>
    </motion.div>
  );
}
