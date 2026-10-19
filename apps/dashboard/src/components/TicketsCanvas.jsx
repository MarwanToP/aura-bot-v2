"use client";

import React, { useState, useEffect } from 'react';
import {
  Ticket, Plus, Search, Filter, ExternalLink, MessageSquare,
  Star, FolderPlus, Layers, Inbox, CheckCircle2, Clock, FileText
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
  'btn-glass px-3 py-1.5 text-[10px] font-bold rounded-xl whitespace-nowrap';

/* status → chip. open = cyan, claimed = amber, closed = green, escalated = pink. */
const STATUS_CHIPS = {
  open: { cls: 'chip chip-cyan', label: 'Open' },
  claimed: { cls: 'chip chip-amber', label: 'Claimed' },
  escalated: {
    cls: 'chip',
    label: 'Escalated',
    style: {
      color: '#F9A8D4',
      borderColor: 'rgba(244,114,182,0.34)',
      backgroundColor: 'rgba(244,114,182,0.12)',
    },
  },
  closed: { cls: 'chip chip-green', label: 'Closed' },
  archived: {
    cls: 'chip',
    label: 'Archived',
    style: {
      color: '#94A3B8',
      borderColor: 'rgba(255,255,255,0.12)',
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
  },
};

/* priority → coloured dot + label */
const PRIORITY_TONES = {
  Low: { color: '#6EE7B7', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.32)' },
  Medium: { color: '#FCD34D', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.32)' },
  High: { color: '#FDBA74', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.32)' },
  Critical: { color: '#FCA5A5', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.32)' },
};

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

/* ── shared glass atoms ── */

function KpiTile({ icon: Icon, tone, label, value, hint, hintClass = 'text-slate-500' }) {
  return (
    <div className="kpi-tile flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-3">
        <span className="kpi-label">{label}</span>
        <span className={`icon-tile icon-tile-${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className={`mt-1.5 text-[11px] font-semibold ${hintClass}`}>{hint}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Icon className="h-5 w-5" />
      </span>
      <p className="empty-state-title">{title}</p>
      {body ? <p className="max-w-md text-[11px] text-slate-500">{body}</p> : null}
    </div>
  );
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

  const openCount = liveTickets && stats
    ? stats.open
    : tickets.filter((t) => t.status === 'open').length;
  const closedCount = liveTickets && stats
    ? stats.closed
    : tickets.filter((t) => t.status === 'closed').length;

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
    const cfg = STATUS_CHIPS[status];
    if (!cfg) return null;
    return (
      <span className={cfg.cls} style={cfg.style}>
        {cfg.label}
      </span>
    );
  };

  const priorityBadge = (priority) => {
    const tone = PRIORITY_TONES[priority] || PRIORITY_TONES.Medium;
    return (
      <span
        className="chip uppercase tracking-wider"
        style={{ color: tone.color, backgroundColor: tone.bg, borderColor: tone.border }}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: tone.color, boxShadow: `0 0 8px ${tone.color}` }}
        />
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="section-label">Support Desk</span>
          <h2 className="card-title mt-1.5 flex items-center gap-2.5 text-lg">
            <span className="icon-tile icon-tile-violet h-9 w-9">
              <Ticket className="h-4 w-4" />
            </span>
            Support Desk &amp; HTML Transcripts
          </h2>
          <p className="card-sub mt-1.5 max-w-2xl">
            Manage live support tickets, custom category panels, and persistent HTML transcript archives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button"
            onClick={() => setShowCatModal(true)}
            disabled={realMode}
            title={realMode ? readOnlyHint : undefined}
            className="btn-primary px-3.5 py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiTile
          icon={Inbox}
          tone="cyan"
          label="Open Tickets"
          value={openCount}
          hint={
            liveTickets
              ? openCount === 0
                ? 'All caught up — nothing waiting'
                : `${activeCount} active across ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}`
              : `${activeCount} active across ${categories.length} departments`
          }
          hintClass="text-[#67E8F9]"
        />
        <KpiTile
          icon={CheckCircle2}
          tone="green"
          label="Closed Tickets"
          value={closedCount}
          hint={liveTickets ? 'Resolved by staff' : 'Marked as resolved'}
          hintClass="text-[#6EE7B7]"
        />
        <KpiTile
          icon={Clock}
          tone="amber"
          label="Avg. Response Time"
          value={avgResponseValue}
          hint={avgResponseHint}
          hintClass={avgResponseMuted ? 'text-slate-500' : 'text-[#FCD34D]'}
        />
        <KpiTile
          icon={Star}
          tone="green"
          label="CSAT Rating"
          value={
            <span className="flex items-center gap-1.5">
              {csatValue}
              {csatStarVisible && <Star className="h-4 w-4 fill-emerald-400 text-emerald-400" />}
            </span>
          }
          hint={csatHint}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="inline-flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1.5 backdrop-blur-xl">
        <button type="button"
          onClick={() => setActiveTab('tickets')}
          className={`seg-tab ${activeTab === 'tickets' ? 'seg-tab-active' : ''}`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Active Tickets ({tickets.length})</span>
        </button>

        <button type="button"
          onClick={() => setActiveTab('categories')}
          className={`seg-tab ${activeTab === 'categories' ? 'seg-tab-active' : ''}`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Support Categories ({categories.length})</span>
        </button>

        <button type="button"
          onClick={() => setActiveTab('transcripts')}
          className={`seg-tab ${activeTab === 'transcripts' ? 'seg-tab-active' : ''}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Transcript Archives ({transcripts.length})</span>
        </button>
      </div>

      {/* TAB 1: TICKETS VIEW */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="glass-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search ticket ID, user, subject..."
                aria-label="Search tickets by ID, user, or subject"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="glass-input py-2 pl-9 pr-3 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                aria-label="Filter tickets by status"
                className="glass-select w-full py-2 text-xs sm:w-44"
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
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>User</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Claimed By</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="data-row">
                      <td className="font-mono font-bold text-[#A9C2FF] whitespace-nowrap">
                        {ticket.id}
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="avatar-ring inline-flex shrink-0">
                            <span
                              className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                              style={{
                                background: `linear-gradient(135deg, hsl(${(hashHue(ticket.userId || ticket.user || '?') % 360)} 70% 55%), hsl(${(hashHue(ticket.userId || ticket.user || '?') + 40) % 360} 70% 45%))`,
                              }}
                              aria-hidden="true"
                            >
                              {initialsOf(ticket.userName || ticket.user, ticket.userId)}
                            </span>
                          </span>
                          <div className="min-w-0">
                            <div
                              className={`truncate font-semibold text-slate-100 ${
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
                      </td>
                      <td className="text-slate-400">{ticket.category}</td>
                      <td>{priorityBadge(ticket.priority)}</td>
                      <td>{statusBadge(ticket.status)}</td>
                      <td className="text-slate-400">
                        {ticket.claimedBy || <span className="text-slate-600 italic">Unclaimed</span>}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ticket.status === 'open' && (
                            <button type="button"
                              onClick={() => handleClaim(ticket.id)}
                              disabled={realMode}
                              title={realMode ? readOnlyHint : undefined}
                              className="btn-glass px-2.5 py-1 text-[10px] font-bold rounded-xl text-[#A9C2FF] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Claim
                            </button>
                          )}
                          {ticket.status !== 'closed' && (
                            <>
                              <button type="button"
                                onClick={() => handleEscalate(ticket.id)}
                                disabled={realMode}
                                title={realMode ? readOnlyHint : undefined}
                                className="btn-glass px-2.5 py-1 text-[10px] font-bold rounded-xl text-[#FCD34D] disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Escalate
                              </button>
                              <button type="button"
                                onClick={() => handleClose(ticket.id)}
                                disabled={realMode}
                                title={realMode ? readOnlyHint : undefined}
                                className="btn-glass px-2.5 py-1 text-[10px] font-bold rounded-xl text-[#FCA5A5] disabled:opacity-40 disabled:cursor-not-allowed"
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
                      <td colSpan={7} className="px-4 py-4">
                        <EmptyState
                          icon={Inbox}
                          title={tickets.length === 0 ? 'No tickets yet' : 'No tickets match your filters'}
                          body={
                            tickets.length === 0
                              ? 'New support requests will appear here as members open tickets.'
                              : 'Try a different search or status filter.'
                          }
                        />
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
          <div className="glass-card">
            <EmptyState
              icon={FolderPlus}
              title="No ticket categories yet"
              body="Categories build up here as members open tickets."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map(cat => (
              <div key={cat.id} className="glass-card glass-card-hover p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className={`icon-tile bg-gradient-to-br ${cat.color} border-white/10`}>
                    <span className="text-lg leading-none" aria-hidden="true">{cat.emoji}</span>
                  </span>
                  <span className="chip chip-violet">
                    {cat.activeTickets} active tickets
                  </span>
                </div>
                <h3 className="card-title mt-4">{cat.name}</h3>
                {cat.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {cat.tags.map(t => (
                      <span key={t} className="chip chip-cyan font-mono">
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
        <div className="glass-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
            <div>
              <span className="section-label">Archive</span>
              <h3 className="card-title mt-1">HTML Transcript Archives</h3>
              <p className="card-sub mt-1">{transcriptHint}</p>
            </div>
            <span className="chip chip-cyan">{transcriptValue} saved</span>
          </div>
          {transcripts.length === 0 ? (
            <div className="px-4 pb-4">
              <EmptyState
                icon={FileText}
                title="No transcript archives yet"
                body="Transcripts appear here once closed tickets include a saved link."
              />
            </div>
          ) : (
            <div className="px-2 pb-2">
              {transcripts.map((tr, i) => (
                <React.Fragment key={tr.id}>
                  {i > 0 && <div className="hairline" />}
                  <div className="flex items-center justify-between gap-3 px-2 py-3 transition-colors hover:bg-white/[0.03]">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="icon-tile icon-tile-violet h-9 w-9">
                        <ExternalLink className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="truncate text-xs font-bold text-white">{tr.title}</h4>
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          User: <span className="text-[#A9C2FF] font-semibold">{tr.user}</span> · {tr.category} · {tr.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {tr.size ? <span className="text-[10px] font-mono text-slate-500">{tr.size}</span> : null}
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
                        <button type="button" className={VIEW_TRANSCRIPT_CLS}>View Transcript</button>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {showCatModal && (
        <div className="modal-scrim fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="modal-surface w-full max-w-md p-6">
            <span className="section-label">New Category</span>
            <h3 className="card-title mt-1.5 text-lg">Create Ticket Category</h3>

            <form onSubmit={handleAddCategory} className="mt-5 space-y-4">
              <div>
                <label className="micro-label block" htmlFor="ticket-category-name">Category Name</label>
                <input
                  id="ticket-category-name"
                  type="text"
                  placeholder="e.g. VIP Support, Ban Appeals"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="glass-input mt-1.5 text-xs"
                  required
                />
              </div>

              <div>
                <label className="micro-label block" htmlFor="ticket-category-emoji">Emoji</label>
                <input
                  id="ticket-category-emoji"
                  type="text"
                  placeholder="e.g. 🎫, 🔧, 💳"
                  value={newCatEmoji}
                  onChange={e => setNewCatEmoji(e.target.value)}
                  className="glass-input mt-1.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="btn-glass"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
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
