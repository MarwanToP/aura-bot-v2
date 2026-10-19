"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, RefreshCw, WifiOff, Inbox } from "lucide-react";

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
  "w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-colors focus:border-[#7C5CFF]/60 focus:bg-white/[0.05]";

const btnGhost =
  "inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.06]";

// Real Discord guild ids are 17–20 digit snowflakes — anything else means "no real server selected".
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

  if (member.avatar && !broken) {
    return (
      <img
        src={`https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=64`}
        alt={member.username}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setBroken(true)}
        className="h-9 w-9 shrink-0 rounded-full border border-white/[0.06] object-cover"
      />
    );
  }

  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))`,
      }}
    >
      {initial}
    </span>
  );
}

function MemberRow({ m, index }) {
  const display = m.nickname || m.username;
  const joined = m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.25), duration: 0.3, ease: EASE }}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
    >
      <MemberAvatar member={m} />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-bold text-white">{display}</span>
          {m.nickname && (
            <span className="hidden truncate text-[10px] text-slate-500 sm:block">@{m.username}</span>
          )}
          {m.bot && (
            <span className="shrink-0 rounded-full border border-[#7C5CFF]/40 bg-[#7C5CFF]/15 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-[#B9A6FF]">
              BOT
            </span>
          )}
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[10px] text-slate-600">
          <span className="truncate font-mono">{m.id}</span>
          <span className="text-slate-700">·</span>
          <span className="whitespace-nowrap">Joined {joined}</span>
        </div>
      </div>

      <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold text-slate-400">
        {m.roleCount} {m.roleCount === 1 ? "role" : "roles"}
      </span>
    </motion.div>
  );
}

function SkeletonRows() {
  return (
    <div className="panel divide-y divide-white/[0.04] overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/[0.05]" />
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

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex flex-wrap items-center gap-2.5 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <Users className="h-4 w-4" />
            </span>
            Members
            {typeof memberCount === "number" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#39D98A]/30 bg-[#39D98A]/10 px-2.5 py-1 text-[10px] font-bold text-[#39D98A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#39D98A] animate-pulse-dot" />
                {memberCount.toLocaleString("en-US")} members
              </span>
            )}
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
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
        <motion.div
          variants={rise}
          className="panel flex flex-col items-center justify-center gap-2 py-16 text-center"
        >
          <Users className="h-8 w-8 text-slate-700" />
          <p className="text-sm font-bold text-slate-400">No server selected</p>
          <p className="max-w-sm text-[11px] text-slate-600">
            Pick a server from the sidebar to browse its live member roster.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Search */}
          <motion.div variants={rise} className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username, nickname or ID…"
                className={`${inputCls} py-2 pl-9 text-xs`}
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
              <div className="panel flex flex-col items-center justify-center gap-2 py-14 text-center">
                <WifiOff className="h-8 w-8 text-slate-700" />
                <p className="text-sm font-bold text-slate-400">Couldn&apos;t load members</p>
                <p className="max-w-md px-4 text-[11px] text-slate-600">{error}</p>
                <button type="button" onClick={() => load(serverQuery)} className={`${btnGhost} mt-2`}>
                  <RefreshCw className="h-3.5 w-3.5" /> Try again
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="panel flex flex-col items-center justify-center gap-2 py-14 text-center">
                <Inbox className="h-8 w-8 text-slate-700" />
                <p className="text-sm font-bold text-slate-400">No members found</p>
                <p className="text-[11px] text-slate-600">
                  {q
                    ? "Try a different search."
                    : "This server's roster is empty — nothing to show yet."}
                </p>
              </div>
            ) : (
              <div className="panel divide-y divide-white/[0.04] overflow-hidden">
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
