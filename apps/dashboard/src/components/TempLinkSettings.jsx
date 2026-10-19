"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Clock, Users, Shield, Plus, Trash2, CheckCircle2 } from "lucide-react";

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

const btnPrimary =
  "inline-flex items-center gap-2 bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] cursor-pointer";

/* ────────────────────────────── world data ────────────────────────────── */

const INITIAL_LINKS = [
  { id: 1, channel: "#general", expiresIn: "42m left", maxUses: 10, used: 6, created: "25m ago" },
  { id: 2, channel: "#announcements", expiresIn: "21h left", maxUses: 5, used: 2, created: "3h ago" },
  { id: 3, channel: "#bot-commands", expiresIn: "5d left", maxUses: 25, used: 19, created: "2d ago" },
];

export default function TempLinkSettings() {
  const [links, setLinks] = useState(INITIAL_LINKS);
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  const createLink = () => {
    setLinks((list) => [
      {
        id: Date.now(),
        channel: "#general",
        expiresIn: "1h left",
        maxUses: 10,
        used: 0,
        created: "just now",
      },
      ...list,
    ]);
    showToast("Invite created — fresh link to #general is live");
  };

  const removeLink = (id) => {
    const link = links.find((l) => l.id === id);
    setLinks((list) => list.filter((l) => l.id !== id));
    if (link) showToast(`Invite revoked — link to ${link.channel} no longer works`);
  };

  const totalUses = links.reduce((sum, l) => sum + l.used, 0);

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
              <Link2 className="h-4 w-4" />
            </span>
            Temp Links
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Time-limited invite links with usage caps — perfect for events, giveaways, and drop announcements.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFB547]/25 bg-[#FFB547]/10 px-2.5 py-1 text-[10px] font-bold text-[#FFB547]">
            PREMIUM
          </span>
          <button type="button" onClick={createLink} className={btnPrimary}>
            <Plus className="h-3.5 w-3.5" /> New link
          </button>
        </div>
      </motion.div>

      <motion.div variants={rise} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* About */}
        <section className="panel panel-hover p-5">
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 text-[#7C5CFF]" />
            <h3 className="text-sm font-bold text-white">About</h3>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Temporary invite links auto-expire after a set duration or once they hit their usage cap.
            Handy for movie nights, giveaways, and limited-access channels — no manual cleanup.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <div className="section-label">Active Links</div>
              <div className="mt-1.5 text-2xl font-extrabold text-white tabular-nums">
                {links.length}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <div className="section-label">Uses</div>
              <div className="mt-1.5 text-2xl font-extrabold text-white tabular-nums">
                {totalUses}
              </div>
            </div>
          </div>
        </section>

        {/* Active links */}
        <section className="panel panel-hover overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <div className="flex items-center gap-2.5">
              <Link2 className="h-4 w-4 text-[#7C5CFF]" />
              <h3 className="text-sm font-bold text-white">Active Temp Links</h3>
            </div>
            <span className="section-label">{links.length} live</span>
          </div>

          {links.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-5 py-10 text-center">
              <Link2 className="h-6 w-6 text-slate-700" />
              <p className="text-xs font-bold text-slate-400">No active temp links</p>
              <p className="text-[10px] text-slate-600">
                Create one to invite members to a limited channel.
              </p>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-white/[0.04]">
              <AnimatePresence initial={false}>
                {links.map((link) => (
                  <motion.div
                    key={link.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: EASE }}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#7C5CFF]/20 bg-[#7C5CFF]/10 text-[#7C5CFF]">
                      <Link2 className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-xs font-bold text-white">{link.channel}</span>
                        <span className="rounded-full border border-[#39D98A]/25 bg-[#39D98A]/10 px-2 py-0.5 text-[9px] font-bold text-[#39D98A]">
                          {link.expiresIn}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {link.used}/{link.maxUses} uses
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          created {link.created}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLink(link.id)}
                      title="Revoke link"
                      className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5 text-slate-500 transition-colors hover:border-[#FF5C7A]/30 hover:bg-[#FF5C7A]/10 hover:text-[#FF5C7A] cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </motion.div>
    </motion.div>
  );
}
