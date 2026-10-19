"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Plus,
  Trash2,
  Clock,
  Users,
  Trophy,
  CheckCircle2,
  XCircle,
  Sparkles,
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

/* Count-up hook (respects reduced motion) */
function useCountUp(target, { duration = 1100 } = {}) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVal(target);
      return;
    }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}

/* ────────────────────────────── seed data ────────────────────────────── */

const INITIAL_GIVEAWAYS = [
  {
    id: 1,
    prize: "Nitro Classic · 1 Month",
    channelId: "#announcements",
    winnerCount: 1,
    endsAt: new Date(Date.now() + 86400000).toISOString(),
    active: true,
    entries: 47,
    host: "Aurora",
  },
  {
    id: 2,
    prize: "Steam Gift Card · $50",
    channelId: "#general",
    winnerCount: 3,
    endsAt: new Date(Date.now() + 172800000).toISOString(),
    active: true,
    entries: 124,
    host: "Kai",
  },
  {
    id: 3,
    prize: "Discord Nitro Basic · 1 Month",
    channelId: "#bot-commands",
    winnerCount: 1,
    endsAt: new Date(Date.now() - 3600000).toISOString(),
    active: false,
    entries: 89,
    winner: "LunaByte",
    host: "Aurora",
  },
];

const WINNER_POOL = ["NovaStar", "pixelForge", "LunaByte", "EchoVortex", "MiraGlow"];

const DURATION_OPTIONS = [
  { value: 1, label: "1 Hour" },
  { value: 6, label: "6 Hours" },
  { value: 24, label: "24 Hours" },
  { value: 48, label: "48 Hours" },
  { value: 72, label: "3 Days" },
  { value: 168, label: "7 Days" },
];

const inputCls =
  "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C5CFF]/50 transition-colors";

/* ────────────────────────────── api mapping ────────────────────────────── */

const shortId = (id) => {
  const s = String(id ?? "");
  return s.length > 6 ? `…${s.slice(-6)}` : s;
};

/* winners is a TEXT column holding a JSON array of userIds (null while active) */
function parseWinnerIds(winners) {
  if (Array.isArray(winners)) return winners.map(String);
  if (typeof winners === "string" && winners.trim()) {
    try {
      const parsed = JSON.parse(winners);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* not JSON — treat as unknown */
    }
  }
  return [];
}

function mapGiveaway(g) {
  return {
    id: g?.id ?? null,
    prize: typeof g?.prize === "string" && g.prize.trim() ? g.prize : "Untitled giveaway",
    channelId: g?.channelId ?? null,
    winnerCount: Math.max(1, Number(g?.winnerCount) || 1),
    endsAt: g?.endsAt ?? null,
    active: Boolean(g?.active),
    entries: Math.max(0, Number(g?.entries) || 0),
    hostId: g?.hostId ?? null,
    winners: parseWinnerIds(g?.winners),
  };
}

/* ────────────────────────────── atoms ────────────────────────────── */

