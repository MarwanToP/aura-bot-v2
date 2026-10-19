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

function StatCard({ label, value, icon: Icon, tone = "violet", index }) {
  const count = useCountUp(value, { duration: 700 + index * 90 });
  return (
    <div className="kpi-tile">
      <div className="flex items-start justify-between gap-3">
        <span className="kpi-label">{label}</span>
        <span className={`icon-tile icon-tile-${tone} h-9 w-9 rounded-[12px]`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="kpi-value mt-3">{Math.round(count).toLocaleString("en-US")}</div>
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
    if (!Number.isFinite(diff)) return "No end date";
    if (diff <= 0) return "Ended";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h remaining`;
    return `${h}h ${m}m remaining`;
  };

  /* "Oct 21, 14:00" — only when the stored end date is a real date */
  const endsAtLabel = (endsAt) => {
    if (!endsAt) return null;
    const d = new Date(endsAt);
    if (!Number.isFinite(d.getTime())) return null;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            className="glass-dropdown fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold"
          >
            <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-violet">
            <Gift className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[15px]">Giveaways</h2>
            <p className="card-sub mt-0.5">
              {guildId
                ? "Live giveaways for this server. They are created and drawn in Discord — this list is read-only here."
                : "Create, manage, and end giveaways directly from the dashboard — winners are drawn automatically."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreator(!showCreator)}
          disabled={Boolean(guildId)}
          title={guildId ? "Create giveaways with /giveaway in Discord" : undefined}
          className={showCreator ? "btn-glass" : "btn-primary"}
        >
          {showCreator ? <XCircle className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showCreator ? "Cancel" : "New giveaway"}
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={rise} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active giveaways" value={activeCount} icon={Gift} tone="violet" index={0} />
        <StatCard label="Total entries" value={totalEntries} icon={Users} tone="blue" index={1} />
        <StatCard label="Winners drawn" value={winnersDrawn} icon={Trophy} tone="green" index={2} />
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
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile-pink h-9 w-9 rounded-[12px]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">New giveaway</h3>
                <p className="card-sub mt-0.5">
                  Configure the prize and timer, then launch it in one channel.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block min-w-0">
                <span className="section-label mb-1.5 block">Prize</span>
                <input
                  type="text"
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  placeholder="e.g. Discord Nitro, Steam Wallet…"
                  className="glass-input"
                />
              </label>

              <label className="block min-w-0">
                <span className="section-label mb-1.5 block">Channel</span>
                <input
                  type="text"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  placeholder="#announcements"
                  className="glass-input"
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
                  className="glass-input tabular-nums"
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
                      className={`seg-tab ${
                        duration === opt.value ? "seg-tab-active" : ""
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
                  className="glass-input"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={createGiveaway}
                disabled={!prize.trim() || Boolean(guildId)}
                title={guildId ? "Create giveaways with /giveaway in Discord" : undefined}
                className="btn-primary"
              >
                <Gift className="h-3.5 w-3.5" />
                Launch giveaway
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Giveaways list */}
      {giveaways.length === 0 ? (
        <motion.div variants={rise} className="empty-state">
          <span className="empty-state-icon">
            <Gift className="h-4 w-4" />
          </span>
          <span className="empty-state-title">No giveaways yet</span>
          <span>
            {guildId
              ? "Run /giveaway start in Discord to launch the first one."
              : "Launch your first one to start collecting entries."}
          </span>
        </motion.div>
      ) : (
        <motion.div
          variants={rise}
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {giveaways.map((gw) => {
            const endsLabel = endsAtLabel(gw.endsAt);
            return (
              <div key={gw.id} className="glass-card glass-card-hover p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`icon-tile h-9 w-9 rounded-[12px] ${
                      gw.active ? "icon-tile-violet" : "icon-tile-blue"
                    }`}
                  >
                    <Gift className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-xs font-bold text-white">{gw.prize}</h4>
                      <span
                        className={`chip ${
                          gw.active ? "chip-green" : "chip-cyan"
                        }`}
                      >
                        {gw.active ? "Active" : "Ended"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="chip chip-blue">
                        <Users className="h-3 w-3" />
                        {gw.entries} entries
                      </span>
                      <span className="chip chip-amber">
                        <Trophy className="h-3 w-3" />
                        {gw.winnerCount} winner{gw.winnerCount > 1 ? "s" : ""}
                      </span>
                      {gw.channelId ? <span className="chip">{gw.channelId}</span> : null}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
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
                      {endsLabel ? <span className="text-slate-600">· ends {endsLabel}</span> : null}
                      {(gw.host || gw.hostId) ? (
                        <span className="text-slate-600">
                          · hosted by {gw.host || <span className="font-mono">{shortId(gw.hostId)}</span>}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {gw.active && (
                      <button
                        type="button"
                        onClick={() => endGiveaway(gw.id)}
                        disabled={Boolean(guildId)}
                        title={guildId ? "End giveaways with /giveaway end in Discord" : undefined}
                        className="btn-glass h-8 px-2.5 text-[10px]"
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
                      className="btn-icon h-8 w-8 rounded-[10px] hover:text-[#F87171] hover:border-[#F87171]/40 hover:bg-[#F87171]/10 hover:shadow-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
