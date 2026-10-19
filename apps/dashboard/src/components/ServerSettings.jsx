"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Globe, Hash, Clock, Save, CheckCircle2, AlertTriangle, Server } from "lucide-react";

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

/* ────────────────────────────── shared styles ────────────────────────────── */

const inputCls = "glass-input";

const selectCls = "glass-select";

/* ────────────────────────────── world data ────────────────────────────── */

/* Guest-only demo fleet. Never rendered once a real guild is selected. */
const FLEET = [
  { name: "Crystal Realm", emoji: "🔮", members: "12,645" },
  { name: "Dev Hub & Gaming", emoji: "⚡", members: "14,210" },
  { name: "Community Lounge", emoji: "💬", members: "4,890" },
  { name: "Support Central", emoji: "🎧", members: "2,150" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "ar", label: "العربية" },
];

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "US/Eastern", label: "US/Eastern" },
  { value: "US/Pacific", label: "US/Pacific" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
];

const DEMO_PREFIX = "!";
const DEMO_LANGUAGE = "en";
const DEMO_TIMEZONE = "UTC";

/* The demo fleet is spelled out the way the demo always spelled it; live fleets use digits. */
const COUNT_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

function serverCountLabel(count) {
  if (count === 1) return "1 server";
  if (count >= 2 && count <= 10) return `${COUNT_WORDS[count]} servers`;
  return `${count} servers`;
}

/* Keep the real stored value selectable even when it isn't in the curated list. */
function withCurrentOption(options, value) {
  if (!value) return options;
  if (options.some((option) => option.value === value)) return options;
  return [...options, { value, label: value }];
}

