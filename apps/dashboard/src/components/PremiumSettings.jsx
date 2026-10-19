"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Sparkles,
  Shield,
  Zap,
  Gift,
  CheckCircle2,
  Rocket,
  Star,
  ArrowRight,
  Minus,
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

/* ────────────────────────────── world data ────────────────────────────── */

const FEATURES = [
  { icon: Zap, name: "Priority XP Boost", desc: "Up to 10x XP multiplier for leveling across every server." },
  { icon: Shield, name: "Advanced Anti-Nuke", desc: "Real-time raid detection with automatic quarantine." },
  { icon: Star, name: "Custom Welcome Cards", desc: "Animated welcome cards with your server's branding." },
  { icon: Gift, name: "Exclusive Giveaway Tools", desc: "Multi-winner, role-restricted giveaways with rerolls." },
  { icon: Rocket, name: "Higher Rate Limits", desc: "No daily caps on AI, economy, or commands." },
];

/* What the current (free) plan actually allows — taken from the plan copy. */
const FREE_INCLUDES = [
  "1x XP multiplier",
  "50 AI calls per day",
  "3 server snapshots",
  "Daily caps on AI, economy, and commands",
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
          <span className="icon-tile icon-tile-violet h-10 w-10 rounded-[14px]">
            <Crown className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[17px]">Premium</h2>
            <p className="card-sub mt-1 max-w-xl">
              Unlock 10x XP, anti-nuke protection, and uncapped limits for Crystal Realm.
            </p>
          </div>
        </div>
        <span className="chip chip-amber">
          <Crown className="h-3 w-3" /> Aura Premium
        </span>
      </motion.div>

      {/* Status card */}
      <motion.section variants={rise} className="glass-card relative overflow-hidden rounded-[20px] p-5">
        <div className="pointer-events-none absolute -right-24 -top-28 h-56 w-56 rounded-full bg-[#7C5CFF]/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="icon-tile icon-tile-amber h-12 w-12 rounded-2xl">
            <Crown className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="card-title text-[15px]">Crystal Realm</h3>
              <span className="chip chip-amber">Free Tier</span>
              <span className="chip">
                <span className="status-dot status-dot-online" /> Active
              </span>
            </div>
            <p className="card-sub mt-1.5 max-w-xl">
              1x XP · 50 AI calls/day · 3 server snapshots. Premium removes every cap.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div className="text-right">
              <div className="micro-label">Expiry</div>
              <div
                className="mt-1 text-xs font-bold text-white"
                title="Expiry appears once a license key is activated"
              >
                —
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                showToast("Premium is managed from Discord — open Aura Bot in Crystal Realm to change your plan")
              }
              className="btn-primary"
            >
              Manage Plan <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Plan comparison */}
      <motion.div variants={rise} className="grid gap-4 lg:grid-cols-2">
        {/* Current plan — highlighted by the gradient accent */}
        <section className="glass-card relative flex h-full flex-col overflow-hidden rounded-[20px] p-5 ring-1 ring-[#7C5CFF]/45 shadow-[0_18px_60px_rgba(124,92,255,0.22)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-accent-gradient" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#7C5CFF]/20 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="icon-tile icon-tile-violet h-10 w-10 rounded-[14px]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Free Tier</h3>
              <p className="card-sub mt-0.5">The plan Crystal Realm runs on today.</p>
            </div>
            <span className="chip chip-violet ml-auto">Current plan</span>
          </div>

          <div className="hairline my-4" />

          <ul className="space-y-2.5">
            {FREE_INCLUDES.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="icon-tile h-6 w-6 shrink-0 rounded-lg text-slate-500">
                  <Minus className="h-3 w-3" />
                </span>
                <span className="text-xs text-slate-400">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex items-center gap-2 pt-5">
            <span className="status-dot status-dot-online" />
            <span className="text-[11px] text-slate-400">Active on Crystal Realm</span>
          </div>
        </section>

        {/* Premium plan */}
        <section className="glass-card relative flex h-full flex-col overflow-hidden rounded-[20px] p-5">
          <div className="pointer-events-none absolute -left-16 -bottom-20 h-44 w-44 rounded-full bg-[#4C7DFF]/15 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="icon-tile icon-tile-amber h-10 w-10 rounded-[14px]">
              <Crown className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Premium</h3>
              <p className="card-sub mt-0.5">Every premium feature, with no caps.</p>
            </div>
            <span className="chip chip-amber ml-auto">All features</span>
          </div>

          <div className="hairline my-4" />

          <ul className="space-y-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.name} className="flex items-start gap-3">
                  <span className="icon-tile icon-tile-violet h-8 w-8 shrink-0 rounded-[11px]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">{f.name}</div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{f.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <a
            href="#"
            className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold text-[#A9C2FF] transition-colors hover:text-white"
          >
            Purchase a license key <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </section>
      </motion.div>

      {/* Redeem + network */}
      <motion.div variants={rise} className="grid gap-4 lg:grid-cols-3">
        <section className="glass-card rounded-[20px] p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-blue h-10 w-10 rounded-[14px]">
              <Gift className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Redeem License Key</h3>
              <p className="card-sub mt-0.5">Unlock premium instantly.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3.5">
            <label className="block">
              <span className="section-label mb-1.5 block">License Key</span>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AURA-XXXX-XXXX-XXXX"
                className="glass-input text-center font-mono uppercase tracking-[0.25em]"
              />
            </label>

            <button
              type="button"
              onClick={() => showToast("License activated — Premium unlocked for Crystal Realm")}
              disabled={key.length < 19}
              className="btn-primary w-full"
            >
              <Rocket className="h-3.5 w-3.5" /> Activate Premium
            </button>
          </div>
        </section>

        <section className="glass-card relative overflow-hidden rounded-[20px] p-5 lg:col-span-2">
          <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-[#4C7DFF]/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-6">
            <div>
              <span className="section-label">Premium Network</span>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="kpi-value text-3xl">1,248</span>
                <span className="text-xs text-slate-400">communities run Aura Premium</span>
              </div>
            </div>
            <p className="card-sub ml-auto max-w-sm">
              Crystal Realm is on the <span className="font-semibold text-[#FCD34D]">Free Tier</span>.
            </p>
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
}
