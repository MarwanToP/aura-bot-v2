"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Award,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  Crown,
  Globe,
  Headphones,
  LayoutDashboard,
  Lock,
  Plus,
  Search,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  Star,
  Terminal,
  Ticket,
  Users,
  Youtube,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuraLogo from "./AuraLogo";

/* ────────────────────────────────────────────────────────────────
   Brand glyphs (inline SVG — lucide has no Discord / X marks)
   ──────────────────────────────────────────────────────────────── */
function DiscordGlyph({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

function XGlyph({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────
   Aurora canvas — near-black navy base + soft blurred glows
   ──────────────────────────────────────────────────────────────── */
function AuroraBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#05070D]" />

      {/* soft radial glows */}
      <div className="absolute -left-[16%] -top-[30%] h-[900px] w-[900px] rounded-full bg-[#1D4ED8]/[0.42] blur-[170px]" />
      <div className="absolute -right-[14%] top-[-4%] h-[840px] w-[840px] rounded-full bg-[#4338CA]/[0.36] blur-[180px]" />
      <div className="absolute left-[30%] top-[34%] h-[680px] w-[680px] rounded-full bg-[#0E7490]/[0.24] blur-[190px]" />
      <div className="absolute -bottom-[20%] right-[0%] h-[760px] w-[760px] rounded-full bg-[#4C1D95]/[0.3] blur-[190px]" />
      <div className="absolute left-[6%] top-[52%] h-[520px] w-[520px] rounded-full bg-[#0369A1]/[0.22] blur-[180px]" />

      {/* faint diagonal rays */}
      <div className="absolute -top-1/4 left-[8%] h-[160%] w-px rotate-[22deg] bg-gradient-to-b from-transparent via-white/[0.07] to-transparent" />
      <div className="absolute -top-1/4 left-[26%] h-[160%] w-px rotate-[22deg] bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />
      <div className="absolute -top-1/4 left-[74%] h-[160%] w-px rotate-[22deg] bg-gradient-to-b from-transparent via-white/[0.05] to-transparent" />

      {/* wide sweeping light lines */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M-60 430 C 300 300, 720 540, 1500 250"
          stroke="rgba(93,140,255,0.12)"
          strokeWidth="1.4"
          fill="none"
        />
        <path
          d="M-60 540 C 320 410, 780 640, 1500 360"
          stroke="rgba(56,189,248,0.08)"
          strokeWidth="1.4"
          fill="none"
        />
      </svg>

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(125%_95%_at_50%_-12%,transparent_45%,rgba(0,0,0,0.42)_100%)]" />
    </div>
  );
}

/* Floating cosmic particle canvas with connective lines */
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

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.8,
        dx: (Math.random() - 0.5) * 0.35,
        dy: (Math.random() - 0.5) * 0.35,
        opacity: Math.random() * 0.4 + 0.15,
        hue: Math.random() * 40 + 196,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${p1.hue}, 90%, 70%, ${(1 - dist / 150) * 0.1})`;
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 72%, ${p.opacity})`;
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
      className="pointer-events-none fixed inset-0 z-0 opacity-40"
      aria-hidden="true"
    />
  );
}

/* ────────────────────────────────────────────────────────────────
   Small shared pieces
   ──────────────────────────────────────────────────────────────── */
