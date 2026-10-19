"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Settings, Lock, Volume2, Users } from "lucide-react";

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

const inputCls =
  "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C5CFF]/50 transition-colors";

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
      <motion.div variants={rise}>
        <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
            <Mic className="h-4 w-4" />
          </span>
          Temporary Voice Rooms
        </h2>
        <p className="mt-1.5 font-body text-xs text-slate-500">
          Join to Create voice channels with control panels for locking, renaming, and bitrate — cleaned up automatically when empty.
        </p>
      </motion.div>

      <motion.div variants={rise} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Hub configuration */}
        <section className="panel panel-hover p-5 lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <Settings className="h-4 w-4 text-[#7C5CFF]" />
            <h3 className="text-sm font-bold text-white">Voice Hub Configuration</h3>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Hub Channel Name" htmlFor="hub-channel-name">
              <input
                id="hub-channel-name"
                name="hubChannelName"
                type="text"
                value={hubChannel}
                onChange={(e) => setHubChannel(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </Field>

            <Field
              label="Created Channel Template"
              htmlFor="channel-prefix-template"
              hint="Use {user} for the member's name — e.g. 🔊 NovaStar's Room."
            >
              <input
                id="channel-prefix-template"
                name="channelPrefixTemplate"
                type="text"
                value={channelPrefix}
                onChange={(e) => setChannelPrefix(e.target.value)}
                className={`${inputCls} font-mono text-[#B9A6FF]`}
              />
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <label htmlFor="temp-voice-user-limit" className="text-xs font-bold text-slate-300">
              Default User Limit
            </label>
            <input
              id="temp-voice-user-limit"
              name="tempVoiceUserLimit"
              type="number"
              value={defaultLimit}
              onChange={(e) => setDefaultLimit(Number(e.target.value))}
              className="w-16 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-center text-xs text-white font-mono focus:outline-none focus:border-[#7C5CFF]/50 transition-colors"
            />
          </div>
        </section>

        {/* Live rooms */}
        <section className="panel panel-hover overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-4 w-4 text-[#7C5CFF]" />
              <h3 className="text-sm font-bold text-white">Live Now</h3>
            </div>
            <span className="section-label">{LIVE_ROOMS.length} rooms</span>
          </div>

          <div className="mt-3 divide-y divide-white/[0.04]">
            {LIVE_ROOMS.map((room) => (
              <div
                key={room.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#7C5CFF]/20 bg-[#7C5CFF]/10 text-[#7C5CFF]">
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
                    <span>created {room.created}</span>
                  </div>
                </div>
                {room.locked && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#FFB547]/25 bg-[#FFB547]/10 px-2 py-0.5 text-[9px] font-bold text-[#FFB547]">
                    <Lock className="h-2.5 w-2.5" /> Locked
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
