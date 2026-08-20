"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Bot,
  Ticket,
  BarChart3,
  Lock,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  LogIn,
  Users,
  Server,
  Terminal,
  Activity,
  Headphones,
  Star,
  ChevronLeft,
  ChevronRight,
  Radio,
  Award,
  Coins,
  Volume2,
  FileText,
  Sliders,
  Play,
  Share2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuraLogo from "./AuraLogo";

/* Floating cosmic particle canvas background */
function AuraParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.5 + 1,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.5 + 0.2,
        hue: Math.random() * 50 + 260,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${p.opacity})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-70"
    />
  );
}

export default function LandingPage({ onLaunchDashboard }) {
  const { login, isAuthenticated } = useAuth();
  const [activeModuleFilter, setActiveModuleFilter] = useState("all");

  const featureCards = [
    {
      icon: Shield,
      title: "Advanced Moderation",
      desc: "Powerful moderation tools to keep your server safe and secure.",
      color: "text-purple-400 border-purple-500/30 bg-purple-950/30 shadow-purple-900/20",
    },
    {
      icon: Bot,
      title: "Smart Automation",
      desc: "Automate tasks, welcome members, assign roles and much more.",
      color: "text-blue-400 border-blue-500/30 bg-blue-950/30 shadow-blue-900/20",
    },
    {
      icon: Ticket,
      title: "Ticket System",
      desc: "Professional ticket system with transcripts and custom workflows.",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30 shadow-emerald-900/20",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      desc: "Beautiful analytics to track growth and server engagement.",
      color: "text-pink-400 border-pink-500/30 bg-pink-950/30 shadow-pink-900/20",
    },
    {
      icon: Lock,
      title: "Security & Protection",
      desc: "Anti-raid, anti-nuke and advanced security features.",
      color: "text-amber-400 border-amber-500/30 bg-amber-950/30 shadow-amber-900/20",
    },
  ];

  const modulesGrid = [
    { name: "Welcome System", icon: Sparkles, color: "text-emerald-400 border-emerald-500/30" },
    { name: "Verification", icon: Shield, color: "text-blue-400 border-blue-500/30" },
    { name: "Reaction Roles", icon: Bot, color: "text-purple-400 border-purple-500/30" },
    { name: "Giveaways", icon: Award, color: "text-amber-400 border-amber-500/30" },
    { name: "Invites Tracker", icon: Share2, color: "text-pink-400 border-pink-500/30" },
    { name: "Auto Moderation", icon: Lock, color: "text-red-400 border-red-500/30" },
    { name: "Polls", icon: BarChart3, color: "text-indigo-400 border-indigo-500/30" },
    { name: "Leveling System", icon: Star, color: "text-yellow-400 border-yellow-500/30" },
    { name: "Economy", icon: Coins, color: "text-cyan-400 border-cyan-500/30" },
    { name: "Voice Management", icon: Volume2, color: "text-violet-400 border-violet-500/30" },
    { name: "Logs & Audits", icon: FileText, color: "text-teal-400 border-teal-500/30" },
    { name: "And More...", icon: Sliders, color: "text-purple-400 border-purple-500/30" },
  ];

  const testimonials = [
    {
      name: "Crystal#0001",
      role: "Server Owner • 88K Members",
      quote: "Aura Bot is an absolute game-changer. It has everything we need and more!",
      avatar: "C",
      avatarBg: "bg-purple-600",
    },
    {
      name: "Nebulaf#0420",
      role: "Community Manager • 42K Members",
      quote: "The dashboard is so intuitive and beautiful. Managing my server has never been easier.",
      avatar: "N",
      avatarBg: "bg-blue-600",
    },
    {
      name: "Infinity#9999",
      role: "Server Owner • 120K Members",
      quote: "Best support, always listening to the community and adding amazing features.",
      avatar: "I",
      avatarBg: "bg-pink-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#05040a] text-zinc-100 relative overflow-hidden select-none antialiased font-sans">
      <AuraParticles />

      {/* Ambient background glow nebulae */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-purple-600/15 blur-[180px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-600/15 blur-[180px]" />
        <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] rounded-full bg-pink-600/10 blur-[180px]" />
      </div>

      {/* ── 1. Top Navigation Bar (Matching Photo 2) ────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-[#05040a]/90 backdrop-blur-xl border-b border-purple-500/15">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AuraLogo size="md" />
            <div>
              <span className="font-black text-white text-base tracking-wider block">
                AURA BOT
              </span>
              <span className="text-[9px] text-purple-400 font-extrabold tracking-widest uppercase block -mt-1">
                NEXT-GEN DISCORD EXPERIENCE
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-zinc-300">
            <a href="#features" className="hover:text-purple-300 transition-colors">Features</a>
            <a href="#modules" className="hover:text-purple-300 transition-colors">Modules</a>
            <a href="#pricing" className="hover:text-purple-300 transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-purple-300 transition-colors">Docs</a>
            <a href="#support" className="hover:text-purple-300 transition-colors">Support</a>
            <a href="#changelog" className="hover:text-purple-300 transition-colors relative">
              Changelog
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <button
                onClick={login}
                className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white border border-purple-500/30 hover:border-purple-500/60 bg-purple-950/30 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log in</span>
              </button>
            )}

            <button
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
            >
              <AuraLogo size="sm" />
              <span>Add to Discord</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section (Matching Photo 2) ─────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column Text & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-extrabold shadow-inner"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>THE ALL-IN-ONE DISCORD BOT</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight"
            >
              Powerful. Beautiful. Built for{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent">
                your server.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base text-zinc-300 max-w-xl leading-relaxed"
            >
              Aura Bot combines the most advanced moderation, automation, and engagement tools in one intuitive dashboard. Everything you need. Nothing you don't.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <button
                onClick={login}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-900/50 transition-all cursor-pointer"
              >
                <AuraLogo size="sm" />
                <span>Add Aura Bot to Discord</span>
              </button>

              <button
                onClick={onLaunchDashboard}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-zinc-300 hover:text-white border border-purple-500/30 hover:border-purple-500/60 bg-[#0d091e] transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                <span>View Features</span>
              </button>
            </motion.div>

            {/* 3 Feature Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-purple-500/15"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">Easy to use</h4>
                  <span className="text-[10px] text-zinc-400">Intuitive dashboard</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">Trusted by thousands</h4>
                  <span className="text-[10px] text-zinc-400">Active on 100,000+ servers</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">Always improving</h4>
                  <span className="text-[10px] text-zinc-400">Weekly updates</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column Floating 3D Dashboard Mockup Preview */}
          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              onClick={onLaunchDashboard}
              className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-[#0d0a1f] p-2 shadow-[0_0_50px_rgba(168,85,247,0.3)] hover:scale-[1.02] transition-transform cursor-pointer group"
            >
              {/* Fake Dashboard Title bar */}
              <div className="h-8 bg-[#070512] rounded-t-xl px-4 flex items-center justify-between border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  <span className="text-[10px] text-zinc-400 font-mono ml-2">dashboard.aurabot.io</span>
                </div>
                <span className="text-[10px] font-mono text-purple-400 font-bold px-2 py-0.5 rounded bg-purple-500/10">
                  LIVE DASHBOARD
                </span>
              </div>

              {/* Inner Dashboard Preview Representation */}
              <div className="bg-[#0b0818] p-4 space-y-4 rounded-b-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AuraLogo size="sm" />
                    <div>
                      <h3 className="text-xs font-bold text-white">Good evening, Marwan! 👋</h3>
                      <span className="text-[10px] text-zinc-400">24 Servers • 128.4K Members</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/30">
                    ONLINE
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#130d2a] p-2.5 rounded-xl border border-purple-500/20">
                    <span className="text-[9px] text-zinc-400 block">Servers</span>
                    <span className="text-sm font-black text-white">24</span>
                  </div>
                  <div className="bg-[#130d2a] p-2.5 rounded-xl border border-purple-500/20">
                    <span className="text-[9px] text-zinc-400 block">Members</span>
                    <span className="text-sm font-black text-white">128.4K</span>
                  </div>
                  <div className="bg-[#130d2a] p-2.5 rounded-xl border border-purple-500/20">
                    <span className="text-[9px] text-zinc-400 block">Commands</span>
                    <span className="text-sm font-black text-white">28.7M</span>
                  </div>
                </div>

                <div className="bg-[#130d2a] p-3 rounded-xl border border-purple-500/20 h-24 flex items-end">
                  <div className="w-full flex items-end gap-1.5 h-16">
                    {[40, 65, 45, 80, 95, 70, 85, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-purple-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                <span className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-2xl flex items-center gap-2">
                  <span>Click to Launch Interactive Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 3. Stats Bar Section (Matching Photo 2) ────────────────── */}
      <section id="stats" className="border-y border-purple-500/15 bg-[#080612]/80 py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div>
            <span className="text-2xl md:text-3xl font-black text-white block">100,000+</span>
            <span className="text-xs text-purple-300/70 font-medium">Active Servers</span>
          </div>
          <div>
            <span className="text-2xl md:text-3xl font-black text-white block">12.4M+</span>
            <span className="text-xs text-purple-300/70 font-medium">Users Protected</span>
          </div>
          <div>
            <span className="text-2xl md:text-3xl font-black text-white block">28M+</span>
            <span className="text-xs text-purple-300/70 font-medium">Commands Executed</span>
          </div>
          <div>
            <span className="text-2xl md:text-3xl font-black text-white block">99.97%</span>
            <span className="text-xs text-purple-300/70 font-medium">Uptime</span>
          </div>
          <div className="col-span-2 md:col-span-1">
            <span className="text-2xl md:text-3xl font-black text-white block">24/7</span>
            <span className="text-xs text-purple-300/70 font-medium">Support</span>
          </div>
        </div>
      </section>

      {/* ── 4. Powerful Features Section (Matching Photo 2) ────────── */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 relative z-10 text-center">
        <div className="mb-14 space-y-3">
          <span className="text-[10px] font-extrabold text-purple-400 tracking-widest uppercase bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/30">
            BUILT WITH POWER IN MIND
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            Powerful features for modern communities
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Everything you need to manage, protect and grow your server.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {featureCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl border flex flex-col justify-between h-64 text-left dark-panel-hover ${c.color}`}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-white mb-2">
                    {c.title}
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {c.desc}
                  </p>
                </div>

                <button
                  onClick={onLaunchDashboard}
                  className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer pt-2"
                >
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── 5. All-In-One Solution Section (Matching Photo 2) ──────── */}
      <section id="modules" className="py-20 bg-[#080612]/60 border-y border-purple-500/15 relative z-10 text-center">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold text-purple-400 tracking-widest uppercase bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/30">
              ALL-IN-ONE SOLUTION
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Everything you need in one place
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto">
              Enable powerful modules to supercharge your server.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
            {modulesGrid.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.name}
                  onClick={onLaunchDashboard}
                  className={`flex items-center gap-2.5 p-3 rounded-xl bg-[#0d091f] border hover:border-purple-500/50 text-xs font-bold text-zinc-200 transition-all hover:-translate-y-0.5 cursor-pointer shadow-md ${m.color}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{m.name}</span>
                </button>
              );
            })}
          </div>

          <div>
            <button
              onClick={onLaunchDashboard}
              className="px-6 py-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-white font-extrabold text-xs transition-all shadow-lg cursor-pointer"
            >
              Explore all modules
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. Showcase Dashboard Section (Matching Photo 2) ────────── */}
      <section className="py-24 max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column Visual Preview */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-2xl border border-purple-500/30 bg-[#0d0a1f] p-4 shadow-[0_0_60px_rgba(168,85,247,0.35)]">
              <div className="bg-[#080612] p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                  <div className="flex items-center gap-3">
                    <AuraLogo size="sm" />
                    <span className="font-extrabold text-white text-sm">AURA BOT CONTROL PANEL</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                    Real-time Connected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#130d2a] rounded-xl border border-purple-500/20">
                    <span className="text-[10px] text-zinc-400 block">Server Health</span>
                    <span className="text-xl font-black text-white">92 / 100</span>
                    <span className="text-[10px] text-emerald-400 font-bold block mt-1">Excellent</span>
                  </div>
                  <div className="p-3 bg-[#130d2a] rounded-xl border border-purple-500/20">
                    <span className="text-[10px] text-zinc-400 block">Active Automation</span>
                    <span className="text-xl font-black text-white">12 Modules</span>
                    <span className="text-[10px] text-purple-400 font-bold block mt-1">Running now</span>
                  </div>
                </div>
              </div>

              {/* Floating Real-time pill */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-400/40 animate-bounce">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Real-time Live Updates</span>
              </div>
            </div>
          </div>

          {/* Right Column Checklist */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-purple-400 tracking-widest uppercase bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/30">
                BEAUTIFUL. RESPONSIVE. INTUITIVE.
              </span>
              <h2 className="text-3xl font-black text-white">
                A dashboard you'll actually enjoy using.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                We crafted every detail to give you the best possible experience. Clean, fast and powerful.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                "Real-time data & live updates",
                "Fully responsive on all devices",
                "Dark mode with customizable accent",
                "Lightning fast performance",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-bold text-zinc-200">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={onLaunchDashboard}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-purple-900/40 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>See Dashboard in Action</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Loved By Server Owners Testimonials (Matching Photo 2) ─ */}
      <section className="py-20 bg-[#080612]/60 border-t border-purple-500/15 relative z-10 text-center">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold text-purple-400 tracking-widest uppercase bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/30">
              TRUSTED BY AMAZING COMMUNITIES
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Loved by server owners worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl bg-[#0d091f] border border-purple-500/20 flex flex-col justify-between space-y-4 shadow-xl"
              >
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  "{t.quote}"
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-purple-500/10">
                  <div className={`w-9 h-9 rounded-full ${t.avatarBg} flex items-center justify-center font-black text-white text-xs`}>
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.name}</h4>
                    <span className="text-[10px] text-zinc-400">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Call To Action Banner & Footer (Matching Photo 2) ────── */}
      <footer className="relative z-10 bg-[#05040a] border-t border-purple-500/15 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          {/* CTA Box */}
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-purple-950/80 via-[#130a2e] to-purple-950/80 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left shadow-2xl">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white">
                Ready to get started?
              </h3>
              <p className="text-xs text-purple-200/80 mt-1">
                Add Aura Bot to your server in less than 30 seconds.
              </p>
            </div>
            <button
              onClick={login}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-purple-900/50 transition-all cursor-pointer shrink-0"
            >
              <AuraLogo size="sm" />
              <span>Add to Discord</span>
            </button>
          </div>

          {/* Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-xs">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <AuraLogo size="md" />
                <span className="font-black text-white text-base tracking-wider">
                  AURA BOT
                </span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
                The next-generation Discord bot for modern communities. Powerful, intelligent, unstoppable.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider">Product</h4>
              <ul className="space-y-2 text-zinc-400 font-medium">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#modules" className="hover:text-white transition-colors">Modules</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#changelog" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider">Resources</h4>
              <ul className="space-y-2 text-zinc-400 font-medium">
                <li><a href="#docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#tutorials" className="hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#api" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider">Support</h4>
              <ul className="space-y-2 text-zinc-400 font-medium">
                <li><a href="#support" className="hover:text-white transition-colors">Support Center</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#status" className="hover:text-white transition-colors">Status Page</a></li>
                <li><a href="#bug" className="hover:text-white transition-colors">Report a Bug</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-purple-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
            <span>© 2024 Aura Bot. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a href="#privacy" className="hover:text-zinc-300">Privacy Policy</a>
              <a href="#terms" className="hover:text-zinc-300">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
