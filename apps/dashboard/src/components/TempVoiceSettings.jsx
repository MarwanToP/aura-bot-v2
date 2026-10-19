"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Settings, Lock, Volume2, Users, Hash, Clock, UserPlus } from "lucide-react";

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

export default function TempVoiceSettings() {
  const [hubChannel, setHubChannel] = useState("➕ Join to Create");
  const [channelPrefix, setChannelPrefix] = useState("🔊 {user}'s Room");
  const [defaultLimit, setDefaultLimit] = useState(5);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
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
        <span className="chip chip-green">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
          {LIVE_ROOMS.length} rooms live
        </span>
      </motion.div>

      <motion.div variants={rise} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Hub configuration */}
        <section className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-blue h-9 w-9 rounded-[12px]">
              <Settings className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Voice Hub Configuration</h3>
              <p className="card-sub mt-0.5">Where rooms are created and how they are named</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Voice category (hub channel)" htmlFor="hub-channel-name">
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
            </Field>

            <Field
              label="Created channel template"
              htmlFor="channel-prefix-template"
              hint="Use {user} for the member's name — e.g. 🔊 NovaStar's Room."
            >
              <input
                id="channel-prefix-template"
                name="channelPrefixTemplate"
                type="text"
                value={channelPrefix}
                onChange={(e) => setChannelPrefix(e.target.value)}
                className="glass-input font-mono text-[#B9A6FF]"
              />
            </Field>
          </div>

          <div className="mt-5">
            <span className="section-label mb-1.5 block">Room defaults</span>
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-dashed border-white/[0.10] bg-white/[0.02] p-4 md:grid-cols-3">
              <Field label="Default user limit" htmlFor="temp-voice-user-limit">
                <input
                  id="temp-voice-user-limit"
                  name="tempVoiceUserLimit"
                  type="number"
                  value={defaultLimit}
                  onChange={(e) => setDefaultLimit(Number(e.target.value))}
                  className="glass-input text-center font-mono tabular-nums"
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
                    Move humans when a room empties
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
        </section>
      </motion.div>
    </motion.div>
  );
}