function StatCard({ label, value, icon: Icon, color, index }) {
  const count = useCountUp(value, { duration: 700 + index * 90 });
  return (
    <div className="panel panel-hover p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="section-label">{label}</span>
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      </div>
      <div className="mt-2 text-xl font-extrabold text-white tabular-nums">
        {Math.round(count).toLocaleString("en-US")}
      </div>
    </div>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function GiveawaySettings({ guildId }) {
  const [giveaways, setGiveaways] = useState(INITIAL_GIVEAWAYS);
  const [showCreator, setShowCreator] = useState(false);
  const [prize, setPrize] = useState("");
  const [channel, setChannel] = useState("#announcements");
  const [winnerCount, setWinnerCount] = useState(1);
  const [duration, setDuration] = useState(24);
  const [requirements, setRequirements] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /* real data — demo rows stay the fallback for guest mode / fetch failure */
  useEffect(() => {
    if (!guildId) {
      setGiveaways(INITIAL_GIVEAWAYS);
      return undefined;
    }
    let cancelled = false;
    /* A create form can only be open in demo mode — never leave a dead form over a real list. */
    setShowCreator(false);
    (async () => {
      try {
        const res = await fetch(`/api/guilds/${guildId}/giveaways`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setGiveaways((Array.isArray(data?.giveaways) ? data.giveaways : []).map(mapGiveaway));
      } catch (err) {
        if (cancelled) return;
        console.warn("[GiveawaySettings] Failed to load giveaways — showing demo data:", err);
        setGiveaways(INITIAL_GIVEAWAYS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  const createGiveaway = () => {
    /* There is no create endpoint behind this form — in real mode we must never insert a
       locally-built row into the server's list. The bot owns giveaway creation. */
    if (guildId) {
      showToast("Create giveaways with /giveaway start in Discord");
      return;
    }
    if (!prize.trim()) return;
    const newGw = {
      id: Date.now(),
      prize: prize.trim(),
      channelId: channel.trim() || "#announcements",
      winnerCount,
      endsAt: new Date(Date.now() + duration * 3600000).toISOString(),
      active: true,
      entries: 0,
      host: "You",
    };
    setGiveaways([newGw, ...giveaways]);
    setPrize("");
    setShowCreator(false);
    showToast("Giveaway launched — members can enter with /giveaway enter");
  };

  const endGiveaway = (id) => {
    /* There is no end endpoint behind this button either — the bot draws winners and ends the
       giveaway. Flipping `active` locally would make the row look persisted when nothing was. */
    if (guildId) {
      showToast("End giveaways with /giveaway end in Discord");
      return;
    }
    setGiveaways(
      giveaways.map((g) =>
        g.id === id
          ? {
              ...g,
              active: false,
              winner: WINNER_POOL[Math.floor(Math.random() * WINNER_POOL.length)],
            }
          : g
      )
    );
    showToast("Giveaway ended — winners drawn and announced");
  };

  const deleteGiveaway = (id) => {
    /* Same story — dropping the row here only hides a giveaway that is still live in Discord. */
    if (guildId) {
      showToast("Delete giveaways with /giveaway in Discord");
      return;
    }
    setGiveaways(giveaways.filter((g) => g.id !== id));
    showToast("Giveaway deleted");
  };

  const timeLeft = (endsAt) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h remaining`;
    return `${h}h ${m}m remaining`;
  };

  const activeCount = giveaways.filter((g) => g.active).length;
  const totalEntries = giveaways.reduce((sum, g) => sum + g.entries, 0);
  /* use actually-recorded winners when present; configured count is the last resort */
  const winnersDrawn = giveaways
    .filter((g) => !g.active)
    .reduce(
      (sum, g) =>
        sum + (Array.isArray(g.winners) && g.winners.length > 0 ? g.winners.length : g.winnerCount),
      0
    );

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
              <Gift className="h-4 w-4" />
            </span>
            Giveaways
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            {guildId
              ? "Live giveaways for this server. They are created and drawn in Discord — this list is read-only here."
              : "Create, manage, and end giveaways directly from the dashboard — winners are drawn automatically."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreator(!showCreator)}
          disabled={Boolean(guildId)}
          title={guildId ? "Create giveaways with /giveaway in Discord" : undefined}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
            showCreator
              ? "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.08]"
              : "bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white shadow-[0_0_18px_rgba(124,92,255,0.35)]"
          }${guildId ? " disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none" : ""}`}
        >
          {showCreator ? <XCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showCreator ? "Cancel" : "New giveaway"}
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={rise} className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Active giveaways" value={activeCount} icon={Gift} color="#7C5CFF" index={0} />
        <StatCard label="Total entries" value={totalEntries} icon={Users} color="#5B8CFF" index={1} />
        <StatCard label="Winners drawn" value={winnersDrawn} icon={Trophy} color="#39D98A" index={2} />
      </motion.div>

      {/* Creator form */}
      <AnimatePresence initial={false}>
        {showCreator && (
          <motion.div
            key="creator"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="panel p-5 space-y-5"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">New giveaway</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the prize and timer, then launch it in one channel.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block min-w-0">
                <span className="section-label mb-1.5 block">Prize</span>
                <input
                  type="text"
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  placeholder="e.g. Discord Nitro, Steam Wallet…"
                  className={inputCls}
                />
              </label>

              <label className="block min-w-0">
                <span className="section-label mb-1.5 block">Channel</span>
                <input
                  type="text"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  placeholder="#announcements"
                  className={inputCls}
                />
              </label>

              <label className="block min-w-0">
                <span className="section-label mb-1.5 block">Winners</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={winnerCount}
                  onChange={(e) => setWinnerCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className={inputCls}
                />
              </label>

              <div className="min-w-0">
                <span className="section-label mb-1.5 block">Duration</span>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDuration(opt.value)}
                      className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold transition-colors cursor-pointer ${
                        duration === opt.value
                          ? "border-[#7C5CFF]/40 bg-[#7C5CFF]/10 text-[#B9A6FF]"
                          : "border-white/[0.07] bg-white/[0.02] text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block min-w-0 md:col-span-2">
                <span className="section-label mb-1.5 block">Requirements (optional)</span>
                <input
                  type="text"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="e.g. Must have been in the server for 7 days"
                  className={inputCls}
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={createGiveaway}
                disabled={!prize.trim() || Boolean(guildId)}
                title={guildId ? "Create giveaways with /giveaway in Discord" : undefined}
                className={`inline-flex items-center gap-1.5 bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] cursor-pointer ${
                  !prize.trim() || guildId ? "opacity-50" : ""
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                Launch giveaway
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Giveaways list */}
      {giveaways.length === 0 ? (
        <motion.div
          variants={rise}
          className="panel flex flex-col items-center justify-center gap-2 py-14 text-center"
        >
          <Gift className="h-8 w-8 text-slate-700" />
          <p className="text-sm font-bold text-slate-400">No giveaways yet</p>
          <p className="text-[11px] text-slate-600">
            {guildId
              ? "Run /giveaway start in Discord to launch the first one."
              : "Launch your first one to start collecting entries."}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={rise} className="panel divide-y divide-white/[0.04] overflow-hidden">
          {giveaways.map((gw) => (
            <div
              key={gw.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                  gw.active
                    ? "border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]"
                    : "border-white/[0.06] bg-white/[0.02] text-slate-600"
                }`}
              >
                <Gift className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-xs font-bold text-white">{gw.prize}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      gw.active
                        ? "bg-[#39D98A]/10 border-[#39D98A]/25 text-[#39D98A]"
                        : "bg-white/[0.04] border-white/[0.08] text-slate-500"
                    }`}
                  >
                    {gw.active ? "ACTIVE" : "ENDED"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {gw.entries} entries
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {gw.winnerCount} winner{gw.winnerCount > 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {gw.active
                      ? gw.endsAt
                        ? timeLeft(gw.endsAt)
                        : "No end date"
                      : gw.winners?.length
                        ? `${gw.winners.length} winner${gw.winners.length > 1 ? "s" : ""} drawn`
                        : gw.winner
                          ? `Won by ${gw.winner}`
                          : "Ended"}
                  </span>
                  {gw.channelId && (
                    <span className="font-mono text-slate-600">{gw.channelId}</span>
                  )}
                  {(gw.host || gw.hostId) && (
                    <span className="text-slate-600">
                      hosted by {gw.host || <span className="font-mono">{shortId(gw.hostId)}</span>}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {gw.active && (
                  <button
                    type="button"
                    onClick={() => endGiveaway(gw.id)}
                    disabled={Boolean(guildId)}
                    title={guildId ? "End giveaways with /giveaway end in Discord" : undefined}
                    className={`inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[10px] font-bold text-slate-400 transition-colors hover:text-white hover:bg-white/[0.04] cursor-pointer${
                      guildId ? " disabled:opacity-50 disabled:cursor-not-allowed" : ""
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    End early
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteGiveaway(gw.id)}
                  disabled={Boolean(guildId)}
                  title={guildId ? "Delete giveaways with /giveaway in Discord" : "Delete giveaway"}
                  className={`p-2 rounded-lg text-slate-500 hover:text-[#FF5C7A] hover:bg-[#FF5C7A]/10 transition-colors cursor-pointer${
                    guildId ? " disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-500 disabled:hover:bg-transparent" : ""
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
