"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Award, Zap, TrendingUp, Crown, Save, CheckCircle2 } from "lucide-react";

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

/* ──────────────── static data (humanized fallback — guest mode / fetch failure) ──────────────── */

const LEVEL_REWARDS = [
  { level: 5, role: "@Regular", color: "#39D98A" },
  { level: 10, role: "@Chat Enthusiast", color: "#5B8CFF" },
  { level: 25, role: "@VIP Member", color: "#FFB547" },
  { level: 50, role: "@Elite Supporter", color: "#FF5C7A" },
];

const LEADERBOARD = [
  { rank: 1, name: "NovaStar", level: 47, xp: 128450, hue: 268 },
  { rank: 2, name: "LunaByte", level: 42, xp: 112120, hue: 190 },
  { rank: 3, name: "pixelForge", level: 38, xp: 98300, hue: 210 },
  { rank: 4, name: "EchoVortex", level: 35, xp: 87650, hue: 225 },
  { rank: 5, name: "MiraGlow", level: 31, xp: 76500, hue: 152 },
];

/* ────────────────────────────── api / view helpers ────────────────────────────── */

const clone = (v) => JSON.parse(JSON.stringify(v));

const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

/* muted stand-in for unresolved ids — "…1a2b3c" */
function shortId(id) {
  const s = String(id ?? "");
  return s ? `…${s.slice(-6)}` : "…";
}

/* avatars: only ever render strings from the Discord CDN */
const AVATAR_RE = /^https:\/\/cdn\.discordapp\.com\//;
const safeAvatar = (url) => (typeof url === "string" && AVATAR_RE.test(url) ? url : null);

/* /roles returns color as "#rrggbb" | null; tolerate plain ints too */
function roleDotColor(color) {
  if (typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)) return color;
  const n = Number(color);
  if (Number.isFinite(n) && n > 0) return `#${(n & 0xffffff).toString(16).padStart(6, "0")}`;
  return "#64748B";
}

/* GET /leveling → view rows */
function mapLeaderboard(rows) {
  return (Array.isArray(rows) ? rows : []).map((u, i) => ({
    rank: i + 1,
    userId: u?.userId != null ? String(u.userId) : null,
    name: typeof u?.name === "string" && u.name.trim() ? u.name : null,
    avatarUrl: typeof u?.avatarUrl === "string" ? u.avatarUrl : null,
    xp: toInt(u?.xp),
    level: toInt(u?.level),
    messages: toInt(u?.messages),
    voiceMinutes: toInt(u?.voiceMinutes),
    hue: hashHue(String(u?.userId ?? i)),
  }));
}

function mapRewards(rows) {
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    level: toInt(r?.level),
    roleId: r?.roleId != null ? String(r.roleId) : null,
    removeOnNext: Boolean(r?.removeOnNext),
    role: null,
    color: null,
  }));
}

/* ────────────────────────────── shared atoms ────────────────────────────── */

