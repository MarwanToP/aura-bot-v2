"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Filter, AlertTriangle, Ban, UserX, Clock, ChevronLeft, ChevronRight } from "lucide-react";

const MOCK_CASES = [
  { caseId: 1042, type: 'warn', userId: '80351110224678912', moderatorId: '939799976308011018', reason: 'Spamming in #general', createdAt: new Date().toISOString(), active: true },
  { caseId: 1041, type: 'timeout', userId: '28192340012345678', moderatorId: '939799976308011018', reason: 'Inappropriate language', createdAt: new Date(Date.now() - 3600000).toISOString(), active: true },
  { caseId: 1040, type: 'kick', userId: '57193540012345678', moderatorId: '939799976308011018', reason: 'Repeated violations of rule #3', createdAt: new Date(Date.now() - 7200000).toISOString(), active: false },
  { caseId: 1039, type: 'ban', userId: '12345678901234567', moderatorId: '939799976308011018', reason: 'Raid participation', createdAt: new Date(Date.now() - 86400000).toISOString(), active: true },
  { caseId: 1038, type: 'warn', userId: '98765432109876543', moderatorId: '939799976308011018', reason: 'Self-promotion', createdAt: new Date(Date.now() - 172800000).toISOString(), active: false },
];

const TYPE_CONFIG = {
  warn: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Warn' },
  kick: { icon: UserX, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Kick' },
  ban: { icon: Ban, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', label: 'Ban' },
  timeout: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Timeout' },
};

export default function LogsModule({ guildId = "default" }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = MOCK_CASES.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return String(c.caseId).includes(q) || c.userId.includes(q) || c.moderatorId.includes(q) || c.reason.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">New Module</span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5 mt-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Moderation Logs & Audit Trail
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Browse all moderation actions with search, filtering, and pagination.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Cases', value: MOCK_CASES.length, color: 'text-white' },
          { label: 'Warnings', value: MOCK_CASES.filter(c => c.type === 'warn').length, color: 'text-amber-400' },
          { label: 'Timeouts', value: MOCK_CASES.filter(c => c.type === 'timeout').length, color: 'text-blue-400' },
          { label: 'Kicks', value: MOCK_CASES.filter(c => c.type === 'kick').length, color: 'text-orange-400' },
          { label: 'Bans', value: MOCK_CASES.filter(c => c.type === 'ban').length, color: 'text-rose-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{s.label}</div>
            <div className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by case ID, user, moderator, or reason..."
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#5865F2]/50" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          {['all', 'warn', 'timeout', 'kick', 'ban'].map(t => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${typeFilter === t ? 'bg-[#5865F2]/20 text-cyan-400 border border-[#5865F2]/40' : 'bg-white/[0.05] text-zinc-400 border border-white/10 hover:text-zinc-200'}`}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Case</th>
                <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Type</th>
                <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">User</th>
                <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Moderator</th>
                <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Reason</th>
                <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-zinc-500 text-xs">No cases found.</td></tr>
              ) : (
                filtered.map(c => {
                  const cfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.warn;
                  const Icon = cfg.icon;
                  return (
                    <tr key={c.caseId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-mono font-bold text-white">#{c.caseId}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-zinc-300">{c.userId.slice(0, 8)}...{c.userId.slice(-4)}</td>
                      <td className="p-4 font-mono text-zinc-300">{c.moderatorId.slice(0, 8)}...{c.moderatorId.slice(-4)}</td>
                      <td className="p-4 text-zinc-300 max-w-xs truncate">{c.reason}</td>
                      <td className="p-4 text-zinc-400 font-mono text-[10px]">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold font-mono ${c.active ? 'text-emerald-400' : 'text-zinc-500'}`}>{c.active ? 'ACTIVE' : 'RESOLVED'}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-white/10">
          <span className="text-[11px] text-zinc-500">Showing {filtered.length} of {MOCK_CASES.length} cases</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-zinc-400 hover:text-white disabled:opacity-50 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-mono text-zinc-400">Page {page}</span>
            <button onClick={() => setPage(page + 1)} className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-zinc-400 hover:text-white cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
