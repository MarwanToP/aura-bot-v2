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

/* ────────────────────────────── world data ────────────────────────────── */

const INITIAL_LINKS = [
  { id: 1, channel: "#general", expiresIn: "42m left", maxUses: 10, used: 6, created: "25m ago" },
  { id: 2, channel: "#announcements", expiresIn: "21h left", maxUses: 5, used: 2, created: "3h ago" },
  { id: 3, channel: "#bot-commands", expiresIn: "5d left", maxUses: 25, used: 19, created: "2d ago" },
];

/* Duration options offered by the create form → the label shown on the link. */
const EXPIRY_LABEL = {
  "30m": "30m left",
  "1h": "1h left",
  "24h": "24h left",
  "7d": "7d left",
};

export default function TempLinkSettings() {
  const [links, setLinks] = useState(INITIAL_LINKS);
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /* Optional overrides let the create form use the values the user picked;
     calling createLink() with no arguments keeps the original behaviour. */
  const createLink = (options) => {
    const { channel = "#general", expiresIn = "1h left", maxUses = 10 } = options || {};
    setLinks((list) => [
      {
        id: Date.now(),
        channel,
        expiresIn,
        maxUses,
        used: 0,
        created: "just now",
      },
      ...list,
    ]);
    showToast(`Invite created — fresh link to ${channel} is live`);
  };

  const handleCreate = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const rawChannel = String(data.get("channel") || "").trim();
    const channel = rawChannel ? (rawChannel.startsWith("#") ? rawChannel : `#${rawChannel}`) : "#general";
    const uses = Number(data.get("maxUses"));
    const maxUses = Number.isFinite(uses) ? Math.min(100, Math.max(1, Math.round(uses))) : 10;
    const expiresIn = EXPIRY_LABEL[String(data.get("expiry"))] || "1h left";
    createLink({ channel, expiresIn, maxUses });
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
            className="glass-dropdown fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-white shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-blue h-10 w-10 rounded-[14px]">
            <Link2 className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[17px]">Temp Links</h2>
            <p className="card-sub mt-1 max-w-xl">
              Time-limited invite links with usage caps — perfect for events, giveaways, and drop
              announcements.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="chip chip-amber">Premium</span>
          <button type="button" onClick={() => createLink()} className="btn-glass">
            <Plus className="h-3.5 w-3.5" /> New link
          </button>
        </div>
      </motion.div>

      {/* Stat tiles */}
      <motion.div variants={rise} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="kpi-tile flex items-center gap-3.5">
          <span className="icon-tile icon-tile-blue h-10 w-10 rounded-[14px]">
            <Link2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="kpi-label">Active Links</div>
            <div className="kpi-value mt-1 text-2xl tabular-nums">{links.length}</div>
          </div>
        </div>
        <div className="kpi-tile flex items-center gap-3.5">
          <span className="icon-tile icon-tile-violet h-10 w-10 rounded-[14px]">
            <Users className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="kpi-label">Total Uses</div>
            <div className="kpi-value mt-1 text-2xl tabular-nums">{totalUses}</div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={rise} className="grid gap-4 lg:grid-cols-3">
        {/* Create */}
        <section className="glass-card rounded-[20px] p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-blue h-10 w-10 rounded-[14px]">
              <Plus className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Create invite link</h3>
              <p className="card-sub mt-0.5">
                Links auto-expire after a set duration or once they hit their usage cap.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
            <label className="block">
              <span className="section-label mb-1.5 block">Target channel</span>
              <input
                type="text"
                name="channel"
                defaultValue="#general"
                placeholder="#general"
                className="glass-input"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="section-label mb-1.5 block">Expires in</span>
                <select name="expiry" defaultValue="1h" className="glass-select">
                  <option value="30m">30 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="24h">24 hours</option>
                  <option value="7d">7 days</option>
                </select>
              </label>
              <label className="block">
                <span className="section-label mb-1.5 block">Max uses</span>
                <input
                  type="number"
                  name="maxUses"
                  min={1}
                  max={100}
                  defaultValue={10}
                  className="glass-input tabular-nums"
                />
              </label>
            </div>

            <button type="submit" className="btn-primary w-full">
              <Plus className="h-3.5 w-3.5" /> Generate link
            </button>
          </form>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A9C2FF]" />
            <p className="text-[11px] leading-relaxed text-slate-500">
              Handy for movie nights, giveaways, and limited-access channels — no manual cleanup.
            </p>
          </div>
        </section>

        {/* Active links */}
        <section className="glass-card overflow-hidden rounded-[20px] lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile-violet h-10 w-10 rounded-[14px]">
                <Link2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Active Temp Links</h3>
                <p className="card-sub mt-0.5">Short-lived invites with usage caps.</p>
              </div>
            </div>
            <span className="chip chip-blue">{links.length} live</span>
          </div>

          {links.length === 0 ? (
            <div className="p-5">
              <div className="empty-state">
                <span className="empty-state-icon">
                  <Link2 className="h-5 w-5" />
                </span>
                <p className="empty-state-title">No active temp links</p>
                <p className="text-[11px] text-slate-500">
                  Create one to invite members to a limited channel.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-white/[0.04]">
              <AnimatePresence initial={false}>
                {links.map((link) => (
                  <motion.div
                    key={link.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: EASE }}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="icon-tile icon-tile-blue h-9 w-9 shrink-0 rounded-[13px]">
                      <Link2 className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-xs font-bold text-white">{link.channel}</span>
                        <span className="chip chip-green">
                          <Clock className="h-3 w-3" />
                          {link.expiresIn}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                          <Users className="h-3 w-3" />
                          {link.used}/{link.maxUses} uses
                        </span>
                        <span className="text-[10px] text-slate-600">created {link.created}</span>
                      </div>
                      <div className="progress-track mt-2 max-w-[220px]">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${
                              link.maxUses > 0
                                ? Math.min(100, Math.round((link.used / link.maxUses) * 100))
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLink(link.id)}
                      title="Revoke link"
                      aria-label={`Revoke link to ${link.channel}`}
                      className="btn-icon h-9 w-9 shrink-0 rounded-[13px] hover:border-[#F87171]/40 hover:bg-[#F87171]/10 hover:text-[#F87171]"
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