function Toggle({ enabled, onChange, title }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      title={title}
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

export default function LevelingSettings({ guildId }) {
  const [xpMultiplier, setXpMultiplier] = useState(1.0);
  const [enabled, setEnabled] = useState(true);
  const [toast, setToast] = useState(null);
  const [leaderboard, setLeaderboard] = useState(() => clone(LEADERBOARD));
  const [rewards, setRewards] = useState(() => clone(LEVEL_REWARDS));
  const [roleMap, setRoleMap] = useState({});
  /* real mode only — false means GET /economy never produced values, so saving would
     write the placeholder defaults over the server's real config. */
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /* real data — leaderboard + rewards; demo arrays stay as fallback for guest mode / fetch failure */
  useEffect(() => {
    if (!guildId) return undefined; // guest/no-guild mode: keep humanized demo, no fetch

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/guilds/${guildId}/leveling`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data?.leaderboard) || !Array.isArray(data?.rewards)) {
          throw new Error("Malformed leveling payload");
        }
        if (cancelled) return;

        const mappedRewards = mapRewards(data.rewards);
        setLeaderboard(mapLeaderboard(data.leaderboard));
        setRewards(mappedRewards);
        setRoleMap({});

        /* Display-only: resolve reward roleIds to names/colors via GET /roles (5-min cached server-side). */
        if (mappedRewards.some((r) => r.roleId)) {
          try {
            const rres = await fetch(`/api/guilds/${guildId}/roles`);
            if (!rres.ok) throw new Error(`HTTP ${rres.status}`);
            const rdata = await rres.json();
            if (cancelled) return;
            const map = {};
            (Array.isArray(rdata?.roles) ? rdata.roles : []).forEach((role) => {
              if (role?.id != null) map[String(role.id)] = role;
            });
            setRoleMap(map);
          } catch {
            /* silent — rewards fall back to muted short role IDs */
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.warn("[LevelingSettings] Failed to load leveling data — showing demo data:", err);
        setLeaderboard(() => clone(LEADERBOARD));
        setRewards(() => clone(LEVEL_REWARDS));
        setRoleMap({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [guildId]);

  /* ── XP settings live in GuildSettings (GET/POST /economy) ── */
  const econSeq = useRef(0);

  const loadEconomy = useCallback(async () => {
    const requestId = ++econSeq.current;
    if (!guildId) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/economy`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== econSeq.current) return; // stale response from a previous guild
      const multiplier = Number(data?.xpMultiplier);
      setXpMultiplier(Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1.0);
      setEnabled(data?.levelingEnabled !== false);
      setSettingsLoaded(true);
    } catch (err) {
      if (requestId !== econSeq.current) return;
      console.warn("[LevelingSettings] Failed to load XP settings — controls keep their defaults:", err);
      setSettingsLoaded(false);
    }
  }, [guildId]);

  useEffect(() => {
    if (!guildId) return undefined; // guest/no-guild mode: no fetch, demo values stay
    loadEconomy();
    return () => {
      econSeq.current += 1;
    };
  }, [loadEconomy]);

  const saveSettings = async () => {
    /* Guest demo: nothing is persisted anywhere, so keep the original local feedback. */
    if (!guildId) {
      showToast("Leveling settings saved — rewards are live");
      return;
    }
    if (!settingsLoaded) {
      showToast("Couldn't load the current XP settings — reload before saving");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/economy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xpMultiplier, levelingEnabled: enabled }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const raw = typeof data?.error === "string" ? data.error.trim() : "";
        showToast(raw || "Failed to save leveling settings");
        return;
      }
      await loadEconomy(); // POST answers with an ack only — re-read the persisted values
      showToast("Leveling settings saved — rewards are live");
    } catch (err) {
      console.warn("[LevelingSettings] Failed to save leveling settings:", err);
      showToast("Network error while saving leveling settings");
    } finally {
      setSaving(false);
    }
  };

  const canSave = !guildId || settingsLoaded;
  const saveHint = !guildId
    ? undefined
    : settingsLoaded
      ? "Saves the XP multiplier and the leveling toggle to this server"
      : "Couldn't load the current XP settings — reload the page before saving";

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
              <Trophy className="h-4 w-4" />
            </span>
            Leveling System
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            XP multipliers, level-up rewards, and the Crystal Realm leaderboard.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="rounded-full border border-[#FFB547]/25 bg-[#FFB547]/10 px-2 py-0.5 text-[10px] font-bold text-[#FFB547]">
            PREMIUM
          </span>
          <button
            type="button"
            onClick={saveSettings}
            disabled={!canSave || saving}
            title={saveHint}
            className={`inline-flex items-center gap-2 rounded-lg bg-[#7C5CFF] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_0_18px_rgba(124,92,255,0.35)] transition-colors hover:bg-[#6a4cf0]${
              saving ? " cursor-progress opacity-70" : ""
            }${!canSave ? " cursor-not-allowed opacity-50" : ""}`}
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          {/* XP settings */}
          <motion.div variants={rise} className="panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
                  <Zap className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-white">XP Settings</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Earned from messages and voice time
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    enabled ? "text-[#39D98A]" : "text-slate-600"
                  }`}
                >
                  {enabled ? "Active" : "Paused"}
                </span>
                <Toggle
                  enabled={enabled}
                  onChange={setEnabled}
                  title={guildId ? "Pauses or resumes XP gains — press Save to apply" : undefined}
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="section-label">XP Multiplier</span>
                <span className="rounded-full border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 px-2 py-0.5 text-[10px] font-bold text-[#7C5CFF] tabular-nums">
                  {xpMultiplier.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={10}
                step={0.1}
                value={xpMultiplier}
                onChange={(e) => setXpMultiplier(parseFloat(e.target.value))}
                className="mt-3 w-full cursor-pointer accent-[#7C5CFF]"
              />
              <p className="mt-2 text-[10px] text-slate-600">
                Multiplies XP for every message and voice minute server-wide.
              </p>
              {guildId ? (
                <p
                  className={`mt-1 text-[10px] ${
                    settingsLoaded ? "text-slate-600" : "text-[#FFB547]"
                  }`}
                >
                  {settingsLoaded
                    ? "Changes apply to the bot after you press Save."
                    : "Couldn't load this server's XP settings — these values are placeholders, not your config."}
                </p>
              ) : null}
            </div>
          </motion.div>

          {/* Level rewards */}
          <motion.div variants={rise} className="panel p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
                <Award className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-white">Level Rewards</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Roles granted automatically at each milestone
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {rewards.map((r) => {
                const info = r.roleId ? roleMap[r.roleId] : null;
                const resolvedName =
                  info && typeof info.name === "string" && info.name ? info.name : null;
                const label = r.role || resolvedName || null;
                const dotColor = r.color || (info ? roleDotColor(info.color) : null) || "#64748B";
                return (
                  <div
                    key={`${r.level}-${r.roleId || "demo"}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold text-slate-300">
                      Level {r.level}
                    </span>
                    <span
                      className={`flex min-w-0 items-center gap-2 text-xs font-bold ${
                        label ? "text-white" : "font-mono text-slate-500"
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="truncate">{label || shortId(r.roleId)}</span>
                    </span>
                  </div>
                );
              })}
              {rewards.length === 0 && (
                <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-white/[0.08] px-3.5 py-4 text-[11px] text-slate-600">
                  <Award className="h-3.5 w-3.5 shrink-0 text-slate-700" />
                  <span>
                    No level rewards yet — rewards appear here once role milestones are configured
                    for this server.
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Leaderboard */}
        <motion.div variants={rise} className="panel p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white">Leaderboard</h3>
              <p className="mt-1 text-xs text-slate-500">
                {guildId ? "Top members by XP" : "Top 5 members by XP this week"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {leaderboard.map((u) => (
              <div
                key={u.userId || `rank-${u.rank}`}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 transition-colors hover:bg-white/[0.04]"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center text-xs font-black ${
                    u.rank <= 3 ? "text-[#FFB547]" : "text-slate-500"
                  }`}
                >
                  {u.rank <= 3 ? <Crown className="h-4 w-4" /> : `#${u.rank}`}
                </span>
                {safeAvatar(u.avatarUrl) ? (
                  <img
                    src={u.avatarUrl}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, hsl(${u.hue} 70% 55%), hsl(${u.hue + 40} 70% 45%))`,
                    }}
                  >
                    {(u.name?.[0] || "?").toUpperCase()}
                  </span>
                )}
                <span
                  className={`min-w-0 flex-1 truncate text-xs font-bold ${
                    u.name ? "text-white" : "font-mono text-slate-500"
                  }`}
                >
                  {u.name || shortId(u.userId)}
                </span>
                <span className="shrink-0 rounded-full border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 px-2 py-0.5 text-[10px] font-bold text-[#7C5CFF] tabular-nums">
                  Lvl {u.level}
                </span>
                <span className="hidden shrink-0 font-mono text-[10px] text-slate-500 tabular-nums sm:block">
                  {u.xp.toLocaleString("en-US")} XP
                </span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-white/[0.08] px-3.5 py-4 text-[11px] text-slate-600">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-slate-700" />
                <span>No XP activity yet — members earn XP from chatting and voice time.</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
