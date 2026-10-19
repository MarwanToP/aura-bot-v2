"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  TrendingUp,
  Save,
  Settings2,
  CheckCircle2,
  Inbox,
  User,
  Minus,
  Plus,
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

function Toggle({ enabled, onChange, title }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      title={title}
      aria-label={title}
      aria-pressed={enabled}
      className={`toggle-track ${enabled ? "toggle-track-on" : ""}`}
    >
      <span className="toggle-thumb" />
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

  const starEmoji = (emoji || "⭐").trim() || "⭐";
  const thresholdPct = Math.max(0, Math.min(100, (threshold / 20) * 100));

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
            <Star className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[15px]">Starboard</h2>
            <p className="card-sub mt-0.5">
              Highlight the best messages with a starboard channel.
            </p>
          </div>
        </div>
        <button type="button" onClick={saveConfig} className="btn-primary">
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Settings */}
        <motion.div variants={rise} className="glass-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="icon-tile icon-tile-amber h-9 w-9 rounded-[12px]">
                <Settings2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Settings</h3>
                <p className="card-sub mt-0.5">Channel, threshold, and visibility</p>
              </div>
            </div>
            <Toggle
              enabled={enabled}
              onChange={setEnabled}
              title="Turn the starboard on or off for this server"
            />
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="starboard-threshold" className="section-label">
                Star Threshold
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setThreshold(Math.max(1, threshold - 1))}
                  title="Lower the star threshold"
                  className="btn-icon h-7 w-7 rounded-[9px]"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="chip chip-amber tabular-nums">{threshold} stars</span>
                <button
                  type="button"
                  onClick={() => setThreshold(Math.min(20, threshold + 1))}
                  title="Raise the star threshold"
                  className="btn-icon h-7 w-7 rounded-[9px]"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="progress-track mt-3">
              <div className="progress-fill" style={{ width: `${thresholdPct}%` }} />
            </div>
            <input
              id="starboard-threshold"
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

          <div className="mt-4">
            <label htmlFor="starboard-channel" className="section-label mb-1.5 block">
              Channel
            </label>
            {live ? (
              <input
                id="starboard-channel"
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="Channel ID"
                className="glass-input font-mono"
              />
            ) : (
              <select
                id="starboard-channel"
                value="#starboard"
                disabled
                title="Live mode edits the starboard channel by ID"
                className="glass-select cursor-not-allowed opacity-70"
              >
                <option value="#starboard">#starboard</option>
              </select>
            )}
          </div>

          {live && (
            <div className="mt-4">
              <label htmlFor="starboard-emoji" className="section-label mb-1.5 block">
                Emoji
              </label>
              <input
                id="starboard-emoji"
                type="text"
                value={emoji}
                maxLength={50}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="⭐"
                className="glass-input text-center"
              />
            </div>
          )}
        </motion.div>

        {/* Top starred messages */}
        <motion.div variants={rise} className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-cyan h-9 w-9 rounded-[12px]">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Top Starred Messages</h3>
              <p className="card-sub mt-0.5">
                {live ? "Most starred posts in this server" : "Most starred posts in Crystal Realm"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {live ? (
              entries.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">
                    <Inbox className="h-4 w-4" />
                  </span>
                  <span className="empty-state-title">No starred messages yet</span>
                  <span>Messages that cross the star threshold will show up here.</span>
                </div>
              ) : (
                entries.map((entry) => {
                  const ago = timeAgo(entry.createdAt);
                  const hue = hashHue(entry.authorId);
                  return (
                    <div key={entry.messageId} className="list-row items-start gap-3 px-3 py-3">
                      <span className="avatar-ring mt-0.5 shrink-0">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                          style={{
                            background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${hue + 40} 70% 45%))`,
                          }}
                        >
                          <User className="h-3 w-3 opacity-80" />
                        </span>
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="font-mono text-xs font-bold text-slate-400"
                            title={entry.authorId}
                          >
                            {shortId(entry.authorId)}
                          </span>
                          <span className="chip chip-cyan font-mono">
                            {shortId(entry.channelId)}
                          </span>
                          {ago ? <span className="text-[10px] text-slate-600">· {ago}</span> : null}
                        </div>
                        <p className="mt-1.5 font-mono text-[11px] text-slate-500">
                          message {shortId(entry.messageId)}
                        </p>
                      </div>

                      <span className="chip chip-amber shrink-0 tabular-nums">
                        {starEmoji} {entry.starCount}
                      </span>
                    </div>
                  );
                })
              )
            ) : (
              STARRED_MESSAGES.map((msg) => (
                <div key={msg.id} className="list-row items-start gap-3 px-3 py-3">
                  <span className="avatar-ring mt-0.5 shrink-0">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, hsl(${msg.hue} 70% 55%), hsl(${msg.hue + 40} 70% 45%))`,
                      }}
                    >
                      {msg.author[0]}
                    </span>
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white">{msg.author}</span>
                      <span className="chip chip-cyan">{msg.channel}</span>
                      <span className="text-[10px] text-slate-600">· {msg.time}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{msg.content}</p>
                  </div>

                  <span className="chip chip-amber shrink-0 tabular-nums">
                    {starEmoji} {msg.stars}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
