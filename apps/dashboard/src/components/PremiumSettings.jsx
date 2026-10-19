"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, Shield, Zap, Gift, CheckCircle2, Rocket, Star } from "lucide-react";

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
  "inline-flex items-center gap-2 bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

/* ────────────────────────────── world data ────────────────────────────── */

const FEATURES = [
  { icon: Zap, name: "Priority XP Boost", desc: "Up to 10x XP multiplier for leveling across every server." },
  { icon: Shield, name: "Advanced Anti-Nuke", desc: "Real-time raid detection with automatic quarantine." },
  { icon: Star, name: "Custom Welcome Cards", desc: "Animated welcome cards with your server's branding." },
  { icon: Gift, name: "Exclusive Giveaway Tools", desc: "Multi-winner, role-restricted giveaways with rerolls." },
  { icon: Rocket, name: "Higher Rate Limits", desc: "No daily caps on AI, economy, or commands." },
];

export default function PremiumSettings() {
  const [key, setKey] = useState("");
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
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
            className="panel fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="h-4 w-4 text-[#39D98A]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise}>
        <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FFB547]/25 bg-[#FFB547]/10 text-[#FFB547]">
            <Crown className="h-4 w-4" />
          </span>
          Premium
        </h2>
        <p className="mt-1.5 font-body text-xs text-slate-500">
          Unlock 10x XP, anti-nuke protection, and uncapped limits for Crystal Realm.
        </p>
      </motion.div>

      <motion.div variants={rise} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Features */}
        <section className="panel panel-hover p-5">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-[#FFB547]" />
            <h3 className="text-sm font-bold text-white">Premium Features</h3>
          </div>

          <div className="mt-4 space-y-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.name} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#FFB547]/25 bg-[#FFB547]/10 text-[#FFB547]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white">{f.name}</h4>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Redeem */}
        <section className="panel panel-hover p-5">
          <div className="flex items-center gap-2.5">
            <Gift className="h-4 w-4 text-[#FFB547]" />
            <h3 className="text-sm font-bold text-white">Redeem License Key</h3>
          </div>

          <div className="mt-4 space-y-3.5">
            <label className="block">
              <span className="section-label mb-1.5 block">License Key</span>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AURA-XXXX-XXXX-XXXX"
                className={`${inputCls} text-center font-mono tracking-[0.25em] uppercase`}
              />
            </label>

            <button
              type="button"
              onClick={() => showToast("License activated — Premium unlocked for Crystal Realm")}
              disabled={key.length < 19}
              className={`${btnPrimary} w-full justify-center py-3`}
            >
              <Rocket className="h-3.5 w-3.5" /> Activate Premium
            </button>

            <div className="text-center">
              <a
                href="#"
                className="text-xs font-semibold text-[#7C5CFF] transition-colors hover:text-[#B9A6FF]"
              >
                Purchase a license key →
              </a>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between">
              <span className="section-label">Current Plan</span>
              <span className="rounded-full border border-[#FFB547]/25 bg-[#FFB547]/10 px-2 py-0.5 text-[9px] font-bold text-[#FFB547]">
                ACTIVE
              </span>
            </div>
            <div className="mt-2 text-xs font-bold text-white">Free Tier · Crystal Realm</div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              1x XP · 50 AI calls/day · 3 server snapshots. Premium removes every cap.
            </p>
          </div>
        </section>
      </motion.div>

      {/* Premium network strip */}
      <motion.div variants={rise} className="panel flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="inline-flex items-center gap-2">
          <Crown className="h-3.5 w-3.5 text-[#FFB547]" />
          <span className="section-label">Premium Network</span>
        </span>
        <span className="text-[11px] text-slate-400">
          <span className="font-bold text-white tabular-nums">1,248</span> communities run Aura Premium
        </span>
        <span className="ml-auto hidden text-[11px] text-slate-500 font-body md:block">
          Crystal Realm is on the <span className="font-semibold text-[#FFB547]">Free Tier</span>.
        </span>
      </motion.div>
    </motion.div>
  );
}
