"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  LogOut,
  Palette,
  Type,
  Eye,
  Save,
  CheckCircle2,
  Hash,
  AlertCircle,
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

/* ────────────────────────────── data ────────────────────────────── */

const CARD_TEMPLATES = [
  { id: "default", name: "Classic", gradient: "from-indigo-600 to-purple-700" },
  { id: "ocean", name: "Ocean", gradient: "from-cyan-500 to-blue-700" },
  { id: "sunset", name: "Sunset", gradient: "from-orange-500 to-rose-600" },
  { id: "forest", name: "Forest", gradient: "from-emerald-500 to-teal-700" },
  { id: "midnight", name: "Midnight", gradient: "from-slate-800 to-zinc-900" },
  { id: "neon", name: "Neon", gradient: "from-fuchsia-600 to-violet-800" },
];

const PLACEHOLDER_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

const MEMBER_COUNT = "12,646";

/* ────────────────────────────── helpers ────────────────────────────── */

/* The API stores Discord snowflakes — anything else is rejected by the server. */
const SNOWFLAKE_RE = /^\d{17,20}$/;

const clampNum = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

const isHexColor = (value) =>
  typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());

/* Only text channels (Discord channel type 0) can receive a welcome/farewell message. */
const mapTextChannels = (raw) =>
  (Array.isArray(raw) ? raw : [])
    .filter((c) => c && c.id != null && Number(c.type) === 0)
    .map((c) => ({ id: String(c.id), name: c.name ? String(c.name) : String(c.id) }));

/* Keep a stored id selectable even when the live channel list doesn't contain it. */
const channelOptions = (list, selectedId) => {
  const base = Array.isArray(list) ? list : [];
  if (selectedId && !base.some((c) => c.id === selectedId)) {
    return [...base, { id: selectedId, name: null, missing: true }];
  }
  return base;
};

