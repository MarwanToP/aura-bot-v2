"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, RefreshCw, WifiOff, Inbox, Bot, Shield, UserRound } from "lucide-react";

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

/* ────────────────────────────── shared atoms ────────────────────────────── */

const inputCls =
  "glass-input py-2 pl-9 text-xs";

const btnGhost =
  "btn-glass";

/* Real Discord guild ids are 17–20 digit snowflakes — anything else means "no real server selected". */
const SNOWFLAKE_RE = /^\d{17,20}$/;

function hueFromId(id) {
  let h = 0;
  const s = String(id || "");
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

function MemberAvatar({ member }) {
  const [broken, setBroken] = useState(false);
  const initial = (member.nickname || member.username || "?")[0]?.toUpperCase() || "?";
  const hue = hueFromId(member.id);

  const badge = member.avatar && !broken ? (
    <img
      src={`https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=64`}
      alt={member.username}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-8 w-8 shrink-0 rounded-full border border-white/[0.06] object-cover"
    />
  ) : (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))`,
      }}
    >
      {initial}
    </span>
  );

  return <span className="avatar-ring inline-flex shrink-0">{badge}</span>;
}

function MemberRow({ m, index }) {
  const display = m.nickname || m.username;
  const joined = m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—";
  const isBot = Boolean(m.bot);
  const roleCount = Number(m.roleCount) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.25), duration: 0.3, ease: EASE }}
      className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.025] sm:grid-cols-[minmax(0,1fr)_7rem_8rem_6rem]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <MemberAvatar member={m} />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-xs font-bold text-white">{display}</span>
            {m.nickname && (
              <span className="hidden truncate text-[10px] text-slate-500 sm:block">@{m.username}</span>
            )}
            {isBot && (
              <span className="chip chip-violet shrink-0 !px-1.5 !py-0 text-[9px] font-extrabold tracking-wider">
                BOT
              </span>
            )}
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[10px] text-slate-600">
            <span className="truncate font-mono">{m.id}</span>
            <span className="text-slate-700">·</span>
            <span className="whitespace-nowrap sm:hidden">Joined {joined}</span>
          </div>
        </div>
      </div>

      <div className="hidden sm:block">
        <span
          className={roleCount > 0 ? "chip chip-cyan" : "chip"}
          title="Discord exposes a role count here — role names aren't returned by the member API"
        >
          <Shield className="h-3 w-3" />
          {roleCount} {roleCount === 1 ? "role" : "roles"}
        </span>
      </div>

      <div className="hidden font-mono text-[10px] text-slate-500 sm:block">{joined}</div>

      <div className="flex items-center justify-end gap-2">
        <span
          className={isBot ? "status-dot status-dot-online" : "status-dot status-dot-offline"}
          title={
            isBot
              ? "Bot accounts are always online"
              : "Presence isn't exposed to the dashboard yet"
          }
        />
        <span className="text-[10px] font-semibold text-slate-500">
          {isBot ? "Online" : "Unknown"}
        </span>
      </div>
    </motion.div>
  );
}

function SkeletonRows() {
  return (
    <div className="glass-card overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3.5 last:border-0"
        >
          <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-white/[0.05]" />
          <span className="block min-w-0 flex-1 space-y-2">
            <span className="block h-2.5 w-40 max-w-full animate-pulse rounded-full bg-white/[0.05]" />
            <span className="block h-2 w-24 animate-pulse rounded-full bg-white/[0.03]" />
          </span>
          <span className="h-5 w-14 shrink-0 animate-pulse rounded-full bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Icon className="h-5 w-5" />
      </span>
      <p className="empty-state-title">{title}</p>
      {body ? <p className="max-w-sm text-[11px] text-slate-500">{body}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

function KpiTile({ icon: Icon, tone, label, value, hint }) {
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
        <div className="mt-1.5 text-[11px] font-semibold text-slate-500">{hint}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function MembersPanel({ guildId }) {
  const [members, setMembers] = useState([]);
  const [memberCount, setMemberCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  const isGuest = !guildId || !SNOWFLAKE_RE.test(String(guildId));

  // Monotonic request id — only the latest load may write roster state.
  const requestSeq = useRef(0);

  const load = useCallback(
    async (term = "") => {
      if (isGuest) {
        requestSeq.current += 1;
        setMembers([]);
        setMemberCount(null);
        setError(null);
        setLoading(false);
        return;
      }

      const requestId = ++requestSeq.current;
      const search = typeof term === "string" ? term.trim() : "";
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/guilds/${guildId}/members${search ? `?q=${encodeURIComponent(search)}` : ""}`
        );
        const data = await res.json().catch(() => ({}));
        if (requestId !== requestSeq.current) return; // stale response — a newer request owns state
        if (!res.ok) throw new Error(data.error || `Failed to load members (${res.status})`);
        setMembers(Array.isArray(data.members) ? data.members : []);
        setMemberCount(typeof data.memberCount === "number" ? data.memberCount : null);
      } catch (err) {
        if (requestId !== requestSeq.current) return; // stale failure — ignore
        setMembers([]);
        setMemberCount(null);
        setError(err.message || "Failed to load members from Discord");
      } finally {
        if (requestId === requestSeq.current) setLoading(false);
      }
    },
    [guildId, isGuest]
  );

  // Effective server-side search term: Discord prefix-searches names via ?q=, but IDs
  // are not searchable server-side — all-digit queries filter locally instead.
  const rawQuery = query.trim();
  const isIdQuery = rawQuery !== "" && /^\d+$/.test(rawQuery);
  const serverQuery = rawQuery && !isIdQuery ? rawQuery : "";

  // Fetch on mount + guildId change; debounce (~350ms) non-empty server searches.
  useEffect(() => {
    if (isGuest) {
      requestSeq.current += 1; // drop any in-flight request from a previous guild
      setMembers([]);
      setMemberCount(null);
      setError(null);
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => load(serverQuery), serverQuery ? 350 : 0);
    return () => {
      clearTimeout(timer);
      requestSeq.current += 1; // late responses must not touch state once deps change
    };
  }, [isGuest, serverQuery, load]);

  // Reset the search when switching servers.
  useEffect(() => {
    setQuery("");
  }, [guildId]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return members;
    return members.filter(
      (m) =>
        (m.username || "").toLowerCase().includes(q) ||
        (m.nickname || "").toLowerCase().includes(q) ||
        String(m.id || "").includes(q)
    );
  }, [members, q]);

  const visible = filtered.slice(0, 100);

  /* KPI numbers — straight from the loaded roster, never invented. */
  const botCount = useMemo(() => members.filter((m) => m.bot).length, [members]);
  const avgRoles = useMemo(() => {
    if (!members.length) return null;
    const total = members.reduce((sum, m) => sum + (Number(m.roleCount) || 0), 0);
    return (total / members.length).toFixed(1);
  }, [members]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="section-label">Server Members</span>
          <h2 className="card-title mt-1.5 flex items-center gap-2.5 text-lg">
            <span className="icon-tile icon-tile-blue h-9 w-9">
              <Users className="h-4 w-4" />
            </span>
            Members
            {typeof memberCount === "number" && (
              <span className="chip chip-green">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-pulse-dot" />
                {memberCount.toLocaleString("en-US")} members
              </span>
            )}
          </h2>
          <p className="card-sub mt-1.5 max-w-2xl">
            Live roster pulled from Discord — search, inspect roles, and spot bots at a glance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(serverQuery)}
          disabled={loading || isGuest}
          className={`${btnGhost} ${loading || isGuest ? "pointer-events-none opacity-40" : ""}`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </motion.div>

      {isGuest ? (
        <motion.div variants={rise}>
          <EmptyState
            icon={UserRound}
            title="No server selected"
            body="Pick a server from the sidebar to browse its live member roster."
          />
        </motion.div>
      ) : (
        <>
          {/* Member KPIs */}
          <motion.div variants={rise} className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <KpiTile
              icon={Users}
              tone="blue"
              label="Total Members"
              value={typeof memberCount === "number" ? memberCount.toLocaleString("en-US") : "—"}
              hint="Approximate guild total"
            />
            <KpiTile
              icon={Users}
              tone="cyan"
              label="Roster Loaded"
              value={members.length.toLocaleString("en-US")}
              hint="Members pulled from Discord"
            />
            <KpiTile
              icon={Bot}
              tone="violet"
              label="Bot Members"
              value={botCount.toLocaleString("en-US")}
              hint="Within the loaded roster"
            />
            <KpiTile
              icon={Shield}
              tone="amber"
              label="Avg. Roles"
              value={avgRoles ?? "—"}
              hint="Within the loaded roster"
            />
          </motion.div>

          {/* Search */}
          <motion.div variants={rise} className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username, nickname or ID…"
                className={inputCls}
              />
            </div>
            {!loading && !error && (
              <span className="text-[10px] text-slate-600">
                {visible.length} of {members.length} shown
              </span>
            )}
          </motion.div>

          {/* Body */}
          <motion.div variants={rise}>
            {loading ? (
              <SkeletonRows />
            ) : error ? (
              <EmptyState
                icon={WifiOff}
                title="Couldn't load members"
                body={error}
                action={
                  <button type="button" onClick={() => load(serverQuery)} className={btnGhost}>
                    <RefreshCw className="h-3.5 w-3.5" /> Try again
                  </button>
                }
              />
            ) : visible.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No members found"
                body={
                  q
                    ? "Try a different search."
                    : "This server's roster is empty — nothing to show yet."
                }
              />
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_7rem_8rem_6rem]">
                  <span className="micro-label">Member</span>
                  <span className="micro-label hidden sm:block">Roles</span>
                  <span className="micro-label hidden sm:block">Joined</span>
                  <span className="micro-label text-right">Status</span>
                </div>
                <div className="custom-scrollbar max-h-[560px] overflow-y-auto">
                  {visible.map((m, i) => (
                    <MemberRow key={m.id || `${m.username}-${i}`} m={m} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
