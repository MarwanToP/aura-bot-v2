"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, TrendingUp, Save, Settings2, Hash, CheckCircle2, Inbox, User } from "lucide-react";

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

/* ────────────────────────────── static data ────────────────────────────── */

const STARRED_MESSAGES = [
  {
    id: 1,
    author: "NovaStar",
    hue: 268,
    content: "This community is absolutely amazing! 🎉 Three years in and it still feels like day one.",
    stars: 42,
    channel: "#general",
    time: "2h ago",
  },
  {
    id: 2,
    author: "LunaByte",
    hue: 190,
    content: "Check out the fan art MiraGlow made for the anniversary stream — absolutely stunning.",
    stars: 31,
    channel: "#general",
    time: "5h ago",
  },
  {
    id: 3,
    author: "pixelForge",
    hue: 210,
    content: "Thank you everyone for the warm welcome to the mod team! 🙏",
    stars: 27,
    channel: "#announcements",
    time: "1d ago",
  },
  {
    id: 4,
    author: "EchoVortex",
    hue: 225,
    content: "Huge shoutout to Kai for walking me through the verification fix — sorted in five minutes.",
    stars: 19,
    channel: "#support-desk",
    time: "3d ago",
  },
];

/* ────────────────────────────── api mapping ────────────────────────────── */

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (!Number.isFinite(t)) return null;
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = mins / 60;
  if (h < 24) return `${h < 10 ? h.toFixed(1) : Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/* Real rows carry raw Discord ids — show a muted short form (no fabricated names). */
const shortId = (id) => {
  const s = String(id ?? "").trim();
  return s ? `…${s.slice(-6)}` : "—";
};

function hashHue(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

const mapEntry = (e) => ({
  messageId: e.messageId,
  channelId: e.channelId != null ? String(e.channelId) : "",
  authorId: e.authorId != null ? String(e.authorId) : "",
  starCount: Number(e.starCount) || 0,
  createdAt: e.createdAt || null,
});

/* Config payload → local editing shape, with safe defaults (never undefined/NaN). */
function normalizeConfig(cfg) {
  const c = cfg && typeof cfg === "object" ? cfg : {};
  const t = Number(c.threshold);
  return {
    enabled: Boolean(c.enabled),
    channelId: c.channelId != null ? String(c.channelId) : "",
    threshold: Number.isFinite(t) && t > 0 ? Math.round(t) : 3,
    emoji: typeof c.emoji === "string" && c.emoji ? c.emoji : "⭐",
  };
}

/* ────────────────────────────── shared atoms ────────────────────────────── */

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
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

export default function StarboardSettings({ guildId }) {
  const [threshold, setThreshold] = useState(3);
  const [enabled, setEnabled] = useState(true);
  const [channelId, setChannelId] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [entries, setEntries] = useState([]);
  const [live, setLive] = useState(false);
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /* request guard — only the latest load may write state */
  const requestSeq = useRef(0);

  /* real data — demo markup/fallback stays in charge when there is no guild or the fetch fails */
  const loadStarboard = useCallback(async () => {
    const requestId = ++requestSeq.current;
    if (!guildId) {
      setLive(false);
      setEntries([]);
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/starboard`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== requestSeq.current) return; // stale response from a previous guild
      const cfg = normalizeConfig(data?.config);
      setEnabled(cfg.enabled);
      setThreshold(cfg.threshold);
      setChannelId(cfg.channelId);
      setEmoji(cfg.emoji);
      setEntries((Array.isArray(data?.entries) ? data.entries : []).map(mapEntry));
      setLive(true);
    } catch (err) {
      if (requestId !== requestSeq.current) return; // stale failure — ignore
      // Keep the current humanized fallback quietly (live stays false → demo markup).
      console.warn("[StarboardSettings] Failed to load starboard — showing demo data:", err);
    }
  }, [guildId]);

  useEffect(() => {
    loadStarboard();
    return () => {
      // Invalidate in-flight loads so a previous guild's response can't clobber state.
      requestSeq.current += 1;
    };
  }, [loadStarboard]);

  const saveConfig = async () => {
    if (!guildId) {
      showToast("Starboard settings saved — highlights are live");
      return;
    }
    if (!live) {
      // No truthful config to write yet — never persist demo values over real settings.
      showToast("Couldn't load live settings — nothing was saved");
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/starboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          channelId: channelId.trim() || null,
          threshold: Math.min(100, Math.max(1, Math.round(Number(threshold) || 3))),
          emoji: (emoji.trim() || "⭐").slice(0, 50),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Failed to save starboard settings");
        return;
      }
      if (data && data.config && typeof data.config === "object") {
        const cfg = normalizeConfig(data.config);
        setEnabled(cfg.enabled);
        setThreshold(cfg.threshold);
        setChannelId(cfg.channelId);
        setEmoji(cfg.emoji);
      } else {
        await loadStarboard();
      }
      showToast("Starboard settings saved — highlights are live");
    } catch (err) {
      console.warn("[StarboardSettings] Failed to save starboard settings:", err);
      showToast("Network error while saving starboard settings");
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="panel fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="h-4 w-4 text-[#39D98A]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <Star className="h-4 w-4" />
            </span>
            Starboard
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Highlight the best messages with a starboard channel.
          </p>
        </div>
        <button
          type="button"
          onClick={saveConfig}
          className="inline-flex items-center gap-2 rounded-lg bg-[#7C5CFF] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_0_18px_rgba(124,92,255,0.35)] transition-colors hover:bg-[#6a4cf0]"
        >
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Settings */}
        <motion.div variants={rise} className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
                <Settings2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-white">Settings</h3>
                <p className="mt-1 text-xs text-slate-500">Channel, threshold, and visibility</p>
              </div>
            </div>
            <Toggle enabled={enabled} onChange={setEnabled} />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="section-label">Star Threshold</span>
              <span className="rounded-full border border-[#FFB547]/25 bg-[#FFB547]/10 px-2 py-0.5 text-[10px] font-bold text-[#FFB547] tabular-nums">
                {threshold} stars
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="mt-3 w-full cursor-pointer accent-[#7C5CFF]"
            />
            <p className="mt-2 text-[10px] text-slate-600">
              Messages need {threshold}+ stars to appear on the starboard.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
            <span className="flex items-center gap-2 text-[11px] text-slate-400">
              <Hash className="h-3.5 w-3.5 text-slate-600" /> Channel
            </span>
            {live ? (
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="Channel ID"
                className="w-40 min-w-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-xs text-white placeholder:text-slate-600 outline-none transition-colors focus:border-[#7C5CFF]/50"
              />
            ) : (
              <span className="font-mono text-xs font-bold text-white">#starboard</span>
            )}
          </div>

          {live && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              <span className="flex items-center gap-2 text-[11px] text-slate-400">
                <Star className="h-3.5 w-3.5 text-slate-600" /> Emoji
              </span>
              <input
                type="text"
                value={emoji}
                maxLength={50}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="⭐"
                className="w-20 min-w-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-center text-xs text-white placeholder:text-slate-600 outline-none transition-colors focus:border-[#7C5CFF]/50"
              />
            </div>
          )}
        </motion.div>

        {/* Top starred messages */}
        <motion.div variants={rise} className="panel p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white">Top Starred Messages</h3>
              <p className="mt-1 text-xs text-slate-500">
                {live ? "Most starred posts in this server" : "Most starred posts in Crystal Realm"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {live ? (
              entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] py-10 text-center">
                  <Inbox className="h-6 w-6 text-slate-700" />
                  <p className="text-xs font-bold text-slate-400">No starred messages yet</p>
                  <p className="text-[11px] text-slate-600">
                    Messages that cross the star threshold will show up here.
                  </p>
                </div>
              ) : (
                entries.map((entry) => {
                  const ago = timeAgo(entry.createdAt);
                  return (
                    <div
                      key={entry.messageId}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                              style={{
                                background: `linear-gradient(135deg, hsl(${hashHue(entry.authorId)} 70% 55%), hsl(${hashHue(entry.authorId) + 40} 70% 45%))`,
                              }}
                            >
                              <User className="h-3 w-3 opacity-80" />
                            </span>
                            <span
                              className="font-mono text-xs font-bold text-slate-400"
                              title={entry.authorId}
                            >
                              {shortId(entry.authorId)}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {shortId(entry.channelId)}
                            </span>
                            {ago && <span className="text-[10px] text-slate-600">· {ago}</span>}
                          </div>
                          <p className="mt-1.5 font-mono text-[11px] text-slate-500">
                            message {shortId(entry.messageId)}
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#FFB547]/25 bg-[#FFB547]/10 px-2 py-0.5 text-[10px] font-bold text-[#FFB547] tabular-nums">
                          <Star className="h-3 w-3 fill-[#FFB547]" />
                          {entry.starCount}
                        </span>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              STARRED_MESSAGES.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg, hsl(${msg.hue} 70% 55%), hsl(${msg.hue + 40} 70% 45%))`,
                          }}
                        >
                          {msg.author[0]}
                        </span>
                        <span className="text-xs font-bold text-white">{msg.author}</span>
                        <span className="font-mono text-[10px] text-slate-500">{msg.channel}</span>
                        <span className="text-[10px] text-slate-600">· {msg.time}</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{msg.content}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#FFB547]/25 bg-[#FFB547]/10 px-2 py-0.5 text-[10px] font-bold text-[#FFB547] tabular-nums">
                      <Star className="h-3 w-3 fill-[#FFB547]" />
                      {msg.stars}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