const channelLabel = (list, id) => {
  if (!id) return null;
  const match = (Array.isArray(list) ? list : []).find((c) => c.id === id);
  return match ? `#${match.name}` : `id ${id}`;
};

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function WelcomeSettings({ guildId }) {
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [farewellEnabled, setFarewellEnabled] = useState(true);
  const [welcomeChannel, setWelcomeChannel] = useState("#general");
  const [farewellChannel, setFarewellChannel] = useState("#announcements");
  const [welcomeMsg, setWelcomeMsg] = useState("Welcome {user} to {guild}!");
  const [farewellMsg, setFarewellMsg] = useState("Goodbye {user}, we will miss you!");
  const [showCard, setShowCard] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("default");
  const [cardColor, setCardColor] = useState("#FFFFFF");
  const [avatarX, setAvatarX] = useState(50);
  const [avatarY, setAvatarY] = useState(50);
  const [textX, setTextX] = useState(150);
  const [textY, setTextY] = useState(150);
  const [username, setUsername] = useState("NovaStar");
  const [serverName, setServerName] = useState("Crystal Realm");
  const [toast, setToast] = useState(null);
  const [toastTone, setToastTone] = useState("success");

  /* real-mode state — only used once `live` is true */
  const [live, setLive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [welcomeChannelId, setWelcomeChannelId] = useState("");
  const [farewellChannelId, setFarewellChannelId] = useState("");
  const [channels, setChannels] = useState(null);
  const [guildName, setGuildName] = useState(null);
  const [memberCount, setMemberCount] = useState(null);

  /* the preview server-name field is user-owned: never overwrite an edited value */
  const serverNameEdited = useRef(false);

  const showToast = (msg, tone = "success") => {
    setToastTone(tone);
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const template = CARD_TEMPLATES.find((t) => t.id === selectedTemplate) || CARD_TEMPLATES[0];

  /* ────────────────────────────── real data ────────────────────────────── */

  /* request guards — only the latest load may write state */
  const requestSeq = useRef(0);
  const channelSeq = useRef(0);
  const guildSeq = useRef(0);

  /* Guest mode (no guild) keeps the humanized demo exactly as it was. */
  const applyDemoState = useCallback(() => {
    setWelcomeEnabled(true);
    setFarewellEnabled(true);
    setWelcomeChannel("#general");
    setFarewellChannel("#announcements");
    setWelcomeMsg("Welcome {user} to {guild}!");
    setFarewellMsg("Goodbye {user}, we will miss you!");
    setShowCard(true);
    setSelectedTemplate("default");
    setCardColor("#FFFFFF");
    setAvatarX(50);
    setAvatarY(50);
    setTextX(150);
    setTextY(150);
    setUsername("NovaStar");
    setServerName("Crystal Realm");
    setWelcomeChannelId("");
    setFarewellChannelId("");
    setChannels(null);
    setGuildName(null);
    setMemberCount(null);
    setLive(false);
  }, []);

  /* Apply a server payload (GET answer or the POST echo) to the live state. */
  const applyWelcomePayload = useCallback((data) => {
    const w = data?.welcome && typeof data.welcome === "object" ? data.welcome : {};
    const f = data?.farewell && typeof data.farewell === "object" ? data.farewell : {};

    setWelcomeEnabled(Boolean(w.enabled));
    setFarewellEnabled(Boolean(f.enabled));
    setWelcomeMsg(typeof w.message === "string" ? w.message : "");
    setFarewellMsg(typeof f.message === "string" ? f.message : "");
    setWelcomeChannelId(w.channelId ? String(w.channelId) : "");
    setFarewellChannelId(f.channelId ? String(f.channelId) : "");

    /* welcomeCard is exposed flat and mirrored inside `welcome` — prefer the flat flag. */
    const cardFlag =
      typeof data?.welcomeCard === "boolean"
        ? data.welcomeCard
        : typeof w.welcomeCard === "boolean"
          ? w.welcomeCard
          : true;
    setShowCard(cardFlag);

    /* The card designer owns image / color / coordinates inside welcomeConfig. */
    const cfg =
      w.config && typeof w.config === "object" && !Array.isArray(w.config) ? w.config : {};
    if (typeof cfg.image === "string" && CARD_TEMPLATES.some((t) => t.id === cfg.image)) {
      setSelectedTemplate(cfg.image);
    }
    if (isHexColor(cfg.color)) setCardColor(cfg.color.trim());
    const coords =
      cfg.coordinates && typeof cfg.coordinates === "object" ? cfg.coordinates : {};
    setAvatarX(clampNum(coords?.avatar?.x, 10, 200, 50));
    setAvatarY(clampNum(coords?.avatar?.y, 10, 200, 50));
    setTextX(clampNum(coords?.text?.x, 10, 400, 150));
    setTextY(clampNum(coords?.text?.y, 10, 300, 150));
  }, []);

  const loadWelcome = useCallback(async () => {
    const requestId = ++requestSeq.current;
    if (!guildId) {
      applyDemoState();
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/welcome`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== requestSeq.current) return; // stale response from a previous guild
      applyWelcomePayload(data);
      setLive(true);
    } catch (err) {
      if (requestId !== requestSeq.current) return; // stale failure — ignore
      // Keep the humanized fallback quietly (live stays false → demo markup).
      console.warn("[WelcomeSettings] Failed to load welcome settings — showing demo data:", err);
    }
  }, [guildId, applyDemoState, applyWelcomePayload]);

  useEffect(() => {
    loadWelcome();
    return () => {
      requestSeq.current += 1;
    };
  }, [loadWelcome]);

  /* Live channel list for the pickers — null means "not available" (manual id entry). */
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
      if (requestId !== channelSeq.current) return;
      setChannels(mapTextChannels(data?.channels));
    } catch (err) {
      if (requestId !== channelSeq.current) return;
      console.warn(
        "[WelcomeSettings] Failed to load channels — using a manual channel id input:",
        err
      );
      setChannels(null);
    }
  }, [guildId]);

  useEffect(() => {
    loadChannels();
    return () => {
      channelSeq.current += 1;
    };
  }, [loadChannels]);

  /* Real guild name + member count (the demo numbers are never shown as live facts). */
  const loadGuild = useCallback(async () => {
    const requestId = ++guildSeq.current;
    if (!guildId) {
      setGuildName(null);
      setMemberCount(null);
      return;
    }
    try {
      const res = await fetch("/api/guilds");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== guildSeq.current) return;
      const list = Array.isArray(data?.guilds) ? data.guilds : [];
      const match = list.find((g) => g && String(g.id) === String(guildId));
      if (!match) return; // the guild list is not authoritative for every guild
      const name = match.name ? String(match.name) : null;
      setGuildName(name);
      setMemberCount(typeof match.memberCount === "number" ? match.memberCount : null);
      if (!serverNameEdited.current) setServerName(name || "your server");
    } catch (err) {
      if (requestId !== guildSeq.current) return;
      console.warn(
        "[WelcomeSettings] Failed to load guild details — showing placeholder labels:",
        err
      );
    }
  }, [guildId]);

  useEffect(() => {
    loadGuild();
    return () => {
      guildSeq.current += 1;
    };
  }, [loadGuild]);

  /* ────────────────────────────── save ────────────────────────────── */

  const saveSettings = async () => {
    if (!guildId) {
      showToast("Welcome & goodbye settings saved");
      return;
    }
    if (!live) {
      showToast("Couldn't load live settings — nothing was saved", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          welcomeEnabled: Boolean(welcomeEnabled),
          welcomeMessage: welcomeMsg,
          welcomeChannelId: SNOWFLAKE_RE.test(welcomeChannelId) ? welcomeChannelId : null,
          welcomeCard: Boolean(showCard),
          farewellEnabled: Boolean(farewellEnabled),
          farewellMessage: farewellMsg,
          farewellChannelId: SNOWFLAKE_RE.test(farewellChannelId) ? farewellChannelId : null,
          welcomeConfig: {
            image: selectedTemplate,
            color: cardColor,
            coordinates: {
              avatar: { x: Number(avatarX) || 0, y: Number(avatarY) || 0 },
              text: { x: Number(textX) || 0, y: Number(textY) || 0 },
            },
          },
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        showToast(errBody?.error || "Failed to save welcome settings", "error");
        return;
      }
      await res.json().catch(() => ({})); // drain the body — the re-read below is authoritative
      /* Re-read: the server owns the stored value (e.g. welcomeCard may be ignored). */
      await loadWelcome();
      showToast("Welcome & goodbye settings saved");
    } catch (err) {
      console.warn("[WelcomeSettings] Failed to save welcome settings:", err);
      showToast("Network error while saving welcome settings", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ────────────────────────────── derived values ────────────────────────────── */

  const memberCountText = live
    ? memberCount != null
      ? Number(memberCount).toLocaleString("en-US")
      : "—"
    : MEMBER_COUNT;

  const guildLabel = live ? guildName || "this server" : "Crystal Realm";

  /* ══════════════════════════════════ render ══════════════════════════════ */

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
            {toastTone === "error" ? (
              <AlertCircle className="h-4 w-4 text-[#FBBF24]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            )}
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-violet">
            <UserCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[15px]">Welcome &amp; Goodbye Designer</h2>
            <p className="card-sub mt-0.5">
              Design animated welcome cards, customize messages, and set farewell embeds for{" "}
              {guildLabel}.
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={saveSettings}
          disabled={live && saving}
          className="btn-primary"
        >
          <Save className="h-3.5 w-3.5" />
          {live && saving ? "Saving…" : "Save Settings"}
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left: settings */}
        <div className="space-y-5">
          {/* Welcome messages */}
          <motion.section variants={rise} className="glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="icon-tile icon-tile-green h-9 w-9 rounded-[12px]">
                  <UserCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="card-title">Welcome Messages</h3>
                  <p className="card-sub mt-0.5">Greet every new member the moment they join.</p>
                </div>
              </div>
              <Toggle
                enabled={welcomeEnabled}
                onChange={setWelcomeEnabled}
                title="Turn welcome messages on or off"
              />
            </div>

            {welcomeEnabled && (
              <div className="mt-5 space-y-4">
                <div className="block">
                  <label htmlFor="welcome-channel" className="section-label mb-1.5 block">
                    Channel
                  </label>
                  {!live ? (
                    <span className="relative block">
                      <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                      <input
                        id="welcome-channel"
                        type="text"
                        value={welcomeChannel}
                        onChange={(e) => setWelcomeChannel(e.target.value)}
                        className="glass-input pl-8"
                      />
                    </span>
                  ) : channels && channels.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-state-icon">
                        <Hash className="h-4 w-4" />
                      </span>
                      <span className="empty-state-title">No channels available</span>
                      <span>
                        The bot can&apos;t read this server&apos;s channels — invite it with channel
                        permissions, then reload.
                      </span>
                    </div>
                  ) : channels ? (
                    <select
                      id="welcome-channel"
                      value={welcomeChannelId}
                      onChange={(e) => setWelcomeChannelId(e.target.value)}
                      className="glass-select"
                    >
                      <option value="">No channel selected</option>
                      {channelOptions(channels, welcomeChannelId).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.missing ? `${c.id} (not in channel list)` : `#${c.name}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="welcome-channel"
                      type="text"
                      value={welcomeChannelId}
                      onChange={(e) => setWelcomeChannelId(e.target.value)}
                      placeholder="Channel ID"
                      className="glass-input font-mono"
                    />
                  )}
                  {live ? (
                    <span className="mt-1.5 block text-[10px] text-slate-500">
                      Saved channel:{" "}
                      {channelLabel(channels, welcomeChannelId) || "none selected"}
                    </span>
                  ) : null}
                </div>
                <div className="block">
                  <label htmlFor="welcome-message" className="section-label mb-1.5 block">
                    Message (use {"{user}"}, {"{guild}"}, {"{memberCount}"})
                  </label>
                  <textarea
                    id="welcome-message"
                    value={welcomeMsg}
                    onChange={(e) => setWelcomeMsg(e.target.value)}
                    rows={3}
                    className="glass-textarea"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-300">Show welcome card</span>
                  <Toggle
                    enabled={showCard}
                    onChange={setShowCard}
                    title="Show the animated welcome card alongside the message"
                  />
                </div>
              </div>
            )}
          </motion.section>

          {/* Farewell messages */}
          <motion.section variants={rise} className="glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="icon-tile icon-tile-blue h-9 w-9 rounded-[12px]">
                  <LogOut className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="card-title">Goodbye / Farewell Messages</h3>
                  <p className="card-sub mt-0.5">Send a warm send-off when members leave.</p>
                </div>
              </div>
              <Toggle
                enabled={farewellEnabled}
                onChange={setFarewellEnabled}
                title="Turn farewell messages on or off"
              />
            </div>

            {farewellEnabled && (
              <div className="mt-5 space-y-4">
                <div className="block">
                  <label htmlFor="farewell-channel" className="section-label mb-1.5 block">
                    Channel
                  </label>
                  {!live ? (
                    <span className="relative block">
                      <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                      <input
                        id="farewell-channel"
                        type="text"
                        value={farewellChannel}
                        onChange={(e) => setFarewellChannel(e.target.value)}
                        className="glass-input pl-8"
                      />
                    </span>
                  ) : channels && channels.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-state-icon">
                        <Hash className="h-4 w-4" />
                      </span>
                      <span className="empty-state-title">No channels available</span>
                      <span>
                        The bot can&apos;t read this server&apos;s channels — invite it with channel
                        permissions, then reload.
                      </span>
                    </div>
                  ) : channels ? (
                    <select
                      id="farewell-channel"
                      value={farewellChannelId}
                      onChange={(e) => setFarewellChannelId(e.target.value)}
                      className="glass-select"
                    >
                      <option value="">No channel selected</option>
                      {channelOptions(channels, farewellChannelId).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.missing ? `${c.id} (not in channel list)` : `#${c.name}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="farewell-channel"
                      type="text"
                      value={farewellChannelId}
                      onChange={(e) => setFarewellChannelId(e.target.value)}
                      placeholder="Channel ID"
                      className="glass-input font-mono"
                    />
                  )}
                  {live ? (
                    <span className="mt-1.5 block text-[10px] text-slate-500">
                      Saved channel:{" "}
                      {channelLabel(channels, farewellChannelId) || "none selected"}
                    </span>
                  ) : null}
                </div>
                <div className="block">
                  <label htmlFor="farewell-message" className="section-label mb-1.5 block">
                    Farewell message
                  </label>
                  <textarea
                    id="farewell-message"
                    value={farewellMsg}
                    onChange={(e) => setFarewellMsg(e.target.value)}
                    rows={3}
                    className="glass-textarea"
                  />
                </div>
              </div>
            )}
          </motion.section>

          {/* Card designer */}
          <motion.section variants={rise} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile-pink h-9 w-9 rounded-[12px]">
                <Palette className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Welcome Card Designer</h3>
                <p className="card-sub mt-0.5">
                  Pick a template and position the avatar and username.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <span className="section-label mb-1.5 block">Card template</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {CARD_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`rounded-xl bg-gradient-to-br ${t.gradient} px-3 py-2 text-[10px] font-bold text-white transition-all ${
                      selectedTemplate === t.id
                        ? "scale-[1.03] ring-2 ring-[#7C5CFF]"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="welcome-card-color" className="section-label mb-1.5 block">
                Text color
              </label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  id="welcome-card-color"
                  type="color"
                  value={cardColor}
                  onChange={(e) => setCardColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-xl border border-white/[0.08] bg-transparent"
                />
                <span className="font-mono text-xs text-slate-400">{cardColor}</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="welcome-avatar-x" className="section-label mb-1.5 block">
                  Avatar X
                </label>
                <input
                  id="welcome-avatar-x"
                  type="range"
                  min={10}
                  max={200}
                  value={avatarX}
                  onChange={(e) => setAvatarX(Number(e.target.value))}
                  className="mt-1 w-full cursor-pointer accent-[#7C5CFF]"
                />
                <span className="text-[10px] text-slate-500">{avatarX}px</span>
              </div>
              <div>
                <label htmlFor="welcome-avatar-y" className="section-label mb-1.5 block">
                  Avatar Y
                </label>
                <input
                  id="welcome-avatar-y"
                  type="range"
                  min={10}
                  max={200}
                  value={avatarY}
                  onChange={(e) => setAvatarY(Number(e.target.value))}
                  className="mt-1 w-full cursor-pointer accent-[#7C5CFF]"
                />
                <span className="text-[10px] text-slate-500">{avatarY}px</span>
              </div>
              <div>
                <label htmlFor="welcome-text-x" className="section-label mb-1.5 block">
                  Text X
                </label>
                <input
                  id="welcome-text-x"
                  type="range"
                  min={10}
                  max={400}
                  value={textX}
                  onChange={(e) => setTextX(Number(e.target.value))}
                  className="mt-1 w-full cursor-pointer accent-[#7C5CFF]"
                />
                <span className="text-[10px] text-slate-500">{textX}px</span>
              </div>
              <div>
                <label htmlFor="welcome-text-y" className="section-label mb-1.5 block">
                  Text Y
                </label>
                <input
                  id="welcome-text-y"
                  type="range"
                  min={10}
                  max={300}
                  value={textY}
                  onChange={(e) => setTextY(Number(e.target.value))}
                  className="mt-1 w-full cursor-pointer accent-[#7C5CFF]"
                />
                <span className="text-[10px] text-slate-500">{textY}px</span>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Right: live preview */}
        <div className="space-y-5">
          <motion.section variants={rise} className="glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="icon-tile icon-tile-cyan h-9 w-9 rounded-[12px]">
                  <Eye className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="card-title">Live Card Preview</h3>
                  <p className="card-sub mt-0.5">Exactly what a new member sees</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="welcome-preview-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  aria-label="Preview username"
                  title={live ? "Preview only — a sample member name" : undefined}
                  className="glass-input h-9 w-28 py-0"
                />
                <input
                  id="welcome-preview-server"
                  type="text"
                  value={serverName}
                  onChange={(e) => {
                    serverNameEdited.current = true;
                    setServerName(e.target.value);
                  }}
                  placeholder="Server"
                  aria-label="Preview server name"
                  title={live ? "Preview only — the name shown on the card" : undefined}
                  className="glass-input h-9 w-28 py-0"
                />
              </div>
            </div>

            <div
              className={`relative mt-5 h-64 w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${template.gradient} shadow-2xl`}
            >
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-xl" />
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-xl" />

              {/* Avatar */}
              <div
                className="absolute overflow-hidden rounded-full border-4 border-white/30 shadow-xl"
                style={{ left: `${avatarX}px`, top: `${avatarY}px`, width: 64, height: 64 }}
              >
                <img src={PLACEHOLDER_AVATAR} alt="Avatar" className="h-full w-full object-cover" />
              </div>

              {/* Username */}
              <div
                className="absolute text-lg font-extrabold drop-shadow-lg"
                style={{ left: `${textX}px`, top: `${textY}px`, color: cardColor }}
              >
                {username}
              </div>

              {/* Welcome text */}
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <span
                  className="text-xs font-semibold uppercase tracking-wider text-white/80"
                  style={{ color: cardColor }}
                >
                  Welcome to {serverName}
                </span>
              </div>

              {/* Member count badge */}
              <div className="absolute top-4 right-4 rounded-full bg-black/20 px-3 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
                {live ? `Members ${memberCountText}` : `Member #${MEMBER_COUNT}`}
              </div>
            </div>
          </motion.section>

          <motion.section variants={rise} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile-violet h-9 w-9 rounded-[12px]">
                <Type className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Message Preview</h3>
                <p className="card-sub mt-0.5">How the welcome text reads in channel</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-xs leading-relaxed text-slate-300">
                {welcomeMsg
                  .replace("{user}", `<@${username}>`)
                  .replace("{guild}", serverName)
                  .replace("{memberCount}", memberCountText)}
              </p>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Variables reference */}
      <motion.section variants={rise} className="glass-card p-5">
        <div className="flex items-center gap-3">
          <span className="icon-tile icon-tile-amber h-9 w-9 rounded-[12px]">
            <Type className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="card-title">Available Variables</h3>
            <p className="card-sub mt-0.5">Drop these into any welcome or farewell message</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["{user}", "@mentions the new member"],
            ["{username}", "The member's username"],
            ["{guild}", "Server name"],
            ["{memberCount}", "Total member count"],
            ["{userTag}", "Legacy username tag"],
            ["{age}", "Account age in days"],
            ["{createdAt}", "Account creation date"],
            ["{joinedAt}", "Join date"],
          ].map(([varName, desc]) => (
            <div
              key={varName}
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5"
            >
              <code className="rounded bg-[#7C5CFF]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#B9A6FF]">
                {varName}
              </code>
              <span className="text-[10px] text-slate-500">{desc}</span>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
