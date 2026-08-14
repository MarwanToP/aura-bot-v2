"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Filter, AlertTriangle, Ban, UserX, Clock, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

const MOCK_CASES = [
  { caseId: 1042, type: 'warn', userId: '80351110224678912', moderatorId: '939799976308011018', reason: 'Spamming in #general', createdAt: new Date().toISOString(), active: true },
  { caseId: 1041, type: 'timeout', userId: '28192340012345678', moderatorId: '939799976308011018', reason: 'Inappropriate language after warning', createdAt: new Date(Date.now() - 3600000).toISOString(), active: true, duration: 3600000 },
  { caseId: 1040, type: 'kick', userId: '57193540012345678', moderatorId: '939799976308011018', reason: 'Repeated violations of rule #3', createdAt: new Date(Date.now() - 7200000).toISOString(), active: false },
  { caseId: 1039, type: 'ban', userId: '12345678901234567', moderatorId: '939799976308011018', reason: 'Raid participation — mass mention', createdAt: new Date(Date.now() - 86400000).toISOString(), active: true },
  { caseId: 1038, type: 'warn', userId: '98765432109876543', moderatorId: '939799976308011018', reason: 'Self-promotion in chat', createdAt: new Date(Date.now() - 172800000).toISOString(), active: false },
  { caseId: 1037, type: 'timeout', userId: '5555444433332222', moderatorId: '204255221017214977', reason: 'Excessive caps lock', createdAt: new Date(Date.now() - 259200000).toISOString(), active: false, duration: 600000 },
  { caseId: 1036, type: 'warn', userId: '1111222233334444', moderatorId: '939799976308011018', reason: 'Posting invite links outside #advertise', createdAt: new Date(Date.now() - 345600000).toISOString(), active: true },
];

const TYPE_CONFIG = {
  warn: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Warn' },
  kick: { icon: UserX, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Kick' },
  ban: { icon: Ban, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', label: 'Ban' },
  timeout: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Timeout' },
  unban: { icon: Ban, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Unban' },
};

export default function LogViewer() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [cases] = useState(MOCK_CASES);

  const filtered = cases.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return String(c.caseId).includes(q) || c.userId.includes(q) || c.moderatorId.includes(q) || c.reason.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    totalCases: cases.length,
    activeWarnings: cases.filter(c => c.type === 'warn' && c.active).length,
    banCount: cases.filter(c => c.type === 'ban').length,
    kickCount: cases.filter(c => c.type === 'kick').length,
    timeoutCount: cases.filter(c => c.type === 'timeout').length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-purple-400" />
            Moderation Logs & Audit Trail (Dyno / Carl-bot Style)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Browse all moderation actions with real-time search, filtering, and pagination.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Cases', value: stats.totalCases, color: 'text-white' },
          { label: 'Active Warnings', value: stats.activeWarnings, color: 'text-amber-400' },
          { label: 'Timeouts', value: stats.timeoutCount, color: 'text-blue-400' },
          { label: 'Kicks', value: stats.kickCount, color: 'text-orange-400' },
          { label: 'Bans', value: stats.banCount, color: 'text-rose-400' },
        ].map((s) => (
          <div key={s.label} className="dark-panel p-4">
            <div className="text-[11px] text-zinc-400 font-mono font-bold uppercase">{s.label}</div>
            <div className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="dark-panel p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case ID, user ID, moderator, or reason..."
            className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          {['all', 'warn', 'timeout', 'kick', 'ban'].map((t) => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${typeFilter === t ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40' : 'bg-[#0b0d14] text-zinc-400 border border-[#1e2333] hover:text-zinc-200'}`}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Table */}
      <div className="dark-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1e2333]">
                <th className="text-left p-4 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Case #</th>
                <th className="text-left p-4 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Type</th>
                <th className="text-left p-4 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">User ID</th>
                <th className="text-left p-4 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Moderator</th>
                <th className="text-left p-4 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Reason</th>
                <th className="text-left p-4 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Date</th>
                <th className="text-left p-4 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-zinc-500 text-xs">No moderation cases found.</td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const cfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.warn;
                  const Icon = cfg.icon;
                  return (
                    <tr key={c.caseId} className="border-b border-[#1e2333]/50 hover:bg-[#121520] transition-colors">
                      <td className="p-4 font-mono font-bold text-white">#{c.caseId}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-zinc-300">{c.userId.slice(0, 8)}...{c.userId.slice(-4)}</td>
                      <td className="p-4 font-mono text-zinc-300">{c.moderatorId.slice(0, 8)}...{c.moderatorId.slice(-4)}</td>
                      <td className="p-4 text-zinc-300 max-w-xs truncate">{c.reason}</td>
                      <td className="p-4 text-zinc-400 font-mono text-[10px]">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold font-mono ${c.active ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {c.active ? 'ACTIVE' : 'RESOLVED'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-[#1e2333]">
          <span className="text-[11px] text-zinc-500">
            Showing {filtered.length} of {cases.length} cases
          </span>
          <div className="flex items-center gap-2">
            <button aria-label="Previous page" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg bg-[#0b0d14] border border-[#1e2333] text-zinc-400 hover:text-white disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-zinc-400">Page {page}</span>
            <button aria-label="Next page" onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg bg-[#0b0d14] border border-[#1e2333] text-zinc-400 hover:text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
