"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Ticket,
  Mic,
  Sparkles,
  LogIn,
  Plus,
  ArrowRight,
  Server,
  Layers,
  Activity,
  Zap,
  Bot,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export default function LandingHero({ onEnterDashboard, onLogin }) {
  const SERVER_CARDS = [
    { id: "939799976308011018", name: "Aura Central Community", icon: "🌌", members: "14.8k Members", tag: "Primary" },
    { id: "102837465918273645", name: "Blue Shark Syndicate", icon: "🦈", members: "8.2k Members", tag: "Gaming" },
    { id: "564738291029384756", name: "Dev Testing Sandbox", icon: "🛠️", members: "1.4k Members", tag: "Development" },
  ];

  const FEATURES = [
    {
      title: "Perimeter Shield & Anti-Nuke",
      desc: "Heat accumulation engine, quarantine vault & automated raid filters.",
      icon: ShieldAlert,
      color: "from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400",
    },
    {
      title: "Smart Ticketing & CSAT",
      desc: "Multi-panel ticket builder, claim system, HTML web transcripts & satisfaction scores.",
      icon: Ticket,
      color: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400",
    },
    {
      title: "Verification Gateway & OAuth2",
      desc: "Multi-factor captcha, Discord OAuth2 gateway & alt-account threat analysis.",
      icon: UserCheck,
      color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
    },
    {
      title: "Ephemeral Voice Topologies",
      desc: "Auto-generator join-to-create voice channels & Rich Presence naming rules.",
      icon: Mic,
      color: "from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col relative overflow-hidden">
      
      {/* Background Ambient Glowing Orbs & Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-15%] w-[650px] h-[650px] rounded-full bg-[#5865F2]/15 blur-[180px]" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[750px] h-[750px] rounded-full bg-cyan-500/15 blur-[200px]" />
        <div className="absolute top-[35%] right-[25%] w-[450px] h-[450px] rounded-full bg-purple-500/10 blur-[160px]" />
      </div>

      {/* Header Navigation */}
      <header className="relative z-20 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5865F2] to-cyan-400 p-[1px] shadow-lg shadow-[#5865F2]/30">
            <div className="w-full h-full bg-[#09090b] rounded-[15px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#5865F2]" />
            </div>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
            AURA <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 font-mono">v2.0</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onEnterDashboard}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Open Dashboard</span>
          </button>
          <button
            onClick={onLogin}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold shadow-lg shadow-[#5865F2]/30 transition-all duration-200 cursor-pointer active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in with Discord</span>
          </button>
        </div>
      </header>

      {/* Main Landing Hero Section */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 pt-12 pb-24 flex flex-col items-center text-center space-y-12">
        
        {/* Verified Badge Pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-xl text-xs font-semibold text-zinc-300 shadow-xl"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Verified <strong className="text-white font-extrabold">Discord</strong> Bot • MEE6-Class + AI</span>
        </motion.div>

        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4 max-w-4xl"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.15]">
            Aura Bot: Your Universe,{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-[#5865F2] to-purple-400 bg-clip-text text-transparent">
              Managed.
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Enterprise Discord security, multi-panel ticketing, AutoMod, voice topologies, and generative AI intelligence for your community.
          </p>
        </motion.div>

        {/* Action Buttons & Sign-In Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md bg-white/[0.03] border border-white/15 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl shadow-black/80 space-y-6 text-center"
        >
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Sign in to Your Aura Dashboard</h2>
            <p className="text-xs text-zinc-400">Manage rules, channels, tickets & security settings</p>
          </div>

          <button
            onClick={onLogin}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-[#5865F2] to-amber-500 hover:opacity-95 text-white font-extrabold text-base flex items-center justify-center gap-3 shadow-xl shadow-[#5865F2]/30 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
              <LogIn className="w-4 h-4 text-white" />
            </div>
            <span>Continue with Discord</span>
          </button>

          <button
            onClick={onEnterDashboard}
            className="w-full py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Explore Dashboard Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </motion.div>

        {/* Server Selector Bar Stack (Photo Match) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-4xl bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5865F2]/40 to-cyan-500/40 border border-[#5865F2]/40 flex items-center justify-center shadow-lg">
              <Layers className="w-7 h-7 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Select Active Server</h3>
              <p className="text-xs text-zinc-400">Choose a community server to manage</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            {SERVER_CARDS.map((server) => (
              <button
                key={server.id}
                onClick={onEnterDashboard}
                className="p-3 px-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-500/10 cursor-pointer flex flex-col items-center gap-1.5 transition-all duration-200 group hover:scale-105"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  {server.icon}
                </div>
                <span className="text-xs font-bold text-zinc-200">{server.name}</span>
                <span className="text-[10px] font-mono text-zinc-500">{server.members}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Feature Grid Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full space-y-6 pt-6"
        >
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-white">Engineered for Discord Communities</h2>
            <p className="text-xs text-zinc-400">16 fully integrated modules with real-time WebSocket telemetry</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`p-6 rounded-2xl border bg-gradient-to-b ${feat.color} backdrop-blur-xl text-left space-y-3 shadow-lg`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Stats Bar */}
        <div className="w-full border-t border-white/10 pt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-mono font-extrabold text-cyan-400">14.8k+</div>
            <div className="text-xs text-zinc-400 font-mono mt-1">Active Members</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400">99.9%</div>
            <div className="text-xs text-zinc-400 font-mono mt-1">Shard Gateway Uptime</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-extrabold text-[#5865F2]">18ms</div>
            <div className="text-xs text-zinc-400 font-mono mt-1">Response Latency</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-extrabold text-purple-400">16 Modules</div>
            <div className="text-xs text-zinc-400 font-mono mt-1">Unified Suite</div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10 py-6 px-6 text-center text-xs text-zinc-500 font-mono max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>Aura Bot v2.0 • Enterprise Discord Automation Suite</div>
        <div className="flex items-center gap-4 text-zinc-400">
          <span className="hover:text-white cursor-pointer">Documentation</span>
          <span>•</span>
          <span className="hover:text-white cursor-pointer">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-white cursor-pointer">Support Server</span>
        </div>
      </footer>
    </div>
  );
}
