"use client";

import React, { useState } from "react";
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

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function WelcomeSettings() {
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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const template = CARD_TEMPLATES.find((t) => t.id === selectedTemplate) || CARD_TEMPLATES[0];

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
            <UserCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[15px]">Welcome &amp; Goodbye Designer</h2>
            <p className="card-sub mt-0.5">
              Design animated welcome cards, customize messages, and set farewell embeds for
              Crystal Realm.
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => showToast("Welcome & goodbye settings saved")}
          className="btn-primary"
        >
          <Save className="h-3.5 w-3.5" />
          Save Settings
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
                <label className="block">
                  <span className="section-label mb-1.5 block">Channel</span>
                  <span className="relative block">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                    <input
                      type="text"
                      value={welcomeChannel}
                      onChange={(e) => setWelcomeChannel(e.target.value)}
                      className="glass-input pl-8"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="section-label mb-1.5 block">
                    Message (use {"{user}"}, {"{guild}"}, {"{memberCount}"})
                  </span>
                  <textarea
                    value={welcomeMsg}
                    onChange={(e) => setWelcomeMsg(e.target.value)}
                    rows={3}
                    className="glass-textarea"
                  />
                </label>
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
                <label className="block">
                  <span className="section-label mb-1.5 block">Channel</span>
                  <span className="relative block">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                    <input
                      type="text"
                      value={farewellChannel}
                      onChange={(e) => setFarewellChannel(e.target.value)}
                      className="glass-input pl-8"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="section-label mb-1.5 block">Farewell message</span>
                  <textarea
                    value={farewellMsg}
                    onChange={(e) => setFarewellMsg(e.target.value)}
                    rows={3}
                    className="glass-textarea"
                  />
                </label>
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
              <span className="section-label mb-1.5 block">Text color</span>
              <div className="mt-1 flex items-center gap-3">
                <input
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
                <span className="section-label mb-1.5 block">Avatar X</span>
                <input
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
                <span className="section-label mb-1.5 block">Avatar Y</span>
                <input
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
                <span className="section-label mb-1.5 block">Text X</span>
                <input
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
                <span className="section-label mb-1.5 block">Text Y</span>
                <input
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
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="glass-input h-9 w-28 py-0"
                />
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Server"
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
                Member #{MEMBER_COUNT}
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
                  .replace("{memberCount}", MEMBER_COUNT)}
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