function formatInZone(timezone) {
  try {
    return new Date().toLocaleString(undefined, { timeZone: timezone });
  } catch {
    return new Date().toLocaleString();
  }
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="section-label mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

export default function ServerSettings({ guilds = [], guildId }) {
  const [prefix, setPrefix] = useState(DEMO_PREFIX);
  const [lang, setLang] = useState(DEMO_LANGUAGE);
  const [timezone, setTimezone] = useState(DEMO_TIMEZONE);
  const [toast, setToast] = useState(null);
  /* outcome of the last load: { guildId, status: "real" | "failed" } */
  const [outcome, setOutcome] = useState(null);
  const [saving, setSaving] = useState(false);

  const toastTimer = useRef(null);
  const showToast = (msg, kind = "ok") => {
    setToast({ msg, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /* request guard — only the latest load may write state */
  const requestSeq = useRef(0);

  /* real data — the humanized demo stays in charge for guests and for failed loads */
  const loadConfig = useCallback(async () => {
    const requestId = ++requestSeq.current;
    if (!guildId) {
      // Guest mode: no request at all, the demo markup is rendered as-is.
      setOutcome(null);
      setPrefix(DEMO_PREFIX);
      setLang(DEMO_LANGUAGE);
      setTimezone(DEMO_TIMEZONE);
      return;
    }

    try {
      const res = await fetch(`/api/guilds/${guildId}/config`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== requestSeq.current) return; // stale response from a previous guild
      setPrefix(typeof data?.prefix === "string" && data.prefix ? data.prefix : DEMO_PREFIX);
      setLang(typeof data?.language === "string" && data.language ? data.language : DEMO_LANGUAGE);
      setTimezone(
        typeof data?.timezone === "string" && data.timezone ? data.timezone : DEMO_TIMEZONE
      );
      setOutcome({ guildId: String(guildId), status: "real" });
    } catch (err) {
      if (requestId !== requestSeq.current) return; // stale failure — ignore
      setOutcome({ guildId: String(guildId), status: "failed" });
      setPrefix(DEMO_PREFIX);
      setLang(DEMO_LANGUAGE);
      setTimezone(DEMO_TIMEZONE);
      console.warn("[ServerSettings] Failed to load server config — showing demo data:", err);
    }
  }, [guildId]);

  useEffect(() => {
    loadConfig();
    return () => {
      // Invalidate in-flight loads so a previous guild's response can't clobber state.
      requestSeq.current += 1;
    };
  }, [loadConfig]);

  /* Derived view model — guest mode keeps the exact demo values. */
  const current = outcome && outcome.guildId === String(guildId) ? outcome : null;
  const mode = !guildId ? "demo" : current ? current.status : "loading";
  const live = mode === "real";
  const loading = mode === "loading";
  const loadFailed = mode === "failed";

  /* Live guilds come from the dashboard API; the demo fleet only fills guest mode. */
  const isGuest = !guildId;
  const fleet = isGuest ? (guilds.length > 0 ? guilds : FLEET) : guilds;
  const fleetIsDemo = fleet === FLEET;
  const fleetCountLabel = fleetIsDemo
    ? serverCountLabel(FLEET.length)
    : `${fleet.length} server${fleet.length === 1 ? "" : "s"}`;

  const languageOptions = withCurrentOption(LANGUAGE_OPTIONS, lang);
  const timezoneOptions = withCurrentOption(TIMEZONE_OPTIONS, timezone);

  const saveDisabled = saving || (Boolean(guildId) && !live);
  const saveTooltip = saving
    ? "Saving settings…"
    : loading
      ? "Loading server settings…"
      : loadFailed
        ? "Server settings couldn't be loaded — nothing can be saved"
        : "Saving settings…";

  const handleSave = async () => {
    if (!guildId) {
      // Guest demo: there is no server to persist to.
      showToast("Settings saved — prefix and locale updated");
      return;
    }
    if (!live) {
      showToast("Couldn't load live settings — nothing was saved", "error");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/guilds/${guildId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix: prefix.trim() || DEMO_PREFIX,
          language: lang,
          timezone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error || "Failed to save server settings", "error");
        return;
      }
      /* Render what the server actually persisted — never the local guess. */
      const saved = data?.config;
      if (saved && typeof saved === "object") {
        if (typeof saved.prefix === "string" && saved.prefix) setPrefix(saved.prefix);
        if (typeof saved.language === "string" && saved.language) setLang(saved.language);
        if (typeof saved.timezone === "string" && saved.timezone) setTimezone(saved.timezone);
      }
      showToast("Settings saved — prefix and locale updated");
    } catch (err) {
      console.warn("[ServerSettings] Failed to save server config:", err);
      showToast("Network error while saving server settings", "error");
    } finally {
      setSaving(false);
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
            className="glass-dropdown pointer-events-none fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-white"
          >
            {toast.kind === "error" ? (
              <AlertTriangle className="h-4 w-4 text-[#FBBF24]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            )}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="icon-tile icon-tile-violet h-9 w-9 rounded-xl">
            <Settings className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title">Server Settings</h2>
            <p className="card-sub mt-0.5">
              Global preferences applied across{" "}
              {guilds.length > 0 ? `the ${guilds.length} communities` : "the communities"} Aura
              manages — prefix, language, and timezone.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary"
          disabled={saveDisabled || undefined}
          title={saveDisabled ? saveTooltip : undefined}
        >
          <Save className="h-3.5 w-3.5" /> Save changes
        </button>
      </motion.div>

      {/* Panels */}
      <motion.div variants={rise} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="glass-card glass-card-hover p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-violet h-8 w-8 rounded-lg">
              <Hash className="h-4 w-4" />
            </span>
            <h3 className="card-title">Bot Configuration</h3>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Command Prefix">
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                maxLength={3}
                className={`${inputCls} w-20 text-center font-mono`}
              />
            </Field>

            <Field label="Default Language">
              <select value={lang} onChange={(e) => setLang(e.target.value)} className={selectCls}>
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="glass-card glass-card-hover p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-cyan h-8 w-8 rounded-lg">
              <Globe className="h-4 w-4" />
            </span>
            <h3 className="card-title">Regional</h3>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Timezone">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={selectCls}
              >
                {timezoneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              <span className="icon-tile icon-tile-cyan h-8 w-8 rounded-lg">
                <Clock className="h-4 w-4" />
              </span>
              <span className="text-xs text-slate-400">
                Server local time:{" "}
                <span className="font-semibold text-white">
                  {live ? formatInZone(timezone) : new Date().toLocaleString()}
                </span>
              </span>
            </div>
          </div>
        </section>
      </motion.div>

      {/* Fleet strip */}
      <motion.div
        variants={rise}
        className="glass-card flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3"
      >
        <span className="inline-flex items-center gap-2">
          <span className="status-dot status-dot-online animate-pulse-dot" />
          <span className="section-label">Aura Fleet</span>
        </span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {fleet.length === 0 ? (
            <div className="empty-state w-full py-5">
              <span className="empty-state-icon">
                <Server className="h-4 w-4" />
              </span>
              <span className="empty-state-title">No servers connected</span>
              <span className="text-[11px]">
                Aura isn't in any server you can manage yet — invite it and it will show up here.
              </span>
            </div>
          ) : (
            fleet.map((s) => (
              <span key={s.id ?? s.name} className="inline-flex items-center gap-1.5 text-[11px]">
                {s.emoji ? (
                  <span>{s.emoji}</span>
                ) : s.icon && s.id ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${s.id}/${s.icon}.png?size=64`}
                    alt=""
                    className="h-4 w-4 shrink-0 rounded-full"
                  />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#7C5CFF]/20 text-[9px] font-bold text-[#C4B5FD]">
                    {(s.name?.[0] || "#").toUpperCase()}
                  </span>
                )}
                <span className="text-slate-400">{s.name || "Unknown server"}</span>
                <span className="font-mono font-bold tabular-nums text-slate-200">
                  {s.emoji
                    ? s.members
                    : typeof s.memberCount === "number"
                      ? s.memberCount.toLocaleString()
                      : "—"}
                </span>
              </span>
            ))
          )}
        </div>
        <span className="ml-auto hidden text-[11px] font-body text-slate-500 md:block">
          {fleet.length > 0 ? (
            <>
              {`All ${fleetCountLabel} `}
              <span className="font-semibold text-[#6EE7B7]">online</span>.
            </>
          ) : (
            "No servers connected yet"
          )}
        </span>
      </motion.div>
    </motion.div>
  );
}
