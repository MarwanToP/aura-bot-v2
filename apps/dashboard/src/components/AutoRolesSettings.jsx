"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Clock,
  Shield,
  Save,
  Sparkles,
  CheckCircle2,
  Minus,
  Plus,
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

const SAMPLE_ROLES = [
  { id: "1128439813574934590", name: "Verified", color: "#39D98A" },
  { id: "1128439813574934591", name: "Unverified", color: "#8B92A5" },
  { id: "1128439813574934592", name: "Server VIP", color: "#FFB547" },
  { id: "1128439813574934593", name: "Moderator", color: "#5B8CFF" },
];

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function AutoRolesSettings() {
  const [autoRoleId, setAutoRoleId] = useState(SAMPLE_ROLES[0].id);
  const [autoRoleDelay, setAutoRoleDelay] = useState(0);
  const [roleSearch, setRoleSearch] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const filteredRoles = SAMPLE_ROLES.filter((r) =>
    r.name.toLowerCase().includes(roleSearch.toLowerCase())
  );
  const selectedRole = SAMPLE_ROLES.find((r) => r.id === autoRoleId);
  const delayPct = Math.max(0, Math.min(100, (autoRoleDelay / 300) * 100));

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
            <UserPlus className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[15px]">Auto Roles</h2>
            <p className="card-sub mt-0.5">
              Automatically assign a role to every new member when they join Crystal Realm.
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => showToast("Auto role settings saved")}
          className="btn-primary"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left: the auto-role rule */}
        <div className="space-y-5">
          <motion.section variants={rise} className="glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="icon-tile icon-tile-blue h-9 w-9 rounded-[12px]">
                  <Shield className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="card-title">Auto-Role Rule</h3>
                  <p className="card-sub mt-0.5">Role granted on join, and how long Aura waits</p>
                </div>
              </div>
              <span
                className="toggle-track toggle-track-on cursor-not-allowed opacity-80"
                title="Auto-role assignment is always on for this server — it is managed from the bot"
                aria-hidden="true"
              >
                <span className="toggle-thumb" />
              </span>
            </div>

            <div className="mt-5">
              <span className="section-label mb-1.5 block">Rule status</span>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`chip ${autoRoleId ? "chip-green" : "chip-amber"}`}
                >
                  {autoRoleId ? "Active" : "Inactive"}
                </span>
                {selectedRole ? (
                  <span className="chip">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: selectedRole.color }}
                    />
                    {selectedRole.name}
                  </span>
                ) : (
                  <span className="chip chip-amber">No role selected</span>
                )}
                <span className="chip chip-violet tabular-nums">{autoRoleDelay}s delay</span>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="section-label mb-1.5 block">Search role</span>
              <input
                type="text"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Type to filter roles..."
                className="glass-input"
              />
            </label>

            <div className="mt-4">
              <span className="section-label mb-1.5 block">Select auto role</span>
              <div className="custom-scrollbar mt-1 max-h-48 space-y-1 overflow-y-auto pr-1">
                {filteredRoles.length === 0 && (
                  <p className="px-1 py-3 text-[11px] text-slate-500">
                    No roles match “{roleSearch}”.
                  </p>
                )}
                {filteredRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setAutoRoleId(role.id)}
                    className={`list-row w-full gap-3 px-3 py-2.5 text-left ${
                      autoRoleId === role.id
                        ? "border-[#7C5CFF]/40 bg-[#7C5CFF]/10"
                        : ""
                    }`}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border-2"
                      style={{ borderColor: role.color, backgroundColor: `${role.color}33` }}
                    />
                    <span className="truncate text-xs font-bold text-white">{role.name}</span>
                    {autoRoleId === role.id && (
                      <span className="ml-auto shrink-0 chip chip-violet">Selected</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="section-label">Assignment delay (seconds)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoRoleDelay(Math.max(0, autoRoleDelay - 5))}
                    title="Shorten the delay"
                    className="btn-icon h-7 w-7 rounded-[9px]"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="chip chip-violet tabular-nums">{autoRoleDelay}s</span>
                  <button
                    type="button"
                    onClick={() => setAutoRoleDelay(Math.min(300, autoRoleDelay + 5))}
                    title="Lengthen the delay"
                    className="btn-icon h-7 w-7 rounded-[9px]"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="progress-track mt-3">
                <div className="progress-fill" style={{ width: `${delayPct}%` }} />
              </div>
              <input
                type="range"
                min={0}
                max={300}
                value={autoRoleDelay}
                onChange={(e) => setAutoRoleDelay(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer accent-[#7C5CFF]"
              />
              <p className="mt-2 text-[10px] text-slate-600">
                Delay before the role is assigned. Set to 0 for instant assignment.
              </p>
            </div>
          </motion.section>

          <motion.section variants={rise} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile-cyan h-9 w-9 rounded-[12px]">
                <Clock className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">What happens when a member joins?</h3>
                <p className="card-sub mt-0.5">The three steps Aura runs on every join</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="list-row items-start gap-3 px-3 py-2.5">
                <span className="chip chip-violet shrink-0">1</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">A new member joins Crystal Realm</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Aura receives the guildMemberAdd event
                  </p>
                </div>
              </div>
              <div className="list-row items-start gap-3 px-3 py-2.5">
                <span className="chip chip-violet shrink-0">2</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">Wait {autoRoleDelay} seconds</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Configurable delay so other automations can run first
                  </p>
                </div>
              </div>
              <div className="list-row items-start gap-3 px-3 py-2.5">
                <span className="chip chip-violet shrink-0">3</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">
                    Role{" "}
                    <span style={{ color: selectedRole?.color }}>
                      {selectedRole?.name || "Not selected"}
                    </span>{" "}
                    assigned
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Applied automatically — no staff action needed
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Right: info */}
        <div className="space-y-5">
          <motion.section variants={rise} className="glass-card p-5">
            <h3 className="card-title">Current Configuration</h3>

            <div className="mt-4 space-y-1.5">
              <div className="list-row justify-between gap-3 px-3 py-2.5">
                <span className="text-xs text-slate-400">Auto role</span>
                {selectedRole ? (
                  <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-white">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: selectedRole.color }}
                    />
                    <span className="truncate">{selectedRole.name}</span>
                  </span>
                ) : (
                  <span className="font-mono text-xs text-[#FBBF24]">Not configured</span>
                )}
              </div>
              <div className="list-row justify-between gap-3 px-3 py-2.5">
                <span className="text-xs text-slate-400">Delay</span>
                <span className="font-mono text-xs font-bold text-white tabular-nums">
                  {autoRoleDelay}s
                </span>
              </div>
              <div className="list-row justify-between gap-3 px-3 py-2.5">
                <span className="text-xs text-slate-400">Assigned this week</span>
                <span className="text-xs font-bold text-white">342 members</span>
              </div>
              <div className="list-row justify-between gap-3 px-3 py-2.5">
                <span className="text-xs text-slate-400">Status</span>
                <span className={`chip ${autoRoleId ? "chip-green" : "chip-amber"}`}>
                  {autoRoleId ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </motion.section>

          <motion.section variants={rise} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile-amber h-9 w-9 rounded-[12px]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Pro Tips</h3>
                <p className="card-sub mt-0.5">Getting the most out of auto roles</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5">
              {[
                "Keep the Aura role above the auto role in the server hierarchy, or Discord will reject the assignment.",
                "Use a 5–10 second delay if a verification gate needs to complete first.",
                "Pair auto roles with reaction roles so members can self-assign extra roles.",
                "Stack multiple auto-role automations in the Modules Hub to cover event and partner communities.",
              ].map((tip, i) => (
                <li key={i} className="list-row items-start gap-2.5 px-3 py-2.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#7C5CFF]/60" />
                  <span className="text-xs leading-relaxed text-slate-400">{tip}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
