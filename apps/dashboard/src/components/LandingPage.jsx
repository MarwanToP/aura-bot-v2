"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Music,
  Coins,
  Trophy,
  Ticket,
  Activity,
  ArrowRight,
  LogIn,
  Bot,
  Users,
  Server,
  ChevronRight,
  Sparkles,
  Bolt,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

/* ── Floating particles canvas ─────────────────────────────────── */
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

    // Create particles - more particles, larger, more colors
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        hue: Math.random() * 60 + 260, // purple to magenta range
        colorShift: Math.random() * 0.5,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        p.hue = (p.hue + p.colorShift) % 360;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.opacity})`;
        ctx.fill();
        
        // Add glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.opacity * 0.1})`;
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
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}

/* ── Feature card data ─────────────────────────────────────────── */
const features = [
  { icon: Shield, label: "Auto Moderation", desc: "Anti-spam, link filter, raid protection, and mass-mention shields.", accent: "text-emerald-400", bg: "bg-emerald-950/50 border-emerald-500/30" },
  { icon: Coins, label: "Economy System", desc: "Daily rewards, work jobs, minigames, and a custom server coin shop.", accent: "text-amber-400", bg: "bg-amber-950/50 border-amber-500/30" },
  { icon: Trophy, label: "Leveling & Ranks", desc: "Custom rank cards, XP multipliers, role rewards, and leaderboards.", accent: "text-cyan-400", bg: "bg-cyan-950/50 border-cyan-500/30" },
  { icon: Ticket, label: "Ticket System", desc: "Multi-panel support tickets with staff claim and HTML transcripts.", accent: "text-violet-400", bg: "bg-violet-950/50 border-violet-500/30" },
  { icon: Activity, label: "Live Analytics", desc: "Real-time gateway telemetry, command charts, and audit trails.", accent: "text-pink-400", bg: "bg-pink-950/50 border-pink-500/30" },
  { icon: Users, label: "Welcome & Auto Roles", desc: "Custom welcome embeds, farewell messages, auto-role assignment, and DMs.", accent: "text-orange-400", bg: "bg-orange-950/50 border-orange-500/30" },
];

/* ── Gradient text utility ─────────────────────────────────────── */
const GradientText = ({ children, className = "" }) => (
  <span className={`bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
);

/* ── Main landing page ─────────────────────────────────────────── */
export default function LandingPage({ onLaunchDashboard }) {
  const { login, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 relative overflow-hidden select-none antialiased">
      
      <AuraParticles />

      {/* Background glow — large, slow, ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-emerald-500/20 blur-[200px]"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.12, 0.2, 0.12] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full bg-amber-500/15 blur-[200px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[30%] w-[500px] h-[500px] rounded-full bg-pink-500/10 blur-[200px]"
        />
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-[#050608] border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-[1px] shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center">
              <div className="w-full h-full bg-[#050608] rounded-[10px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-400 fill-purple-400/20" />
              </div>
            </div>
            <span className="font-extrabold text-sm text-white tracking-tight">Aura Bot</span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-[11px] font-semibold text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#stats" className="hover:text-white transition-colors">Stats</a>
          </nav>

          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <button
                onClick={login}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold text-zinc-300 hover:text-white border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.03] transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
            <button
              onClick={onLaunchDashboard}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
        
        {/* Glowing orb — the "aura" centerpiece */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mx-auto mb-12 relative w-32 h-32 flex items-center justify-center"
        >
          {/* Animated gradient border */}
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1],
              borderColor: [
                "rgba(16, 185, 129, 0.5)",
                "rgba(245, 158, 11, 0.5)", 
                "rgba(236, 72, 153, 0.5)",
                "rgba(16, 185, 129, 0.5)"
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-3px] rounded-[26px] border-2 blur-[10px]"
            style={{ background: "linear-gradient(135deg, #10b981, #f59e0b, #ec4899, #10b981)" }}
          />
          {/* Core orb with animated gradient */}
          <motion.div
            animate={{ 
              scale: [0.95, 1.05, 0.95],
              rotate: [-2, 2, -2]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ 
              background: "linear-gradient(135deg, #10b981 0%, #f59e0b 50%, #ec4899 100%)",
              backgroundSize: "200% 200%",
              animation: "gradient-shift 6s ease-in-out infinite",
              boxShadow: "0 0 80px rgba(16, 185, 129, 0.4), 0 0 120px rgba(245, 158, 11, 0.2)"
            }}
          >
            <div className="w-full h-full bg-[#050608] rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-pink-500/20 blur-xl"
              />
              <Sparkles className="w-8 h-8 text-emerald-300 fill-emerald-400/20 relative z-10" />
            </div>
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]"
        >
          The bot your server{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-pink-400 bg-clip-text text-transparent animate-gradient-shift" style={{ backgroundSize: "200% 200%" }}>
            deserves
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-sm text-zinc-400 max-w-lg mx-auto mt-5 leading-relaxed"
        >
          Moderation, music, economy, leveling, tickets, and analytics — all in one place. Built for communities that want more.
        </motion.p>

{/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10"
        >
          <a
            href="https://discord.com/oauth2/authorize?client_id=939799976308011018&permissions=8&scope=bot%20applications.commands"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
          >
            <Bolt className="w-4 h-4" />
            <span>Add to Discord</span>
          </a>
          <button
            onClick={onLaunchDashboard}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-emerald-500/30 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </motion.div>
      </section>

{/* ── Stats strip ────────────────────────────────────────── */}
      <section id="stats" className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-10 py-8 border-y border-emerald-500/10 text-center"
        >
          <div className="relative">
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">14,821</div>
            <div className="text-[10px] text-zinc-500 font-medium mt-0.5 uppercase tracking-wider">Servers</div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500 rounded" />
          </div>
          <div className="relative">
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">6.7M</div>
            <div className="text-[10px] text-zinc-500 font-medium mt-0.5 uppercase tracking-wider">Users</div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-cyan-500 to-violet-500 rounded" />
          </div>
          <div className="relative">
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">89M</div>
            <div className="text-[10px] text-zinc-500 font-medium mt-0.5 uppercase tracking-wider">Commands</div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded" />
          </div>
          <div className="relative">
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">99.98%</div>
            <div className="text-[10px] text-zinc-500 font-medium mt-0.5 uppercase tracking-wider">Uptime</div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded" />
          </div>
        </motion.div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl sm:text-3xl font-black text-center text-white mb-10"
        >
          Everything your server{" "}
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">needs</span>
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-purple-500/30 transition-all shadow-lg shadow-black/20 dark-panel-hover"
              >
                <div className={`w-10 h-10 rounded-xl ${f.bg} border flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${f.accent}`} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{f.label}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-white/[0.02] border border-white/[0.04] relative overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-purple-500/10 blur-[100px] pointer-events-none" />
          
          <h2 className="text-2xl sm:text-3xl font-black text-white relative z-10">
            Ready to get started?
          </h2>
          <p className="text-xs text-zinc-400 mt-3 max-w-md mx-auto relative z-10">
            Add Aura Bot to your server in seconds. No setup required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 relative z-10">
            <a
              href="https://discord.com/oauth2/authorize?client_id=939799976308011018&permissions=8&scope=bot%20applications.commands"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs shadow-lg shadow-[#5865F2]/30 transition-all flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Add to Discord</span>
            </a>
            <button
              onClick={onLaunchDashboard}
              className="px-7 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-6 px-6 text-[10px] text-zinc-500 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2025 Aura Bot. All rights reserved.</span>
          <div className="flex items-center gap-5 font-semibold text-zinc-400">
            <a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Discord</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Docs</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
