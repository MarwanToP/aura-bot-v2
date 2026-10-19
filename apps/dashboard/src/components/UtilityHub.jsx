"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Palette,
  Tag,
  Save,
  CheckCircle2,
  Server,
  UserRound,
  Image,
  Flag,
  ShieldCheck,
  Radio,
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

/* ────────────────────────────── data ────────────────────────────── */

const PREDEFINED_COLORS = [
  { name: "Red", hex: "#ED4245" },
  { name: "Blue", hex: "#5865F2" },
  { name: "Green", hex: "#57F287" },
  { name: "Yellow", hex: "#FEE75C" },
  { name: "Orange", hex: "#FF7B2B" },
  { name: "Purple", hex: "#9B59B6" },
  { name: "Pink", hex: "#FF69B4" },
  { name: "Cyan", hex: "#00BFFF" },
  { name: "White", hex: "#FFFFFF" },
];

const UTILITY_COMMANDS = [
  {
    name: "/serverinfo",
    desc: "Crystal Realm stats — 12,645 members",
    uses: "1,284 uses",
    icon: Server,
    tone: "blue",
  },
  {
    name: "/userinfo",
    desc: "Join date, roles, and activity",
    uses: "962 uses",
    icon: UserRound,
    tone: "violet",
  },
  {
    name: "/avatar",
    desc: "Full-resolution member avatars",
    uses: "848 uses",
    icon: Image,
    tone: "cyan",
  },
  {
    name: "/banner",
    desc: "Profile banners at full resolution",
    uses: "517 uses",
    icon: Flag,
    tone: "pink",
  },
  {
    name: "/roleinfo",
    desc: "Role permissions and member counts",
    uses: "431 uses",
    icon: ShieldCheck,
    tone: "green",
  },
  {
    name: "/channelinfo",
    desc: "Topics, slowmode, and channel perms",
    uses: "356 uses",
    icon: Radio,
    tone: "amber",
  },
];

const INITIAL_SELF_ROLES = [
  { id: 1, name: "Announcements", emoji: "📢", color: "#7C5CFF", members: 2318 },
  { id: 2, name: "Events", emoji: "🎉", color: "#39D98A", members: 1264 },
  { id: 3, name: "Giveaways", emoji: "🎁", color: "#FFB547", members: 1876 },
];

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function UtilityHub() {
  const [selectedColor, setSelectedColor] = useState("#5865F2");
  const [selfRoles] = useState(INITIAL_SELF_ROLES);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
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
            <Wrench className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[15px]">Utility, Colors &amp; Self Roles</h2>
            <p className="card-sub mt-0.5">
              Server utility tools, color roles, and self-assignable role menus for Crystal Realm.
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => showToast("Utility settings saved — self-role menus synced")}
          className="btn-primary"
        >
          <Save className="h-4 w-4" /> Save
        </motion.button>
      </motion.div>

      {/* Utility command tiles */}
      <motion.section variants={rise} className="glass-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="icon-tile icon-tile-cyan h-9 w-9 rounded-[12px]">
              <Wrench className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Utility Commands</h3>
              <p className="card-sub mt-0.5">Member-facing info commands, ready in every channel</p>
            </div>
          </div>
          <span className="chip chip-cyan">{UTILITY_COMMANDS.length} commands</span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {UTILITY_COMMANDS.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <div key={cmd.name} className="glass-card glass-card-hover p-4">
                <div className="flex items-start gap-3">
                  <span className={`icon-tile icon-tile-${cmd.tone} h-9 w-9 rounded-[12px]`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block font-mono text-xs font-bold text-white">{cmd.name}</span>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{cmd.desc}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="chip chip-green">Active</span>
                  <span className="chip tabular-nums">{cmd.uses}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Colors */}
        <motion.section variants={rise} className="glass-card p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-pink h-9 w-9 rounded-[12px]">
              <Palette className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Color Roles</h3>
              <p className="card-sub mt-0.5">Tap a swatch to recolor the role</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {PREDEFINED_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setSelectedColor(c.hex)}
                title={`Select ${c.name} (${c.hex})`}
                className={`rounded-xl p-3 text-[10px] font-bold text-white transition-all [text-shadow:0_1px_2px_rgba(0,0,0,0.6)] ${
                  selectedColor === c.hex
                    ? "scale-[1.03] ring-2 ring-[#7C5CFF] ring-offset-2 ring-offset-[#0A0F1A]"
                    : "opacity-80 hover:opacity-100 hover:scale-[1.02]"
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/[0.12]"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-[11px] text-slate-500">Selected</span>
            <span className="text-[11px] font-mono font-bold text-slate-300">{selectedColor}</span>
          </div>
        </motion.section>

        {/* Self Roles */}
        <motion.section variants={rise} className="glass-card p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-green h-9 w-9 rounded-[12px]">
              <Tag className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Self-Assignable Roles</h3>
              <p className="card-sub mt-0.5">Reaction-role menus in #general</p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {selfRoles.map((role) => (
              <div key={role.id} className="list-row gap-3 px-3 py-2.5">
                <span className="text-lg leading-none">{role.emoji}</span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-white">{role.name}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {role.members.toLocaleString("en-US")} members
                  </span>
                </div>
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
