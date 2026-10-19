"use client";

import React, { useState, useEffect } from 'react';
import { 
  Ticket, Plus, Search, Filter, ExternalLink, MessageSquare,
  Star, FolderPlus, Layers
} from 'lucide-react';

const INITIAL_CATEGORIES = [
  { id: 'cat_tech', name: 'Technical Support', emoji: '🔧', color: 'from-blue-500 to-indigo-600', activeTickets: 14, tags: ['tech', 'bug', 'bot'] },
  { id: 'cat_billing', name: 'Billing & Premium', emoji: '💳', color: 'from-emerald-500 to-teal-600', activeTickets: 5, tags: ['billing', 'vip', 'payment'] },
  { id: 'cat_complaint', name: 'Member Complaints', emoji: '👤', color: 'from-amber-500 to-orange-600', activeTickets: 8, tags: ['mod', 'report', 'abuse'] },
  { id: 'cat_appeals', name: 'Ban & Warning Appeals', emoji: '⚖️', color: 'from-purple-500 to-pink-600', activeTickets: 11, tags: ['appeals', 'unban'] },
  { id: 'cat_mgmt', name: 'Executive Management', emoji: '👑', color: 'from-red-500 to-rose-600', activeTickets: 2, tags: ['management', 'admin'] },
];

const INITIAL_TICKETS = [
  { id: 'TKT-0412', user: 'CyberKnight#1337', category: 'Technical Support', status: 'claimed', priority: 'High', tier: 2, claimedBy: 'Alex (Staff)', createdAt: '10m ago', subject: 'Bot disconnects on heavy voice load' },
  { id: 'TKT-0411', user: 'VaporWave99', category: 'Billing & Premium', status: 'open', priority: 'Medium', tier: 1, claimedBy: null, createdAt: '25m ago', subject: 'Upgrade to Tier 3 Subscription' },
  { id: 'TKT-0410', user: 'PixelQueen', category: 'Ban & Warning Appeals', status: 'escalated', priority: 'Critical', tier: 3, claimedBy: 'Sarah (Lead Admin)', createdAt: '1h ago', subject: 'False positive automod mute appeal' },
  { id: 'TKT-0409', user: 'NeonGlow', category: 'Member Complaints', status: 'closed', priority: 'Low', tier: 1, claimedBy: 'David (Support)', createdAt: '3h ago', subject: 'Spam in #general channel' },
  { id: 'TKT-0408', user: 'NullPointer', category: 'Executive Management', status: 'open', priority: 'High', tier: 2, claimedBy: null, createdAt: '4h ago', subject: 'Partnership request for esports tournament' },
];

const TRANSCRIPTS = [
  { id: 'TKT-0409', title: 'TKT-0409-neonglow.html', date: '2026-08-26 15:42', size: '142 KB', user: 'NeonGlow', category: 'Member Complaints', rating: 5 },
  { id: 'TKT-0405', title: 'TKT-0405-shadowrunner.html', date: '2026-08-25 19:10', size: '210 KB', user: 'ShadowRunner', category: 'Technical Support', rating: 4 },
  { id: 'TKT-0401', title: 'TKT-0401-glitchmaster.html', date: '2026-08-24 11:05', size: '98 KB', user: 'GlitchMaster', category: 'Ban Appeals', rating: 5 },
];

/* ── real-data helpers (used only when a guildId is provided) ── */

const CATEGORY_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-pink-600',
  'from-red-500 to-rose-600',
  'from-cyan-500 to-blue-600',
];

/* shared by the demo button and the real <a> transcript link */
const VIEW_TRANSCRIPT_CLS =
  'px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer';

