"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Plus,
  Trash2,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CalendarClock,
  PauseCircle,
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

/* ────────────────────────────── helpers ────────────────────────────── */

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const mins = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = mins / 60;
  if (h < 24) return `${h < 10 ? h.toFixed(1) : Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/* The API's canonical interval unit is seconds (TimedMessage model / bot scheduler),
   while this UI works in milliseconds — convert at the API boundary only. */
const intervalToMs = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n * 1000 : 0;
};

/* The bot's /timedmessage command and the API schema both enforce 300..604800 s
   (5 min .. 7 days). Clamp here so a legacy sub-5-minute (or over-long) row can still
   be re-saved from the toggle instead of bouncing a 400 back at the user. */
const MIN_INTERVAL_SEC = 300;
const MAX_INTERVAL_SEC = 604800;
const intervalToSec = (ms) =>
  Math.min(
    MAX_INTERVAL_SEC,
    Math.max(MIN_INTERVAL_SEC, Math.round((Number(ms) || 0) / 1000))
  );

/* API failures come back as { error, details } — `details` is a raw zod dump that must
   never reach the toast. Map the known shapes onto human copy, otherwise use the server's
   own one-line `error` string when it is a string. */
function humanError(data, fallback) {
  const raw = data && typeof data.error === "string" ? data.error.trim() : "";
  if (!raw) return fallback;
  if (/^invalid timed message$/i.test(raw)) {
    return "Couldn't save — pick a channel and a repeat interval between 5 minutes and 7 days";
  }
  return raw;
}

function formatCountdown(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "under a minute";
  if (mins < 60) return `${mins}m`;
  const h = mins / 60;
  if (h < 24) return `${h < 10 ? h.toFixed(1) : Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

function nextIn(msg) {
  if (msg.nextSendAt) {
    const at = new Date(msg.nextSendAt).getTime();
    if (Number.isFinite(at)) {
      const diff = at - Date.now();
      return diff <= 0 ? "due now" : `in ${formatCountdown(diff)}`;
    }
  }
  if (!msg.lastSentAt) return "queued";
  const next = new Date(msg.lastSentAt).getTime() + msg.interval - Date.now();
  if (!Number.isFinite(next)) return "queued";
  if (next <= 0) return "due now";
  return `in ${formatCountdown(next)}`;
}

function formatInterval(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  if (ms < 60000) return `${ms / 1000}s`;
  if (ms < 3600000) return `${ms / 60000}m`;
  if (ms < 86400000) return `${ms / 3600000}h`;
  return `${ms / 86400000}d`;
}

/* ────────────────────────────── seed data ────────────────────────────── */

const INITIAL_MESSAGES = [
  {
    id: 1,
    channelId: "#announcements",
    content: "Welcome to Crystal Realm! Grab your roles in #bot-commands and introduce yourself in #general.",
    interval: 3600000,
    enabled: true,
    lastSentAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 2,
    channelId: "#general",
    content: "Need a hand? Open a ticket in #support-desk and the team will be with you shortly.",
    interval: 7200000,
    enabled: true,
    lastSentAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 3,
    channelId: "#bot-commands",
    content: "🎉 Giveaways are live! Enter with /giveaway enter before the timer runs out.",
    interval: 86400000,
    enabled: false,
    lastSentAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

/* Picker values are in ms; POST converts to the API's canonical seconds (intervalToSec). */
/* Minimum is 5 min — the bot command and the API both enforce a 300 s floor. */
const INTERVAL_OPTIONS = [
  { value: 300000, label: "5 min" },
  { value: 600000, label: "10 min" },
  { value: 3600000, label: "1 hour" },
  { value: 21600000, label: "6 hours" },
  { value: 86400000, label: "1 day" },
  { value: 604800000, label: "7 days" },
];

/* Server row → view shape (interval normalized from canonical seconds to ms). */
const mapMessage = (m) => ({
  id: m.id,
  channelId: m.channelId != null ? String(m.channelId) : "",
  content: m.content || "",
  interval: intervalToMs(m.interval),
  enabled: Boolean(m.enabled),
  lastSentAt: m.lastSentAt || null,
  nextSendAt: m.nextSendAt || null,
  real: true,
});

const inputCls =
  "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C5CFF]/50 transition-colors";

const selectCls = `${inputCls} cursor-pointer [&>option]:bg-[#0B0D12] [&>option]:text-white`;

/* ────────────────────────────── atoms ────────────────────────────── */

function StatCard({ label, value, icon: Icon, color, index }) {
  const count = useCountUp(value, { duration: 700 + index * 90 });
  return (
    <div className="panel panel-hover p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="section-label">{label}</span>
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      </div>
      <div className="mt-2 text-xl font-extrabold text-white tabular-nums">{Math.round(count)}</div>
    </div>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors cursor-pointer ${
        enabled ? "border-[#7C5CFF]/50 bg-[#7C5CFF]/80" : "border-white/[0.08] bg-white/[0.05]"
      }`}
      aria-pressed={enabled}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow ${
          enabled ? "left-[25px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function TimedMessages({ guildId }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [showCreator, setShowCreator] = useState(false);
  const [newChannel, setNewChannel] = useState("#announcements");
  const [newContent, setNewContent] = useState("");
  const [newInterval, setNewInterval] = useState(3600000);
  const [toast, setToast] = useState(null);
  /* null = channel list unavailable (guest mode, fetch failure, no text channels)
     → the creator falls back to the manual channel-id input. */
  const [channels, setChannels] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /* request guard — only the latest load may write state */
  const requestSeq = useRef(0);

  /* real data — demo array is the fallback for guest mode / fetch failure */
  const loadMessages = useCallback(async () => {
    const requestId = ++requestSeq.current;
    if (!guildId) {
      setMessages(INITIAL_MESSAGES);
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/timed-messages`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== requestSeq.current) return; // stale response from a previous guild
      setMessages((Array.isArray(data?.messages) ? data.messages : []).map(mapMessage));
    } catch (err) {
      if (requestId !== requestSeq.current) return; // stale failure — ignore
      console.warn("[TimedMessages] Failed to load timed messages — showing demo data:", err);
      setMessages(INITIAL_MESSAGES);
    }
  }, [guildId]);

  useEffect(() => {
    loadMessages();
    return () => {
      // Invalidate in-flight loads so a previous guild's response can't clobber state.
      requestSeq.current += 1;
    };
  }, [loadMessages]);

  /* request guard for the channel list — only the latest load may write state */
  const channelSeq = useRef(0);

  /* The API stores a channel snowflake, not a #name — so real mode offers a live picker.
     Falls back to a manual-id input whenever the list can't be produced. */
  const loadChannels = useCallback(async () => {
    const requestId = ++channelSeq.current;
    if (!guildId) {
      setChannels(null);
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/channels`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== channelSeq.current) return; // stale response from a previous guild
      const rows = (Array.isArray(data?.channels) ? data.channels : [])
        .filter((c) => c && c.id != null && Number(c.type) === 0)
        .map((c) => ({ id: String(c.id), name: c.name || String(c.id) }));
      setChannels(rows.length > 0 ? rows : null);
    } catch (err) {
      if (requestId !== channelSeq.current) return;
      console.warn("[TimedMessages] Failed to load channels — using a manual channel id input:", err);
      setChannels(null);
    }
  }, [guildId]);

  useEffect(() => {
    loadChannels();
    return () => {
      channelSeq.current += 1;
    };
  }, [loadChannels]);

  /* Keep the selection valid across refreshes: the seeded "#announcements" (and any id that
     no longer exists) snaps to the first live text channel. */
  useEffect(() => {
    if (!channels || channels.length === 0) return;
    setNewChannel((prev) => (channels.some((c) => c.id === prev) ? prev : channels[0].id));
  }, [channels]);

  const channelLabel = (id) => {
    const key = String(id ?? "");
    const match = channels ? channels.find((c) => c.id === key) : null;
    return match ? `#${match.name}` : key;
  };

  const createMessage = async () => {
    if (!newContent.trim() || !newChannel.trim()) return;

    if (!guildId) {
      const msg = {
        id: Date.now(),
        channelId: newChannel.trim(),
        content: newContent.trim(),
        interval: newInterval,
        enabled: true,
        lastSentAt: null,
      };
      setMessages([msg, ...messages]);
      setNewContent("");
      setShowCreator(false);
      showToast(`Message scheduled — repeats every ${formatInterval(newInterval)}`);
      return;
    }

    try {
      const res = await fetch(`/api/guilds/${guildId}/timed-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: newChannel.trim(),
          content: newContent.trim(),
          interval: intervalToSec(newInterval),
          enabled: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.message) {
        showToast(humanError(data, "Failed to schedule message"));
        return;
      }
    } catch (err) {
      console.warn("[TimedMessages] Failed to schedule message:", err);
      showToast("Network error while scheduling message");
      return;
    }

    setNewContent("");
    setShowCreator(false);
    showToast(`Message scheduled — repeats every ${formatInterval(newInterval)}`);
    await loadMessages();
  };

  const toggleMessage = async (id) => {
    const target = messages.find((m) => m.id === id);
    if (!target) return;

    if (guildId && target.real) {
      // Persist via the same upsert endpoint, then refresh the section.
      try {
        const res = await fetch(`/api/guilds/${guildId}/timed-messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: target.id,
            channelId: target.channelId,
            content: target.content,
            interval: intervalToSec(target.interval),
            enabled: !target.enabled,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.message) {
          showToast(humanError(data, "Failed to update message"));
          return;
        }
        await loadMessages();
      } catch (err) {
        console.warn("[TimedMessages] Failed to update message:", err);
        showToast("Network error while updating message");
      }
      return;
    }

    // Guest demo / fallback rows update locally — there is no real row to persist to.
    setMessages(messages.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
  };

  const deleteMessage = async (id) => {
    const target = messages.find((m) => m.id === id);
    if (!target) return;

    if (guildId && target.real) {
      try {
        const res = await fetch(`/api/guilds/${guildId}/timed-messages/${target.id}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(humanError(data, "Failed to delete message"));
          return;
        }
        await loadMessages();
      } catch (err) {
        console.warn("[TimedMessages] Failed to delete message:", err);
        showToast("Network error while deleting message");
        return;
      }
      showToast("Timed message deleted");
      return;
    }

    setMessages(messages.filter((m) => m.id !== id));
    showToast("Timed message deleted");
  };

  const activeCount = messages.filter((m) => m.enabled).length;
  const pausedCount = messages.length - activeCount;

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
              <Clock className="h-4 w-4" />
            </span>
            Timed Messages
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Schedule messages to automatically repeat in your channels at set intervals.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreator(!showCreator)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
            showCreator
              ? "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.08]"
              : "bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white shadow-[0_0_18px_rgba(124,92,255,0.35)]"
          }`}
        >
          {showCreator ? <XCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showCreator ? "Cancel" : "New message"}
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={rise} className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Scheduled messages" value={messages.length} icon={CalendarClock} color="#7C5CFF" index={0} />
        <StatCard label="Active now" value={activeCount} icon={RefreshCw} color="#39D98A" index={1} />
        <StatCard label="Paused" value={pausedCount} icon={PauseCircle} color="#FFB547" index={2} />
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
                <Plus className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">Schedule repeating message</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick a channel, write the message, and choose how often it repeats.
                </p>
              </div>
            </div>

            <label className="block min-w-0">
              <span className="section-label mb-1.5 block">Target channel</span>
              {channels ? (
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  className={selectCls}
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  placeholder={guildId ? "Channel ID" : "#announcements"}
                  className={inputCls}
                />
              )}
              {channels ? (
                <span className="mt-1.5 block text-[10px] text-slate-600">
                  Live text channels from this server — the bot posts to the one you pick.
                </span>
              ) : null}
            </label>

            <label className="block min-w-0">
              <span className="section-label mb-1.5 block">Message content</span>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
                placeholder="Enter the message content to repeat…"
                className={`${inputCls} resize-none`}
              />
            </label>

            <div className="min-w-0">
              <span className="section-label mb-1.5 block">Repeat interval</span>
              <div className="flex flex-wrap gap-2">
                {INTERVAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewInterval(opt.value)}
                    className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold transition-colors cursor-pointer ${
                      newInterval === opt.value
                        ? "border-[#7C5CFF]/40 bg-[#7C5CFF]/10 text-[#B9A6FF]"
                        : "border-white/[0.07] bg-white/[0.02] text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={createMessage}
                disabled={!newContent.trim() || !newChannel.trim()}
                className={`inline-flex items-center gap-1.5 bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] cursor-pointer ${
                  !newContent.trim() || !newChannel.trim() ? "opacity-50" : ""
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                Schedule message
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages list */}
      {messages.length === 0 ? (
        <motion.div
          variants={rise}
          className="panel flex flex-col items-center justify-center gap-2 py-14 text-center"
        >
          <Clock className="h-8 w-8 text-slate-700" />
          <p className="text-sm font-bold text-slate-400">No timed messages scheduled</p>
          <p className="text-[11px] text-slate-600">
            Create one above to keep your channels on a rhythm.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={rise} className="panel divide-y divide-white/[0.04] overflow-hidden">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                  msg.enabled
                    ? "border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]"
                    : "border-white/[0.06] bg-white/[0.02] text-slate-600"
                }`}
              >
                <RefreshCw className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono">{channelLabel(msg.channelId)}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-400">
                    Every {formatInterval(msg.interval)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      msg.enabled
                        ? "bg-[#39D98A]/10 border-[#39D98A]/25 text-[#39D98A]"
                        : "bg-white/[0.04] border-white/[0.08] text-slate-500"
                    }`}
                  >
                    {msg.enabled ? "ACTIVE" : "PAUSED"}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-xs text-slate-300">{msg.content}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {msg.lastSentAt
                    ? `Last sent ${timeAgo(msg.lastSentAt)} · next ${nextIn(msg)}`
                    : msg.nextSendAt
                      ? `First send ${nextIn(msg)}`
                      : "Not sent yet — first send is queued"}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Toggle enabled={msg.enabled} onChange={() => toggleMessage(msg.id)} />
                <button
                  type="button"
                  onClick={() => deleteMessage(msg.id)}
                  title="Delete message"
                  className="p-2 rounded-lg text-slate-500 hover:text-[#FF5C7A] hover:bg-[#FF5C7A]/10 transition-colors cursor-pointer"
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
