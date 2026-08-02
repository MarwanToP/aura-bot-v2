"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { HardDrive, Save, Download, RotateCcw, Check, Clock, Shield } from "lucide-react";

const BACKUPS = [
  { id: '1042', name: 'Full Server Snapshot #1042', created: new Date(Date.now() - 86400000).toISOString(), channels: 24, roles: 16, categories: 5, size: '2.4 MB' },
  { id: '1041', name: 'Full Server Snapshot #1041', created: new Date(Date.now() - 604800000).toISOString(), channels: 24, roles: 16, categories: 5, size: '2.3 MB' },
  { id: '1040', name: 'Full Server Snapshot #1040', created: new Date(Date.now() - 2592000000).toISOString(), channels: 23, roles: 15, categories: 5, size: '2.2 MB' },
];

export default function BackupSettings() {
  const [creating, setCreating] = useState(false);

  const createBackup = () => {
    setCreating(true);
    setTimeout(() => setCreating(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-purple-400" />
            Server Backups
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Full server snapshots — channels, roles, permissions, and settings.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">PREMIUM</span>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={createBackup}
            className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2">
            {creating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {creating ? 'Creating...' : 'Create Backup'}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><Shield className="w-4 h-4 text-purple-400" /> Backup Info</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
              <span className="text-[11px] text-zinc-400">Total Backups</span>
              <span className="text-xs font-bold text-white">{BACKUPS.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
              <span className="text-[11px] text-zinc-400">Last Backup</span>
              <span className="text-xs font-bold text-white">{new Date(BACKUPS[0].created).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
              <span className="text-[11px] text-zinc-400">Restore Limit</span>
              <span className="text-xs font-bold text-white">5/day</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white">Backup History</h3>
          <div className="space-y-3">
            {BACKUPS.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{b.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{b.size}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(b.created).toLocaleString()}</span>
                    <span className="text-[10px] text-zinc-500">{b.channels} channels</span>
                    <span className="text-[10px] text-zinc-500">{b.roles} roles</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold hover:bg-emerald-600/30 transition-all cursor-pointer">
                    <Download className="w-3.5 h-3.5 inline mr-1" /> Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