function LabelChip({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-[#4F8BFF]/[0.22] bg-[#0B1220]/70 px-3 py-1.5 backdrop-blur-md ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#4FC3F7] shadow-[0_0_8px_2px_rgba(79,195,247,0.55)]" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
        {children}
      </span>
    </span>
  );
}

const primaryPill =
  "inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-[#3B82F6] via-[#4F6BFF] to-[#7C5CFF] font-semibold text-white ring-1 ring-inset ring-white/15 shadow-[0_10px_30px_-8px_rgba(79,107,255,0.8)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_16px_40px_-10px_rgba(79,107,255,0.95)]";

const ghostPill =
  "group inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-white/[0.2] hover:bg-white/[0.07] hover:text-white";

/* ────────────────────────────────────────────────────────────────
   Hero art — layered glow rings, giant "A" mark, glossy orbs
   ──────────────────────────────────────────────────────────────── */
function HeroArt() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[640px]">
      {/* ambient bloom */}
      <div className="pointer-events-none absolute inset-[-10%] rounded-full bg-[radial-gradient(closest-side,rgba(56,132,255,0.42),rgba(56,132,255,0.1)_58%,transparent_78%)] blur-[6px]" />

      <svg viewBox="0 0 600 600" className="relative h-full w-full">
        <defs>
          <linearGradient id="lpHeroA" x1="12%" y1="0%" x2="88%" y2="100%">
            <stop offset="0%" stopColor="#DCEBFF" />
            <stop offset="28%" stopColor="#7EB0FF" />
            <stop offset="62%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D3F9E" />
          </linearGradient>
          <radialGradient id="lpHeroCore" cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor="#0E2145" stopOpacity="1" />
            <stop offset="70%" stopColor="#071026" stopOpacity="0.97" />
            <stop offset="100%" stopColor="#05070D" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lpDiscFill" cx="50%" cy="18%" r="88%">
            <stop offset="0%" stopColor="#14305F" stopOpacity="1" />
            <stop offset="45%" stopColor="#0B1B3C" stopOpacity="1" />
            <stop offset="100%" stopColor="#060C1C" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="lpSheenGrad" x1="50%" y1="0%" x2="50%" y2="60%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lpRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.5" />
            <stop offset="45%" stopColor="#4F8BFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.45" />
          </linearGradient>
          <radialGradient id="lpOrbBlue" cx="30%" cy="26%" r="76%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="16%" stopColor="#A9CDFF" />
            <stop offset="52%" stopColor="#2F62D8" />
            <stop offset="100%" stopColor="#0A1738" />
          </radialGradient>
          <radialGradient id="lpOrbCyan" cx="30%" cy="26%" r="76%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="18%" stopColor="#A5F3FC" />
            <stop offset="55%" stopColor="#0E7C9B" />
            <stop offset="100%" stopColor="#072033" />
          </radialGradient>
          <radialGradient id="lpOrbViolet" cx="30%" cy="26%" r="76%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="18%" stopColor="#C7B9FF" />
            <stop offset="58%" stopColor="#5B4BD6" />
            <stop offset="100%" stopColor="#0C0A2B" />
          </radialGradient>
          <filter id="lpBlurLg" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id="lpBlurSm" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="lpBlurMd" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        {/* core disc */}
        <circle cx="300" cy="300" r="262" fill="url(#lpHeroCore)" />

        {/* sweeping orbit curves */}
        <ellipse
          cx="300"
          cy="300"
          rx="292"
          ry="128"
          transform="rotate(-26 300 300)"
          fill="none"
          stroke="rgba(147,197,253,0.18)"
          strokeWidth="1"
        />
        <ellipse
          cx="300"
          cy="300"
          rx="270"
          ry="96"
          transform="rotate(24 300 300)"
          fill="none"
          stroke="rgba(56,189,248,0.14)"
          strokeWidth="1"
        />

        {/* outer rings */}
        <circle
          cx="300"
          cy="300"
          r="244"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="7"
          opacity="0.42"
          filter="url(#lpBlurLg)"
        />
        <circle cx="300" cy="300" r="244" fill="none" stroke="url(#lpRingGrad)" strokeWidth="1.6" />
        <circle
          cx="300"
          cy="300"
          r="212"
          fill="none"
          stroke="rgba(147,197,253,0.38)"
          strokeWidth="1"
          strokeDasharray="2 8"
        />
        <circle cx="300" cy="300" r="182" fill="none" stroke="rgba(147,197,253,0.2)" strokeWidth="1" />

        {/* inner glass disc */}
        <circle
          cx="300"
          cy="300"
          r="180"
          fill="none"
          stroke="#4F8BFF"
          strokeWidth="9"
          opacity="0.55"
          filter="url(#lpBlurMd)"
        />
        <circle cx="300" cy="300" r="176" fill="url(#lpDiscFill)" />
        <path d="M 128 300 A 172 172 0 0 1 472 300 Z" fill="url(#lpSheenGrad)" />
        <circle cx="300" cy="300" r="176" fill="none" stroke="rgba(170,210,255,0.5)" strokeWidth="1.3" />
        <circle cx="300" cy="300" r="186" fill="none" stroke="rgba(120,170,255,0.3)" strokeWidth="1" />

        {/* the "A" mark with bloom */}
        <g transform="translate(300 300) scale(1.52) translate(-100 -100)">
          <path
            d="M 100 24 L 164 168 L 144 154 L 126 166 L 108 122 L 92 122 L 74 166 L 56 154 L 36 168 Z"
            fill="#7EB0FF"
            opacity="0.95"
            filter="url(#lpBlurMd)"
          />
          <path
            d="M 100 24 L 164 168 L 144 154 L 126 166 L 108 122 L 92 122 L 74 166 L 56 154 L 36 168 Z"
            fill="url(#lpHeroA)"
          />
          <path
            d="M 100 80 Q 100 102 113 102 Q 100 102 100 124 Q 100 102 87 102 Q 100 102 100 80 Z"
            fill="#EAF4FF"
          />
        </g>

        {/* floating glossy orbs */}
        <motion.g
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="470" cy="178" r="46" fill="#3B82F6" opacity="0.22" filter="url(#lpBlurSm)" />
          <circle cx="470" cy="178" r="31" fill="url(#lpOrbBlue)" />
          <ellipse cx="458" cy="164" rx="9" ry="5.5" fill="#FFFFFF" opacity="0.5" transform="rotate(-24 458 164)" />
        </motion.g>

        <motion.g
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        >
          <circle cx="132" cy="302" r="38" fill="#22D3EE" opacity="0.18" filter="url(#lpBlurSm)" />
          <circle cx="132" cy="302" r="23" fill="url(#lpOrbCyan)" />
        </motion.g>

        <motion.g
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        >
          <circle cx="438" cy="436" r="30" fill="#7C5CFF" opacity="0.18" filter="url(#lpBlurSm)" />
          <circle cx="438" cy="436" r="18" fill="url(#lpOrbViolet)" />
        </motion.g>

        <motion.g
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        >
          <circle cx="300" cy="76" r="15" fill="url(#lpOrbBlue)" />
        </motion.g>
      </svg>

      {/* floating glass status card */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-0 top-[28%] w-[186px] rounded-2xl border border-white/[0.12] bg-[#080D1A]/70 p-3.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:right-[-6%] sm:w-[198px]"
      >
        <div className="flex items-start gap-2.5">
          <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-[#39D98A] shadow-[0_0_8px_2px_rgba(57,217,138,0.5)]" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold leading-tight text-white">Aura Bot</p>
            <p className="text-[10px] font-medium leading-tight text-[#39D98A]">Online</p>
          </div>
          <DiscordGlyph className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
        </div>
        <div className="my-2.5 h-px bg-white/[0.08]" />
        <p className="text-[10px] leading-relaxed text-slate-400">Your server, our priority.</p>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Dashboard preview mock (pure markup + SVG, no assets)
   ──────────────────────────────────────────────────────────────── */
const mockNav = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Server Members", icon: Users },
  { label: "Commands", icon: Terminal },
  { label: "Moderation", icon: Shield },
  { label: "Tickets", icon: Ticket },
  { label: "Giveaways", icon: Award },
  { label: "Levels & XP", icon: Star },
  { label: "Server Stats", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

const mockStats = [
  { label: "Members", value: "12,483", delta: "+12%", icon: Users, tone: "text-[#7FB2FF] bg-[#4F8BFF]/[0.15]" },
  { label: "Commands", value: "48,921", delta: "+8%", icon: Terminal, tone: "text-[#B69CFF] bg-[#8B5CF6]/[0.15]" },
  { label: "Open Tickets", value: "342", delta: "+21%", icon: Ticket, tone: "text-[#6EE7F9] bg-[#22D3EE]/[0.15]" },
  { label: "Nitro Boosts", value: "128", delta: "+16%", icon: Star, tone: "text-[#F9A8D4] bg-[#F472B6]/[0.15]" },
];

const mockActions = [
  { label: "Invite Bot", icon: Plus },
  { label: "View Commands", icon: Terminal },
  { label: "Join Support Server", icon: Headphones },
  { label: "Get Premium", icon: Crown },
];

function DashboardMock() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-[radial-gradient(60%_60%_at_65%_15%,rgba(79,107,255,0.22),transparent_72%)] blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#060910]/85 shadow-[0_50px_100px_-45px_rgba(0,0,0,1)] backdrop-blur-xl">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF5C7A]/70" />
            <span className="h-2 w-2 rounded-full bg-[#FFB547]/70" />
            <span className="h-2 w-2 rounded-full bg-[#39D98A]/70" />
          </div>
          <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 sm:flex">
            <Search className="h-3 w-3 shrink-0 text-slate-500" />
            <span className="truncate text-[10px] text-slate-500">Search anything...</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="h-5 w-5 rounded-full border border-white/[0.1] bg-gradient-to-br from-[#4F8BFF] to-[#7C5CFF] text-center text-[9px] font-bold leading-[18px] text-white">
              M
            </span>
            <span className="hidden text-[10px] text-slate-400 sm:inline">Marwan</span>
          </div>
        </div>

        <div className="flex">
          {/* mini sidebar */}
          <aside className="hidden w-[124px] shrink-0 flex-col gap-0.5 border-r border-white/[0.05] bg-white/[0.015] p-2 sm:flex">
            <div className="mb-1 flex items-center gap-1.5 px-1.5 py-1">
              <AuraLogo size="xs" showRing={false} />
              <span className="text-[9px] font-black tracking-[0.14em] text-white">
                AURA <span className="text-[#5BC8F5]">BOT</span>
              </span>
            </div>
            {mockNav.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[9.5px] ${
                    item.active
                      ? "border border-[#4F8BFF]/[0.25] bg-[#4F8BFF]/[0.12] font-semibold text-white"
                      : "text-slate-500"
                  }`}
                >
                  <Icon className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              );
            })}
          </aside>

          {/* mini content */}
          <div className="min-w-0 flex-1 space-y-2.5 p-3">
            <div>
              <p className="font-body text-[13px] font-semibold text-white">Welcome back, Marwan 👋</p>
              <p className="text-[9.5px] text-slate-500">Here's what's happening with your server today.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {mockStats.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ${s.tone}`}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <span className="truncate text-[8.5px] text-slate-400">{s.label}</span>
                    </div>
                    <p className="mt-1.5 font-body text-[15px] font-bold leading-none text-white">
                      {s.value}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[8.5px] font-semibold text-[#39D98A]">
                      <ArrowUpRight className="h-2.5 w-2.5" />
                      {s.delta}
                      <span className="font-normal text-slate-500">vs. last 7 days</span>
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.6fr_1fr]">
              {/* activity chart */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-300">Server Activity</span>
                  <span className="rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[8px] text-slate-400">
                    Last 7 days
                  </span>
                </div>
                <svg viewBox="0 0 300 84" className="mt-2 h-[74px] w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="lpChartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F8BFF" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#4F8BFF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 62 C 28 40, 52 56, 82 36 S 128 20, 158 32 S 208 48, 238 20 S 276 12, 300 20 L300 84 L0 84 Z"
                    fill="url(#lpChartFill)"
                  />
                  <path
                    d="M0 62 C 28 40, 52 56, 82 36 S 128 20, 158 32 S 208 48, 238 20 S 276 12, 300 20"
                    fill="none"
                    stroke="#63B3FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 76 C 38 64, 66 72, 106 56 S 176 50, 216 38 S 268 40, 300 30"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </svg>
                <div className="mt-1 flex justify-between text-[7.5px] text-slate-500">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>

              {/* quick actions */}
              <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5">
                <span className="text-[10px] font-semibold text-slate-300">Quick Actions</span>
                {mockActions.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div
                      key={a.label}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-1.5 py-1.5"
                    >
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-[#4F8BFF]/[0.15] text-[#7FB2FF]">
                        <Icon className="h-2.5 w-2.5" />
                      </span>
                      <span className="truncate text-[9px] text-slate-300">{a.label}</span>
                      <ChevronRight className="ml-auto h-2.5 w-2.5 shrink-0 text-slate-600" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Landing page
   ──────────────────────────────────────────────────────────────── */
export default function LandingPage({ onLaunchDashboard }) {
  const { login } = useAuth();

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Features", href: "#features" },
    { label: "Commands", href: "#modules" },
    { label: "Premium", href: "#premium" },
    { label: "Support", href: "#support" },
  ];

  const featureCards = [
    {
      icon: Shield,
      title: "Advanced Moderation",
      desc: "Powerful moderation tools to keep your server safe and secure.",
      tone: "blue",
    },
    {
      icon: Bot,
      title: "Smart Automation",
      desc: "Automate tasks, welcome members, assign roles and much more.",
      tone: "violet",
    },
    {
      icon: Ticket,
      title: "Ticket System",
      desc: "Professional ticket system with transcripts and custom workflows.",
      tone: "cyan",
    },
    {
      icon: Award,
      title: "Giveaways",
      desc: "Run giveaways and grow your community.",
      tone: "pink",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      desc: "Beautiful analytics to track growth and server engagement.",
      tone: "cyan",
    },
    {
      icon: Lock,
      title: "Security & Protection",
      desc: "Anti-raid, anti-nuke and advanced security features.",
      tone: "violet",
    },
    {
      icon: Star,
      title: "Leveling System",
      desc: "Reward your active members.",
      tone: "pink",
    },
    {
      icon: Sliders,
      title: "And More",
      desc: "50+ features to make your server better.",
      tone: "blue",
    },
  ];

  const featureTones = {
    blue: "border-[#4F8BFF]/[0.3] bg-[#4F8BFF]/[0.12] text-[#7FB2FF]",
    violet: "border-[#8B5CF6]/[0.3] bg-[#8B5CF6]/[0.12] text-[#B69CFF]",
    cyan: "border-[#22D3EE]/[0.3] bg-[#22D3EE]/[0.12] text-[#6EE7F9]",
    pink: "border-[#F472B6]/[0.3] bg-[#F472B6]/[0.12] text-[#F9A8D4]",
  };

  const modulesGrid = [
    { name: "Welcome System", icon: Sparkles },
    { name: "Verification", icon: Shield },
    { name: "Reaction Roles", icon: Bot },
    { name: "Giveaways", icon: Award },
    { name: "Invites Tracker", icon: Users },
    { name: "Auto Moderation", icon: Lock },
    { name: "Polls", icon: BarChart3 },
    { name: "Leveling System", icon: Star },
    { name: "Economy", icon: Crown },
    { name: "Voice Management", icon: Headphones },
    { name: "Logs & Audits", icon: Terminal },
    { name: "And More...", icon: Sliders },
  ];

  const stats = [
    { icon: Users, value: "1M+", label: "Servers" },
    { icon: Star, value: "4.9/5", label: "User rating" },
    { icon: Activity, value: "99.9%", label: "Uptime" },
  ];

  const checklist = [
    "Real-time data & live updates",
    "Fully responsive on all devices",
    "Lightning fast performance",
  ];

  const communityAvatars = [
    { initial: "C", bg: "from-[#7C5CFF] to-[#4F6BFF]" },
    { initial: "N", bg: "from-[#3B82F6] to-[#22D3EE]" },
    { initial: "I", bg: "from-[#F472B6] to-[#8B5CF6]" },
    { initial: "A", bg: "from-[#22D3EE] to-[#39D98A]" },
  ];

  const fadeUp = {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070D] font-sans text-slate-100 antialiased">
      <AuroraBackdrop />
      <AuraParticles />

      {/* ── 1. Sticky glass nav pill ───────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6">
        <div className="mx-auto max-w-[1180px] rounded-2xl border border-white/[0.08] bg-[#070A12]/70 px-4 shadow-[0_18px_50px_-25px_rgba(0,0,0,0.95)] backdrop-blur-2xl md:px-5">
          <div className="flex h-16 items-center justify-between gap-4">
            <a href="#home" className="flex shrink-0 items-center gap-2.5">
              <AuraLogo size="sm" />
              <span className="text-[13px] font-bold tracking-[0.22em] text-white">
                AURA <span className="text-[#5BC8F5]">BOT</span>
              </span>
            </a>

            <nav className="hidden items-center gap-8 md:flex">
              {navLinks.map((l, i) => (
                <a
                  key={l.label}
                  href={l.href}
                  className={`text-[12.5px] transition-colors ${
                    i === 0
                      ? "font-semibold text-white"
                      : "font-medium text-slate-400 hover:text-white"
                  }`}
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2.5">
              <button
                type="button"
                onClick={login}
                aria-label="Continue with Discord"
                title="Continue with Discord"
                className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition-colors hover:border-white/[0.18] hover:text-white sm:flex"
              >
                <DiscordGlyph className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={login}
                className={`${primaryPill} h-9 px-4 text-[12.5px]`}
              >
                <DiscordGlyph className="h-3.5 w-3.5" />
                <span>Add to Discord</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. Hero ────────────────────────────────────────────── */}
      <section id="home" className="relative z-10 mx-auto max-w-[1180px] px-6 pb-16 pt-32 md:pt-36">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-6">
          {/* copy */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <LabelChip>The Ultimate Discord Bot</LabelChip>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="font-body text-[42px] font-extrabold leading-[1.04] tracking-[-0.03em] text-white sm:text-[54px] lg:text-[62px] xl:text-[66px]"
            >
              More Than Just
              <br />
              <span className="bg-gradient-to-r from-[#5B8CFF] via-[#4FC3F7] to-[#22D3EE] bg-clip-text text-transparent">
                a Bot.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[38ch] text-[14.5px] leading-relaxed text-slate-400"
            >
              Moderation, automation, engagement and more — all in one simple, beautiful bot.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <button type="button" onClick={login} className={`${primaryPill} h-12 px-6 text-[13.5px]`}>
                <DiscordGlyph className="h-4 w-4" />
                <span>Add to Discord</span>
              </button>

              <button
                type="button"
                onClick={onLaunchDashboard}
                className={`${ghostPill} h-12 px-6 text-[13.5px]`}
              >
                <span>Explore Features</span>
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </motion.div>

            {/* stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-4"
            >
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-[#7FB2FF] backdrop-blur-md">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="leading-tight">
                      <span className="block font-body text-[15px] font-bold text-white">
                        {s.value}
                      </span>
                      <span className="block text-[11px] text-slate-500">{s.label}</span>
                    </span>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* art */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative order-last lg:-mr-10"
          >
            <HeroArt />
          </motion.div>
        </div>

        {/* scroll hint */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[11.5px] text-slate-600">
          <span>Scroll to explore</span>
          <span className="text-slate-500">↓</span>
        </div>
      </section>

      {/* ── 3. Features ────────────────────────────────────────── */}
      <section id="features" className="relative z-10 mx-auto max-w-[1180px] px-6 py-14">
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm md:p-9">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="space-y-3">
              <LabelChip>What We Offer</LabelChip>
              <h2 className="font-body text-[30px] font-extrabold tracking-[-0.02em] md:text-[38px]">
                <span className="bg-gradient-to-r from-white via-white to-[#8FB9FF] bg-clip-text text-transparent">
                  Powerful Features
                </span>
              </h2>
              <p className="max-w-[46ch] text-[13.5px] leading-relaxed text-slate-400">
                Everything you need to manage, protect and grow your server.
              </p>
            </div>

            <button
              type="button"
              onClick={onLaunchDashboard}
              className={`${ghostPill} h-10 shrink-0 px-4 text-[12.5px]`}
            >
              <span>View all features</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>

          <div className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.button
                  key={c.title}
                  type="button"
                  onClick={onLaunchDashboard}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#4F8BFF]/[0.38] hover:bg-white/[0.055] hover:shadow-[0_20px_45px_-22px_rgba(79,139,255,0.7)]"
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${featureTones[c.tone]}`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold leading-snug text-white">
                      {c.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-[11px] leading-relaxed text-slate-400">
                      {c.desc}
                    </span>
                  </span>
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white" />
                </motion.button>
              );
            })}
          </div>

          {/* module strip (existing module shortcuts + handlers preserved) */}
          <div id="modules" className="mt-9 border-t border-white/[0.06] pt-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-body text-[14px] font-semibold text-white">
                  Everything you need in one place
                </p>
                <p className="mt-0.5 text-[11.5px] text-slate-400">
                  Enable powerful modules to supercharge your server.
                </p>
              </div>
              <button
                type="button"
                onClick={onLaunchDashboard}
                className={`${ghostPill} h-9 shrink-0 px-4 text-[12px]`}
              >
                <span>Explore all modules</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-1.5 lg:justify-start">
              {modulesGrid.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={onLaunchDashboard}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#4F8BFF]/[0.35] hover:text-white"
                  >
                    <Icon className="h-3 w-3 shrink-0 text-[#7FB2FF]" />
                    <span className="truncate">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Dashboard preview ───────────────────────────────── */}
      <section id="dashboard" className="relative z-10 mx-auto max-w-[1180px] px-6 py-14">
        <div className="overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-6 backdrop-blur-sm md:p-9">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <LabelChip>Your Server, Simplified</LabelChip>
              <h2 className="font-body text-[30px] font-extrabold leading-tight tracking-[-0.02em] md:text-[38px]">
                <span className="bg-gradient-to-r from-white via-white to-[#8FB9FF] bg-clip-text text-transparent">
                  Powerful Dashboard
                </span>
              </h2>
              <p className="max-w-[42ch] text-[13.5px] leading-relaxed text-slate-400">
                Manage your server with an intuitive and modern dashboard.
              </p>

              <div className="space-y-3 pt-1">
                {checklist.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-[13px] text-slate-200">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[#4F8BFF]/[0.35] bg-[#4F8BFF]/[0.12] text-[#8FC0FF]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onLaunchDashboard}
                  className={`${primaryPill} h-11 px-5 text-[13px]`}
                >
                  <span>Explore Dashboard</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <DashboardMock />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 5. Community banner ────────────────────────────────── */}
      <section id="premium" className="relative z-10 mx-auto max-w-[1180px] px-6 py-14">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#080D1A]/60 p-6 backdrop-blur-xl md:p-8"
        >
          <div className="pointer-events-none absolute -left-10 top-1/2 h-[320px] w-[320px] -translate-y-1/2 rounded-full bg-[#4F8BFF]/[0.16] blur-[110px]" />
          <div className="pointer-events-none absolute right-0 top-0 h-[260px] w-[260px] rounded-full bg-[#7C5CFF]/[0.14] blur-[110px]" />

          <div className="relative flex flex-col items-center gap-6 text-center lg:flex-row lg:items-center lg:gap-7 lg:text-left">
            <span className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl border border-[#4F8BFF]/[0.32] bg-gradient-to-br from-[#4F8BFF]/[0.26] to-[#7C5CFF]/[0.14] text-white shadow-[0_22px_55px_-18px_rgba(79,107,255,0.95)]">
              <DiscordGlyph className="h-11 w-11" />
            </span>

            <div className="min-w-0 flex-1 space-y-2.5">
              <LabelChip>Join Our Community</LabelChip>
              <h3 className="font-body text-[26px] font-extrabold tracking-[-0.02em] text-white md:text-[32px]">
                Join Thousands of Servers
              </h3>
              <p className="mx-auto max-w-[52ch] text-[13px] leading-relaxed text-slate-400 lg:mx-0">
                Add Aura Bot to your server in less than 30 seconds.
              </p>

              <div className="flex flex-col items-center gap-3 pt-1 sm:flex-row lg:pt-2">
                <div className="flex -space-x-2.5">
                  {communityAvatars.map((a) => (
                    <span
                      key={a.initial}
                      className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#080D1A] bg-gradient-to-br ${a.bg} text-[11px] font-bold text-white`}
                    >
                      {a.initial}
                    </span>
                  ))}
                </div>
                <span className="text-[11.5px] font-medium text-slate-400">
                  Trusted by <span className="font-semibold text-white">1M+</span> servers
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={login}
              className={`${primaryPill} h-11 shrink-0 px-5 text-[13px]`}
            >
              <DiscordGlyph className="h-4 w-4" />
              <span>Add to Discord</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── 6. Footer ──────────────────────────────────────────── */}
      <footer id="support" className="relative z-10 mt-10 border-t border-white/[0.07] pb-8 pt-10">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <AuraLogo size="md" />
              <div>
                <p className="text-[13px] font-bold tracking-[0.2em] text-white">
                  AURA <span className="text-[#5BC8F5]">BOT</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  The next-generation Discord bot for modern communities.
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
              {navLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-[12.5px] font-medium text-slate-400 transition-colors hover:text-white"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {[
                { label: "Discord", node: <DiscordGlyph className="h-4 w-4" /> },
                { label: "X", node: <XGlyph className="h-3.5 w-3.5" /> },
                { label: "YouTube", node: <Youtube className="h-4 w-4" /> },
                { label: "Website", node: <Globe className="h-4 w-4" /> },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  title={s.label}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.18] hover:text-white"
                >
                  {s.node}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-5 text-[11.5px] text-slate-500 sm:flex-row">
            <span>© 2025 Aura Bot. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <a href="#privacy" className="transition-colors hover:text-slate-300">
                Privacy Policy
              </a>
              <a href="#terms" className="transition-colors hover:text-slate-300">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
