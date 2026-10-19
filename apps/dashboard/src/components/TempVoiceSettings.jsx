"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Settings,
  Lock,
  Volume2,
  Users,
  Hash,
  Clock,
  UserPlus,
  Save,
  CheckCircle2,
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

/* ────────────────────────────── world data ────────────────────────────── */

const LIVE_ROOMS = [
  { id: 1, name: "🔊 NovaStar's Room", members: "3/5", created: "12m ago", locked: false },
  { id: 2, name: "🎧 LunaByte's Room", members: "2/5", created: "1h ago", locked: false },
  { id: 3, name: "🎮 pixelForge's Room", members: "5/5", created: "3h ago", locked: true },
];

/* ────────────────────────────── shared atoms ────────────────────────────── */

function Toggle({ enabled, onChange, title }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      title={title}
      aria-pressed={enabled}
      className={`toggle-track ${enabled ? "toggle-track-on" : ""}`}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

function Field({ label, htmlFor, hint, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="section-label mb-1.5 block">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[10px] text-slate-600">{hint}</p>}
    </div>
  );
}

/* ────────────────────────────── helpers ────────────────────────────── */

/* Discord channel types: 0 = text, 2 = voice, 4 = category. */
const CHANNEL_TYPE_TEXT = 0;
const CHANNEL_TYPE_VOICE = 2;
const CHANNEL_TYPE_CATEGORY = 4;

const mapChannels = (raw) =>
  (Array.isArray(raw) ? raw : [])
    .filter((c) => c && c.id != null)
    .map((c) => ({
      id: String(c.id),
      name: c.name ? String(c.name) : String(c.id),
      type: Number(c.type),
    }));

const byType = (list, type) => (Array.isArray(list) ? list : []).filter((c) => c.type === type);

/* Keep a stored id selectable even when the live channel list doesn't contain it. */
const channelOptions = (list, selectedId) => {
  const base = Array.isArray(list) ? list : [];
  if (selectedId && !base.some((c) => c.id === selectedId)) {
    return [...base, { id: selectedId, name: null, missing: true }];
  }
  return base;
};

const channelName = (list, id) => {
  if (!id) return null;
  const match = (Array.isArray(list) ? list : []).find((c) => c.id === id);
  return match ? match.name : null;
};

const formatExpiry = (value) => {
  if (!value) return "no expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "no expiry";
  return `expires ${date.toLocaleString()}`;
};

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function TempVoiceSettings({ guildId }) {
  /* demo state (guest / fallback) */
  const [hubChannel, setHubChannel] = useState("➕ Join to Create");
  const [channelPrefix, setChannelPrefix] = useState("🔊 {user}'s Room");
  const [defaultLimit, setDefaultLimit] = useState(5);

  /* real state */
  const [live, setLive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [creatorChannelId, setCreatorChannelId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [nameTemplate, setNameTemplate] = useState("");
  const [textLinkedChannelId, setTextLinkedChannelId] = useState("");
  const [channels, setChannels] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, tone = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3200);
  };

  /* request guards — only the latest load may write state */
  const requestSeq = useRef(0);
  const roomSeq = useRef(0);
  const channelSeq = useRef(0);

  /* ────────────────────────────── real data ────────────────────────────── */

  const loadVoice = useCallback(async () => {
    const requestId = ++requestSeq.current;
    if (!guildId) {
      setLive(false);
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/voice`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== requestSeq.current) return; // stale response from a previous guild
      setEnabled(Boolean(data?.enabled));
      setCreatorChannelId(data?.creatorChannelId ? String(data.creatorChannelId) : "");
      setCategoryId(data?.categoryId ? String(data.categoryId) : "");
      setNameTemplate(typeof data?.nameTemplate === "string" ? data.nameTemplate : "");
      setTextLinkedChannelId(data?.textLinkedChannelId ? String(data.textLinkedChannelId) : "");
      setLive(true);
    } catch (err) {
      if (requestId !== requestSeq.current) return; // stale failure — ignore
      // Keep the humanized fallback quietly (live stays false → demo markup).
      console.warn("[TempVoiceSettings] Failed to load voice settings — showing demo data:", err);
    }
  }, [guildId]);

  useEffect(() => {
    loadVoice();
    return () => {
      requestSeq.current += 1;
    };
  }, [loadVoice]);

  const loadRooms = useCallback(async () => {
    const requestId = ++roomSeq.current;
    if (!guildId) {
      setRooms([]);
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/voice/active`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== roomSeq.current) return;
      setRooms(
        (Array.isArray(data?.rooms) ? data.rooms : []).filter((r) => r && r.channelId != null)
      );
    } catch (err) {
      if (requestId !== roomSeq.current) return;
      console.warn("[TempVoiceSettings] Failed to load live voice rooms:", err);
      setRooms([]);
    }
  }, [guildId]);

  useEffect(() => {
    loadRooms();
    return () => {
      roomSeq.current += 1;
    };
  }, [loadRooms]);

  /* Live channel list — used for the pickers and to resolve live room names. */
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
      setChannels(mapChannels(data?.channels));
    } catch (err) {
      if (requestId !== channelSeq.current) return;
      console.warn(
        "[TempVoiceSettings] Failed to load channels — using a manual channel id input:",
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

  /* ────────────────────────────── save ────────────────────────────── */

  const saveVoice = async () => {
    if (!guildId) return;
    if (!live) {
      showToast("Couldn't load live settings — nothing was saved", "error");
      return;
    }
    const template = nameTemplate.trim();
    if (!template) {
      showToast("Created channel template can't be empty", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: Boolean(enabled),
          creatorChannelId: creatorChannelId || null,
          categoryId: categoryId || null,
          nameTemplate: template,
          textLinkedChannelId: textLinkedChannelId || null,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        showToast(errBody?.error || "Failed to save temporary voice settings", "error");
        return;
      }
      await res.json().catch(() => ({})); // drain the body — the re-read below is authoritative
      showToast("Temporary voice settings saved");
      await loadVoice();
    } catch (err) {
      console.warn("[TempVoiceSettings] Failed to save temporary voice settings:", err);
      showToast("Network error while saving temporary voice settings", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ────────────────────────────── derived values ────────────────────────────── */

  const voiceChannels = byType(channels, CHANNEL_TYPE_VOICE);
  const categoryChannels = byType(channels, CHANNEL_TYPE_CATEGORY);
  const textChannels = byType(channels, CHANNEL_TYPE_TEXT);

  /* ══════════════════════════════════ render ══════════════════════════════ */

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Toast (real mode only) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="glass-dropdown fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold"
          >
            {toast.tone === "error" ? (
              <AlertCircle className="h-4 w-4 text-[#FBBF24]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-violet">
            <Mic className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[15px]">Temporary Voice Rooms</h2>
            <p className="card-sub mt-0.5">
              Join to Create voice channels with control panels for locking, renaming, and bitrate
              — cleaned up automatically when empty.
            </p>
          </div>
        </div>
        <>
          {live ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={saveVoice}
              disabled={saving}
              className="btn-primary"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save Voice Settings"}
            </motion.button>
          ) : null}
          <span className="chip chip-green">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
            {live ? rooms.length : LIVE_ROOMS.length} rooms live
          </span>
        </>
      </motion.div>

      <motion.div variants={rise} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Hub configuration */}
        <section className="glass-card p-5 lg:col-span-2">
          <div
            className={
              live ? "flex w-full items-center justify-between gap-3" : "flex items-center gap-3"
            }
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="icon-tile icon-tile-blue h-9 w-9 rounded-[12px]">
                <Settings className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Voice Hub Configuration</h3>
                <p className="card-sub mt-0.5">Where rooms are created and how they are named</p>
              </div>
            </div>
            {live ? (
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Enabled
                </span>
                <Toggle
                  enabled={enabled}
                  onChange={setEnabled}
                  title="Turn temporary voice rooms on or off"
                />
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label={live ? "Hub channel (join to create)" : "Voice category (hub channel)"}
              htmlFor="hub-channel-name"
            >
              {!live ? (
                <span className="relative block">
                  <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                  <input
                    id="hub-channel-name"
                    name="hubChannelName"
                    type="text"
                    value={hubChannel}
                    onChange={(e) => setHubChannel(e.target.value)}
                    className="glass-input pl-8 font-mono"
                  />
                </span>
              ) : channels ? (
                <select
                  id="hub-channel-name"
                  name="hubChannelName"
                  value={creatorChannelId}
                  onChange={(e) => setCreatorChannelId(e.target.value)}
                  className="glass-select"
                >
                  <option value="">No channel selected</option>
                  {channelOptions(voiceChannels, creatorChannelId).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.missing ? `${c.id} (not in channel list)` : c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="hub-channel-name"
                  name="hubChannelName"
                  type="text"
                  value={creatorChannelId}
                  onChange={(e) => setCreatorChannelId(e.target.value)}
                  placeholder="Voice channel ID"
                  className="glass-input font-mono"
                />
              )}
              {live ? (
                <p className="mt-1.5 text-[10px] text-slate-600">
                  Saved channel: {channelName(voiceChannels, creatorChannelId) || "none selected"}
                </p>
              ) : null}
            </Field>

            <Field
              label="Created channel template"
              htmlFor="channel-prefix-template"
              hint={
                live
                  ? "Use {user} for the member's name — the bot fills it in on join."
                  : "Use {user} for the member's name — e.g. 🔊 NovaStar's Room."
              }
            >
              <input
                id="channel-prefix-template"
                name="channelPrefixTemplate"
                type="text"
                value={live ? nameTemplate : channelPrefix}
                onChange={(e) =>
                  live ? setNameTemplate(e.target.value) : setChannelPrefix(e.target.value)
                }
                className="glass-input font-mono text-[#B9A6FF]"
              />
            </Field>

            {live ? (
              <Field label="Voice category" htmlFor="temp-voice-category">
                {channels ? (
                  <select
                    id="temp-voice-category"
                    name="tempVoiceCategory"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="glass-select"
                  >
                    <option value="">No category selected</option>
                    {channelOptions(categoryChannels, categoryId).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.missing ? `${c.id} (not in channel list)` : c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="temp-voice-category"
                    name="tempVoiceCategory"
                    type="text"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    placeholder="Category ID"
                    className="glass-input font-mono"
                  />
                )}
                <p className="mt-1.5 text-[10px] text-slate-600">
                  Saved category:{" "}
                  {channelName(categoryChannels, categoryId) ||
                    (categoryId ? `id ${categoryId}` : "none selected")}
                </p>
              </Field>
            ) : null}

            {live ? (
              <Field
                label="Linked text channel"
                htmlFor="temp-voice-text-channel"
                hint="Optional — the room's text chat is created here."
              >
                {channels ? (
                  <select
                    id="temp-voice-text-channel"
                    name="tempVoiceTextChannel"
                    value={textLinkedChannelId}
                    onChange={(e) => setTextLinkedChannelId(e.target.value)}
                    className="glass-select"
                  >
                    <option value="">No text channel selected</option>
                    {channelOptions(textChannels, textLinkedChannelId).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.missing ? `${c.id} (not in channel list)` : `#${c.name}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="temp-voice-text-channel"
                    name="tempVoiceTextChannel"
                    type="text"
                    value={textLinkedChannelId}
                    onChange={(e) => setTextLinkedChannelId(e.target.value)}
                    placeholder="Text channel ID"
                    className="glass-input font-mono"
                  />
                )}
                <p className="mt-1.5 text-[10px] text-slate-600">
                  Saved text channel:{" "}
                  {channelName(textChannels, textLinkedChannelId) ||
                    (textLinkedChannelId ? `id ${textLinkedChannelId}` : "none selected")}
                </p>
              </Field>
            ) : null}
          </div>

          <div className="mt-5">
            <span className="section-label mb-1.5 block">Room defaults</span>
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-dashed border-white/[0.10] bg-white/[0.02] p-4 md:grid-cols-3">
              <Field label="Default user limit" htmlFor="temp-voice-user-limit">
                <input
                  id="temp-voice-user-limit"
                  name="tempVoiceUserLimit"
                  type="number"
                  value={live ? "" : defaultLimit}
                  onChange={(e) => setDefaultLimit(Number(e.target.value))}
                  placeholder={live ? "Set in Discord" : undefined}
                  disabled={live}
                  readOnly={live}
                  title={
                    live ? "Member limit is configured in Discord — not editable here" : undefined
                  }
                  className={
                    live
                      ? "glass-input cursor-not-allowed text-center font-mono tabular-nums opacity-70"
                      : "glass-input text-center font-mono tabular-nums"
                  }
                />
              </Field>

              <Field
                label="Default duration"
                htmlFor="temp-voice-duration"
                hint="Set with /tempvoice in Discord."
              >
                <input
                  id="temp-voice-duration"
                  name="tempVoiceDuration"
                  type="text"
                  defaultValue="30 minutes"
                  disabled
                  readOnly
                  title="The default room duration is configured from the bot with /tempvoice"
                  className="glass-input cursor-not-allowed opacity-70"
                />
              </Field>

              <div className="min-w-0">
                <span className="section-label mb-1.5 block">Human joins</span>
                <div className="flex items-center gap-2.5">
                  <span
                    className="toggle-track cursor-not-allowed opacity-60"
                    title="Human-join handling is configured from the bot with /tempvoice"
                    aria-hidden="true"
                  >
                    <span className="toggle-thumb" />
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-500">
                    <UserPlus className="h-3 w-3 shrink-0" />
                    {live ? "Human-join handling — set in Discord" : "Move humans when a room empties"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live rooms */}
        <section className="glass-card p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-cyan h-9 w-9 rounded-[12px]">
              <Volume2 className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Live Now</h3>
              <p className="card-sub mt-0.5">Rooms currently open on the server</p>
            </div>
          </div>

          {!live ? (
            <div className="mt-4 space-y-1.5">
              {LIVE_ROOMS.map((room) => (
                <div key={room.id} className="list-row gap-3 px-3 py-2.5">
                  <span className="icon-tile icon-tile-cyan h-8 w-8 rounded-[10px]">
                    <Volume2 className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-white">{room.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {room.members}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        created {room.created}
                      </span>
                    </div>
                  </div>
                  {room.locked && (
                    <span className="chip chip-amber shrink-0">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="empty-state mt-4">
              <span className="empty-state-icon">
                <Volume2 className="h-4 w-4" />
              </span>
              <span className="empty-state-title">No temporary voice channels are live</span>
              <span>A room shows up here as soon as someone joins the hub channel.</span>
            </div>
          ) : (
            <div className="mt-4 space-y-1.5">
              {rooms.map((room) => {
                const id = String(room.channelId);
                const resolved = channelName(voiceChannels, id);
                return (
                  <div key={id} className="list-row gap-3 px-3 py-2.5">
                    <span className="icon-tile icon-tile-cyan h-8 w-8 rounded-[10px]">
                      <Volume2 className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-white">
                        {resolved || `Room ${id}`}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.ownerId ? String(room.ownerId) : "unknown owner"}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatExpiry(room.expiresAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </motion.div>
    </motion.div>
  );
}
