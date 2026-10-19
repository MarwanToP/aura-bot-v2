"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Clock, Shield, Save, Sparkles, CheckCircle2 } from "lucide-react";

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

const btnPrimary =
  "inline-flex items-center gap-2 bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] cursor-pointer";

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
              <UserPlus className="h-4 w-4" />
            </span>
            Auto Roles
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Automatically assign a role to every new member when they join Crystal Realm.
          </p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => showToast("Auto role settings saved")}
          className={btnPrimary}
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left: config */}
        <div className="space-y-5">
          <motion.section variants={rise} className="panel panel-hover p-5">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Shield className="h-4 w-4 text-[#7C5CFF]" />
              Role Assignment
            </h3>

            <label className="mt-4 block">
              <span className="section-label mb-1.5 block">Search role</span>
              <input
                type="text"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Type to filter roles..."
                className={inputCls}
              />
            </label>

            <div className="mt-4">
              <span className="section-label mb-1.5 block">Select auto role</span>
              <div className="custom-scrollbar mt-1 max-h-48 space-y-1 overflow-y-auto pr-1">
                {filteredRoles.length === 0 && (
                  <p className="px-1 py-3 text-[11px] text-slate-600">
                    No roles match “{roleSearch}”.
                  </p>
                )}
                {filteredRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setAutoRoleId(role.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                      autoRoleId === role.id
                        ? "border-[#7C5CFF]/40 bg-[#7C5CFF]/10 text-white"
                        : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full border-2"
                      style={{ borderColor: role.color, backgroundColor: `${role.color}33` }}
                    />
                    <span className="truncate">{role.name}</span>
                    {autoRoleId === role.id && (
                      <span className="ml-auto shrink-0 rounded-full border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 px-2 py-0.5 text-[10px] font-bold text-[#7C5CFF]">
                        SELECTED
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <span className="section-label mb-1.5 block">Assignment delay (seconds)</span>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={300}
                  value={autoRoleDelay}
                  onChange={(e) => setAutoRoleDelay(Number(e.target.value))}
                  className="flex-1 cursor-pointer accent-[#7C5CFF]"
                />
                <span className="w-12 text-right font-mono text-xs font-bold text-white">
                  {autoRoleDelay}s
                </span>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-600">
                Delay before the role is assigned. Set to 0 for instant assignment.
              </p>
            </div>
          </motion.section>

          <motion.section variants={rise} className="panel panel-hover p-5">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Clock className="h-4 w-4 text-[#7C5CFF]" />
              What happens when a member joins?
            </h3>

            <div className="mt-4 space-y-2 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[10px] font-bold text-[#7C5CFF]">
                  1
                </span>
                <div>
                  <p className="text-xs font-bold text-white">A new member joins Crystal Realm</p>
                  <p className="text-[10px] text-slate-500">Aura receives the guildMemberAdd event</p>
                </div>
              </div>
              <div className="ml-3 h-4 border-l border-white/[0.08]" />
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[10px] font-bold text-[#7C5CFF]">
                  2
                </span>
                <div>
                  <p className="text-xs font-bold text-white">Wait {autoRoleDelay} seconds</p>
                  <p className="text-[10px] text-slate-500">
                    Configurable delay so other automations can run first
                  </p>
                </div>
              </div>
              <div className="ml-3 h-4 border-l border-white/[0.08]" />
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[10px] font-bold text-[#7C5CFF]">
                  3
                </span>
                <div>
                  <p className="text-xs font-bold text-white">
                    Role{" "}
                    <span style={{ color: selectedRole?.color }}>
                      {selectedRole?.name || "Not selected"}
                    </span>{" "}
                    assigned
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Applied automatically — no staff action needed
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Right: info */}
        <div className="space-y-5">
          <motion.section variants={rise} className="panel panel-hover p-5">
            <h3 className="text-sm font-extrabold text-white">Current Configuration</h3>

            <div className="mt-4 space-y-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">Auto role</span>
                {selectedRole ? (
                  <span className="flex items-center gap-2 text-xs font-bold text-white">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: selectedRole.color }}
                    />
                    {selectedRole.name}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-[#FFB547]">Not configured</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">Delay</span>
                <span className="font-mono text-xs font-bold text-white">{autoRoleDelay}s</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">Assigned this week</span>
                <span className="text-xs font-bold text-white">342 members</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">Status</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                    autoRoleId
                      ? "border-[#39D98A]/25 bg-[#39D98A]/10 text-[#39D98A]"
                      : "border-[#FFB547]/25 bg-[#FFB547]/10 text-[#FFB547]"
                  }`}
                >
                  {autoRoleId ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>
          </motion.section>

          <motion.section variants={rise} className="panel panel-hover p-5">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Sparkles className="h-4 w-4 text-[#7C5CFF]" />
              Pro Tips
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                "Keep the Aura role above the auto role in the server hierarchy, or Discord will reject the assignment.",
                "Use a 5–10 second delay if a verification gate needs to complete first.",
                "Pair auto roles with reaction roles so members can self-assign extra roles.",
                "Stack multiple auto-role automations in the Modules Hub to cover event and partner communities.",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#7C5CFF]/60" />
                  {tip}
                </li>
              ))}
            </ul>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