function relTime(value) {
  const t = value ? new Date(value).getTime() : NaN;
  if (!Number.isFinite(t)) return '—';
  const mins = Math.max(0, (Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${Math.round(mins)}m ago`;
  const h = mins / 60;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/* only absolute http(s) links are ever used as an href */
function safeUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim()) ? value.trim() : null;
}

function fmtMins(mins) {
  if (mins == null || !Number.isFinite(Number(mins))) return '—';
  const m = Number(mins);
  if (m < 1) return '<1 min';
  if (m < 60) return `${Math.round(m * 10) / 10} mins`;
  return `${(m / 60).toFixed(1)} hours`;
}

/* normalize the GET /tickets stats block so KPI math never renders NaN */
function normalizeStats(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  return {
    total: Number(s.total) || 0,
    open: Number(s.open) || 0,
    closed: Number(s.closed) || 0,
    avgFirstResponseMins: s.avgFirstResponseMins == null ? null : Number(s.avgFirstResponseMins),
    avgCsat: s.avgCsat == null ? null : Number(s.avgCsat),
  };
}

/* API ticket row → table row shape */
function mapApiTicket(t) {
  const createdAt = t?.createdAt ?? null;
  const userName = typeof t?.userName === 'string' && t.userName.trim() ? t.userName.trim() : null;
  return {
    id: t?.ticketId ? String(t.ticketId) : '',
    user: userName || '',
    userId: t?.userId != null ? String(t.userId) : '',
    userName,
    subject: typeof t?.subject === 'string' ? t.subject : '',
    transcriptUrl: safeUrl(t?.transcriptUrl),
    category: t?.category || 'Other',
    status: t?.status || 'open',
    priority: t?.priority || 'Medium',
    tier: Number.isFinite(Number(t?.tier)) ? Number(t.tier) : 1,
    claimedBy: t?.claimedBy || null,
    createdAt: relTime(createdAt),
    real: true,
  };
}

/* muted stand-in for an unresolved user — "…1a2b3c" */
function shortUserId(id) {
  const s = String(id ?? '');
  return s ? `…${s.slice(-6)}` : '';
}

/* the ticket contract carries no avatar URL — a seeded initials badge stands in */
function initialsOf(name, userId) {
  const fromName = String(name || '').replace(/[^a-z0-9]/gi, '').slice(0, 2);
  if (fromName) return fromName.toUpperCase();
  const digits = String(userId || '').replace(/\D/g, '');
  return digits ? digits.slice(-2) : '?';
}

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

/* transcripts archived by the bot — only http(s) links are ever rendered */
function buildTranscripts(rows) {
  return rows
    .filter((row) => row.transcriptUrl)
    .map((row) => ({
      id: row.id,
      title: row.subject ? `${row.id} · ${row.subject}` : row.id,
      date: row.createdAt,
      size: null,
      user: row.user || shortUserId(row.userId),
      category: row.category,
      url: row.transcriptUrl,
    }));
}

/* group real tickets by category → category cards */
function groupCategories(rows) {
  const byName = new Map();
  for (const row of rows) {
    const name = row.category || 'Other';
    if (!byName.has(name)) byName.set(name, { name, activeTickets: 0 });
    if (row.status !== 'closed') byName.get(name).activeTickets += 1;
  }
  return Array.from(byName.values()).map((c, i) => ({
    id: `cat_${c.name}`,
    name: c.name,
    emoji: '🎫',
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    activeTickets: c.activeTickets,
    tags: [],
  }));
}

export default function TicketsCanvas({ guildId }) {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [transcripts, setTranscripts] = useState(TRANSCRIPTS);
  const [liveTickets, setLiveTickets] = useState(false);
  const [stats, setStats] = useState(null);
  const [csat, setCsat] = useState(null);
  const [csatLive, setCsatLive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🎫');
  const [activeTab, setActiveTab] = useState('tickets');

  /* Real data — only when a guildId is present. Guest mode (falsy guildId) never
     fetches and keeps the humanized demo state exactly as-is. A failed route
     leaves its demo fallback in place (one warn max, never throws). */
  useEffect(() => {
    if (!guildId) {
      setTickets(INITIAL_TICKETS);
      setCategories(INITIAL_CATEGORIES);
      setTranscripts(TRANSCRIPTS);
      setLiveTickets(false);
      setStats(null);
      setCsat(null);
      setCsatLive(false);
      return undefined;
    }

    let cancelled = false;
    const failed = [];

    const load = async () => {
      const [ticketsRes, csatRes] = await Promise.allSettled([
        fetch(`/api/guilds/${guildId}/tickets`).then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        }),
        fetch(`/api/guilds/${guildId}/tickets/csat`).then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        }),
      ]);
      if (cancelled) return;

      if (ticketsRes.status === 'fulfilled') {
        const rows = (Array.isArray(ticketsRes.value?.tickets) ? ticketsRes.value.tickets : []).map(mapApiTicket);
        setTickets(rows);
        setCategories(groupCategories(rows));
        /* archives are derived from whatever the bot has already saved — empty until a
           closed ticket actually carries a transcript link */
        setTranscripts(buildTranscripts(rows));
        setStats(normalizeStats(ticketsRes.value?.stats));
        setLiveTickets(true);
      } else {
        failed.push('tickets');
      }

      if (csatRes.status === 'fulfilled') {
        const payload = csatRes.value?.csat;
        setCsat(payload && typeof payload === 'object' ? payload : null);
        setCsatLive(true);
      } else {
        failed.push('csat');
      }

      if (failed.length > 0) {
        console.warn(`[TicketsCanvas] Failed to load ${failed.join(', ')} for guild ${guildId} — keeping the demo fallback for those sections.`);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  /* KPI values — real numbers once loaded, humanized demo otherwise (null → "—") */
  const activeCount = liveTickets
    ? Math.max(0, stats.total - stats.closed)
    : tickets.filter((t) => t.status !== 'closed').length;

  const avgFirstResponseMins = liveTickets ? stats.avgFirstResponseMins : null;
  const avgResponseValue = liveTickets ? fmtMins(avgFirstResponseMins) : '2.4 mins';
  const avgResponseHint = liveTickets
    ? avgFirstResponseMins != null
      ? 'Average first staff response'
      : 'No first responses recorded yet'
    : '⚡ 18% faster today';
  const avgResponseMuted = liveTickets && avgFirstResponseMins == null;

  const csatKnown = csatLive || liveTickets;
  const csatRating =
    csatLive && csat && csat.avgRating != null
      ? Number(csat.avgRating)
      : liveTickets && stats.avgCsat != null
        ? Number(stats.avgCsat)
        : null;
  const csatValue = csatKnown ? (csatRating != null ? csatRating.toFixed(1) : '—') : '4.9';
  const csatHint = csatKnown
    ? csatLive && csat && csat.count > 0
      ? `Based on ${csat.count} review${csat.count === 1 ? '' : 's'}`
      : csatRating != null
        ? 'Average across rated tickets'
        : 'No reviews yet'
    : 'Based on 148 reviews';
  const csatStarVisible = !csatKnown || csatRating != null;

  const transcriptValue = liveTickets ? (transcripts.length > 0 ? transcripts.length : '—') : '1,420';
  const transcriptHint = liveTickets ? 'Linked from saved ticket transcripts' : 'HTML Discord Transcripts';

  /* Real mode is read-only: none of the row actions have a route behind them yet, and
     'escalated' isn't part of the ticket status enum (open | claimed | closed | archived). */
  const realMode = Boolean(guildId);
  const readOnlyHint = 'Not manageable from the dashboard yet';

  const filteredTickets = tickets.filter(t => {
    const haystack = [t.id, t.user, t.userName, t.subject, t.category]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesSearch = haystack.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (realMode) return; // no category route behind this modal in real mode
    if (!newCatName.trim()) return;
    const newCat = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      emoji: newCatEmoji || '🎫',
      color: 'from-purple-500 to-indigo-600',
      activeTickets: 0,
      tags: [newCatName.toLowerCase().replace(/[^a-z0-9]/g, '')]
    };
    setCategories([...categories, newCat]);
    setNewCatName('');
    setShowCatModal(false);
  };

  const handleClaim = (ticketId) => {
    if (realMode) return;
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'claimed', claimedBy: 'You (Admin)' } : t));
  };

  const handleClose = (ticketId) => {
    if (realMode) return;
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t));
  };

  const handleEscalate = (ticketId) => {
    if (realMode) return;
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'escalated', tier: Math.min(3, t.tier + 1), priority: 'Critical' } : t));
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400">Open</span>;
      case 'claimed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">Claimed</span>;
      case 'escalated':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center gap-1">🚨 Tier Escalated</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700/30 border border-zinc-600 text-zinc-400">Closed</span>;
      case 'archived':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800/40 border border-zinc-700 text-zinc-500">Archived</span>;
      default:
        return null;
    }
  };

  const priorityBadge = (priority) => {
    const colors = {
      Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      High: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      Critical: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${colors[priority] || colors.Medium}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* Top Header & Stats Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-purple-400" />
            Support Desk & HTML Transcripts
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage live support tickets, custom category panels, and persistent HTML transcript archives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowCatModal(true)}
            disabled={realMode}
            title={realMode ? readOnlyHint : undefined}
            className={`flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-extrabold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer${
              realMode ? ' disabled:opacity-40 disabled:cursor-not-allowed' : ''
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0b1021] border border-purple-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400">Total Active Tickets</span>
          <div className="text-2xl font-black text-white mt-1">
            {activeCount}
          </div>
          <span className="text-[10px] text-purple-400 font-bold mt-1">
            {liveTickets
              ? activeCount === 0
                ? 'All caught up — nothing waiting'
                : `Across ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}`
              : 'Across 5 departments'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1021] border border-amber-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400">Avg. Response Time</span>
          <div className="text-2xl font-black text-amber-300 mt-1">{avgResponseValue}</div>
          <span className={`text-[10px] font-bold mt-1 ${avgResponseMuted ? 'text-slate-400' : 'text-emerald-400'}`}>
            {avgResponseHint}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1021] border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400">CSAT Rating</span>
          <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-1">
            {csatValue} {csatStarVisible && <Star className="w-4 h-4 fill-emerald-400 text-emerald-400" />}
          </div>
          <span className="text-[10px] text-slate-400 font-bold mt-1">{csatHint}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1021] border border-cyan-500/20 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400">Transcripts Saved</span>
          <div className="text-2xl font-black text-cyan-300 mt-1">{transcriptValue}</div>
          <span className="text-[10px] text-cyan-400 font-bold mt-1">{transcriptHint}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-purple-500/20 pb-3">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tickets' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Active Tickets ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'categories' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Support Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transcripts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'transcripts' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Transcript Archives ({transcripts.length})</span>
        </button>
      </div>

      {/* TAB 1: TICKETS VIEW */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d0b1d] p-3 rounded-2xl border border-purple-500/20">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-purple-400" />
              <input
                type="text"
                placeholder="Search ticket ID, user, subject..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#110e24] border border-purple-500/20 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-[#110e24] border border-purple-500/20 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="claimed">Claimed</option>
                {/* 'escalated' only exists in the demo dataset — not a real status */}
                {!realMode && <option value="escalated">Escalated</option>}
                <option value="closed">Closed</option>
                {guildId && <option value="archived">Archived</option>}
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="rounded-2xl bg-[#0b1021] border border-purple-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#110e24] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-purple-500/20">
                  <tr>
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Claimed By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-purple-600/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-purple-300">
                        {ticket.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {ticket.userId ? (
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                              style={{
                                background: `linear-gradient(135deg, hsl(${(hashHue(ticket.userId || '?') % 360)} 70% 55%), hsl(${(hashHue(ticket.userId || '?') + 40) % 360} 70% 45%))`,
                              }}
                              aria-hidden="true"
                            >
                              {initialsOf(ticket.userName, ticket.userId)}
                            </span>
                            <div className="min-w-0">
                              <div
                                className={`truncate ${
                                  ticket.user ? '' : 'font-mono text-slate-500'
                                }`}
                              >
                                {ticket.user || shortUserId(ticket.userId)}
                              </div>
                              {ticket.subject ? (
                                <div className="truncate text-[10px] font-normal text-slate-500">
                                  {ticket.subject}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          ticket.user || <span className="text-zinc-600 italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {ticket.category}
                      </td>
                      <td className="py-3 px-4">
                        {priorityBadge(ticket.priority)}
                      </td>
                      <td className="py-3 px-4">
                        {statusBadge(ticket.status)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {ticket.claimedBy || <span className="text-zinc-600 italic">Unclaimed</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ticket.status === 'open' && (
                            <button
                              onClick={() => handleClaim(ticket.id)}
                              disabled={realMode}
                              title={realMode ? readOnlyHint : undefined}
                              className={`px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer${
                                realMode ? ' disabled:opacity-40 disabled:cursor-not-allowed' : ''
                              }`}
                            >
                              Claim
                            </button>
                          )}
                          {ticket.status !== 'closed' && (
                            <>
                              <button
                                onClick={() => handleEscalate(ticket.id)}
                                disabled={realMode}
                                title={realMode ? readOnlyHint : undefined}
                                className={`px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer${
                                  realMode ? ' disabled:opacity-40 disabled:cursor-not-allowed' : ''
                                }`}
                              >
                                Escalate
                              </button>
                              <button
                                onClick={() => handleClose(ticket.id)}
                                disabled={realMode}
                                title={realMode ? readOnlyHint : undefined}
                                className={`px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer${
                                  realMode ? ' disabled:opacity-40 disabled:cursor-not-allowed' : ''
                                }`}
                              >
                                Close
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 px-4 text-center">
                        <p className="text-xs font-semibold text-slate-400">
                          {tickets.length === 0 ? 'No tickets yet' : 'No tickets match your filters'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {tickets.length === 0
                            ? 'New support requests will appear here as members open tickets.'
                            : 'Try a different search or status filter.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES VIEW */}
      {activeTab === 'categories' && (
        categories.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#0b1021] border border-purple-500/20 flex flex-col items-center text-center gap-2">
            <FolderPlus className="w-6 h-6 text-purple-400" />
            <p className="text-sm font-bold text-slate-300">No ticket categories yet</p>
            <p className="text-[11px] text-slate-500">Categories build up here as members open tickets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="p-5 rounded-2xl bg-[#0b1021] border border-purple-500/20 relative overflow-hidden group hover:border-purple-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">
                    {cat.activeTickets} active tickets
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-white mt-3">{cat.name}</h3>
                {cat.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {cat.tags.map(t => (
                      <span key={t} className="text-[9px] font-mono bg-zinc-800/60 text-zinc-400 px-2 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* TAB 3: TRANSCRIPTS VIEW */}
      {activeTab === 'transcripts' && (
        <div className="rounded-2xl bg-[#0b1021] border border-purple-500/20 overflow-hidden">
          <div className="p-4 bg-[#110e24] border-b border-purple-500/20 flex items-center justify-between">
            <h3 className="font-bold text-sm">HTML Transcript Archives</h3>
            <span className="text-[10px] text-zinc-400 font-mono">Stored in S3 / Local Storage</span>
          </div>
          {transcripts.length === 0 ? (
            <div className="p-10 flex flex-col items-center text-center gap-2">
              <ExternalLink className="w-6 h-6 text-purple-400" />
              <p className="text-sm font-bold text-slate-300">No transcript archives yet</p>
              <p className="text-[11px] text-slate-500">Transcripts appear here once closed tickets include a saved link.</p>
            </div>
          ) : (
            <div className="divide-y divide-purple-500/10">
              {transcripts.map(tr => (
                <div key={tr.id} className="p-4 flex items-center justify-between hover:bg-purple-600/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">{tr.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        User: <span className="text-purple-300 font-semibold">{tr.user}</span> • {tr.category} • {tr.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {tr.size ? <span className="text-[10px] font-mono text-zinc-500">{tr.size}</span> : null}
                    {tr.url ? (
                      <a
                        href={tr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={VIEW_TRANSCRIPT_CLS}
                      >
                        View Transcript
                      </a>
                    ) : (
                      <button className={VIEW_TRANSCRIPT_CLS}>View Transcript</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0c1229] border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white">Create Ticket Category</h3>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Support, Ban Appeals"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full bg-[#110e24] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Emoji</label>
                <input
                  type="text"
                  placeholder="e.g. 🎫, 🔧, 💳"
                  value={newCatEmoji}
                  onChange={e => setNewCatEmoji(e.target.value)}
                  className="w-full bg-[#110e24] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-slate-300 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
