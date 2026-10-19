"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, Palette, Tag, Save, CheckCircle2 } from "lucide-react";

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
  { name: "/serverinfo", desc: "Crystal Realm stats — 12,645 members", uses: "1,284 uses" },
  { name: "/userinfo", desc: "Join date, roles, and activity", uses: "962 uses" },
  { name: "/avatar", desc: "Full-resolution member avatars", uses: "848 uses" },
  { name: "/banner", desc: "Profile banners at full resolution", uses: "517 uses" },
  { name: "/roleinfo", desc: "Role permissions and member counts", uses: "431 uses" },
  { name: "/channelinfo", desc: "Topics, slowmode, and channel perms", uses: "356 uses" },
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
              <Wrench className="h-4 w-4" />
            </span>
            Utility, Colors & Self Roles
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Server utility tools, color roles, and self-assignable role menus for Crystal Realm.
          </p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => showToast("Utility settings saved — self-role menus synced")}
          className="inline-flex items-center gap-2 bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save
        </motion.button>
      </motion.div>

      <motion.div variants={rise} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Utility */}
        <section className="panel panel-hover relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 p-5 pb-4">
            <span className="w-9 h-9 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/25 flex items-center justify-center text-[#7C5CFF] shrink-0">
              <Wrench className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white">Utility</h3>
              <p className="text-xs text-slate-500 mt-0.5">Member-facing info commands</p>
            </div>
          </div>

          <div className="divide-y divide-white/[0.04] border-t border-white/[0.04]">
            {UTILITY_COMMANDS.map((cmd) => (
              <div
                key={cmd.name}
                className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-200">{cmd.name}</span>
                    <span className="bg-[#39D98A]/10 border border-[#39D98A]/25 text-[#39D98A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{cmd.desc}</p>
                </div>
                <span className="text-[10px] text-slate-600 font-mono whitespace-nowrap shrink-0">
                  {cmd.uses}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Colors */}
        <section className="panel panel-hover relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 p-5 pb-4">
            <span className="w-9 h-9 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/25 flex items-center justify-center text-[#7C5CFF] shrink-0">
              <Palette className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white">Color Roles</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tap a swatch to recolor the role</p>
            </div>
          </div>

          <div className="px-5 pb-4 space-y-3 flex-1">
            <div className="grid grid-cols-3 gap-2">
              {PREDEFINED_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setSelectedColor(c.hex)}
                  className={`p-3 rounded-xl text-[10px] font-bold text-white transition-all cursor-pointer [text-shadow:0_1px_2px_rgba(0,0,0,0.6)] ${
                    selectedColor === c.hex
                      ? "ring-2 ring-[#7C5CFF] ring-offset-2 ring-offset-[#0B0D12] scale-[1.03]"
                      : "opacity-80 hover:opacity-100 hover:scale-[1.02]"
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-white/[0.04]">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/[0.12] shrink-0"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-[11px] text-slate-500">Selected</span>
              <span className="text-[11px] font-mono font-bold text-slate-300">{selectedColor}</span>
            </div>
          </div>
        </section>

        {/* Self Roles */}
        <section className="panel panel-hover relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 p-5 pb-4">
            <span className="w-9 h-9 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/25 flex items-center justify-center text-[#7C5CFF] shrink-0">
              <Tag className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white">Self-Assignable Roles</h3>
              <p className="text-xs text-slate-500 mt-0.5">Reaction-role menus in #general</p>
            </div>
          </div>

          <div className="divide-y divide-white/[0.04] border-t border-white/[0.04]">
            {selfRoles.map((role) => (
              <div
                key={role.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-lg leading-none">{role.emoji}</span>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-white truncate">{role.name}</span>
                  <span className="block text-[10px] text-slate-500">
                    {role.members.toLocaleString("en-US")} members
                  </span>
                </div>
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: role.color }}
                />
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
}
