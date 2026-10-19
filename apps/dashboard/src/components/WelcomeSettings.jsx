"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, LogOut, Palette, Type, Eye, Save, CheckCircle2 } from "lucide-react";

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

const compactInputCls =
  "bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[11px] text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C5CFF]/50 transition-colors";

const btnPrimary =
  "inline-flex items-center gap-2 bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] cursor-pointer";

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors ${
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
              <UserCheck className="h-4 w-4" />
            </span>
            Welcome & Goodbye Designer
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Design animated welcome cards, customize messages, and set farewell embeds for Crystal Realm.
          </p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => showToast("Welcome & goodbye settings saved")}
          className={btnPrimary}
        >
          <Save className="h-3.5 w-3.5" />
          Save Settings
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left: settings */}
        <div className="space-y-5">
          {/* Welcome messages */}
          <motion.section variants={rise} className="panel panel-hover p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
                  <UserCheck className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Welcome Messages</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Greet every new member the moment they join.
                  </p>
                </div>
              </div>
              <Toggle enabled={welcomeEnabled} onChange={setWelcomeEnabled} />
            </div>

            {welcomeEnabled && (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="section-label mb-1.5 block">Channel</span>
                  <input
                    type="text"
                    value={welcomeChannel}
                    onChange={(e) => setWelcomeChannel(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="section-label mb-1.5 block">
                    Message (use {"{user}"}, {"{guild}"}, {"{memberCount}"})
                  </span>
                  <textarea
                    value={welcomeMsg}
                    onChange={(e) => setWelcomeMsg(e.target.value)}
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </label>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-300">Show welcome card</span>
                  <Toggle enabled={showCard} onChange={setShowCard} />
                </div>
              </div>
            )}
          </motion.section>

          {/* Farewell messages */}
          <motion.section variants={rise} className="panel panel-hover p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#5B8CFF]/25 bg-[#5B8CFF]/10 text-[#5B8CFF]">
                  <LogOut className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Goodbye / Farewell Messages</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Send a warm send-off when members leave.
                  </p>
                </div>
              </div>
              <Toggle enabled={farewellEnabled} onChange={setFarewellEnabled} />
            </div>

            {farewellEnabled && (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="section-label mb-1.5 block">Channel</span>
                  <input
                    type="text"
                    value={farewellChannel}
                    onChange={(e) => setFarewellChannel(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="section-label mb-1.5 block">Farewell message</span>
                  <textarea
                    value={farewellMsg}
                    onChange={(e) => setFarewellMsg(e.target.value)}
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </label>
              </div>
            )}
          </motion.section>

          {/* Card designer */}
          <motion.section variants={rise} className="panel panel-hover p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
                <Palette className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">Welcome Card Designer</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Pick a template and position the avatar and username.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <span className="section-label mb-1.5 block">Card template</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {CARD_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`rounded-xl bg-gradient-to-br ${t.gradient} px-3 py-2 text-[10px] font-bold text-white transition-all cursor-pointer ${
                      selectedTemplate === t.id
                        ? "ring-2 ring-[#7C5CFF] scale-[1.03]"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
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

            <div className="mt-4 grid grid-cols-2 gap-4">
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
          <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Eye className="h-4 w-4 text-[#7C5CFF]" />
              Live Card Preview
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className={`${compactInputCls} w-28`}
              />
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="Server"
                className={`${compactInputCls} w-28`}
              />
            </div>
          </motion.div>

          <motion.div
            variants={rise}
            className={`relative h-64 w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${template.gradient} shadow-2xl`}
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
          </motion.div>

          <motion.section variants={rise} className="panel p-4">
            <h4 className="flex items-center gap-2 text-xs font-bold text-white">
              <Type className="h-3.5 w-3.5 text-[#7C5CFF]" />
              Message Preview
            </h4>
            <div className="mt-2 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
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
      <motion.section variants={rise} className="panel p-5">
        <h3 className="text-sm font-extrabold text-white">Available Variables</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
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
              className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] p-2"
            >
              <code className="rounded bg-[#7C5CFF]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#7C5CFF]">
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
