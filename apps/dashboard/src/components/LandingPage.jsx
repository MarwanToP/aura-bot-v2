"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  Code,
  Crown,
  Gauge,
  Gift,
  Globe,
  Grid3x3,
  Headphones,
  LayoutDashboard,
  Lock,
  Moon,
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
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import AuraLogo from "./AuraLogo";

/* ────────────────────────────────────────────────────────────────
   Brand glyphs (inline SVG — lucide has no Discord / X marks)
   ──────────────────────────────────────────────────────────────── */
function DiscordGlyph({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
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
      <div className="aura-canvas absolute inset-0" />

      {/* soft radial washes */}
      <div className="aura-blob aura-blob-indigo animate-aurora-drift" />
      <div
        className="aura-blob aura-blob-blue animate-aurora-drift"
        style={{ animationDelay: "-9s" }}
      />
      <div
        className="aura-blob aura-blob-teal animate-aurora-drift"
        style={{ animationDelay: "-17s" }}
      />
      <div
        className="aura-blob aura-blob-glow animate-aurora-drift"
        style={{ animationDelay: "-5s" }}
      />
      <div
        className="aura-blob aura-blob-bottom animate-aurora-drift"
        style={{ animationDelay: "-23s" }}
      />

      {/* faint diagonal light veils */}
      <div className="aura-streak aura-streak-1" />
      <div className="aura-streak aura-streak-2" />
      <div className="aura-streak aura-streak-3" />

      {/* glossy floating spheres */}
      <div className="aura-orb aura-orb-1 animate-orb-float" />
      <div className="aura-orb aura-orb-2 animate-orb-float" />
      <div className="aura-orb aura-orb-3 animate-orb-float" />

      {/* grain + vignette for depth */}
      <div className="aura-vignette" />
      <div className="aura-noise" />
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
      className="pointer-events-none fixed inset-0 z-0 opacity-30"
      aria-hidden="true"
    />
  );
}

/* ────────────────────────────────────────────────────────────────
   Small shared pieces
   ──────────────────────────────────────────────────────────────── */
function SectionEyebrow({ icon: Icon, children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 backdrop-blur-md ${className}`}
    >
      {Icon ? <Icon className="h-3 w-3 shrink-0 text-[#7C9BFF]" /> : null}
      <span className="micro-label micro-label-accent">{children}</span>
    </span>
  );
}

/* The Aura "A" glyph, drawn as a path so it can be scaled + lit. */
const AURA_A_PATH =
  "M 100 24 L 164 168 L 144 154 L 126 166 L 108 122 L 92 122 L 74 166 L 56 154 L 36 168 Z";

/* ────────────────────────────────────────────────────────────────
   Hero art — the A mark inside an orbital ring + glossy orbs
   ──────────────────────────────────────────────────────────────── */
function HeroArt() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[540px]">
      {/* ambient bloom */}
      <div className="pointer-events-none absolute inset-[-14%] rounded-full bg-[radial-gradient(closest-side,rgba(76,125,255,0.30),rgba(124,92,255,0.10)_55%,transparent_78%)]" />

      <svg viewBox="0 0 600 600" className="relative h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="lpRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#4C7DFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="lpHeroA" x1="18%" y1="0%" x2="82%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="22%" stopColor="#BFE0FF" />
            <stop offset="56%" stopColor="#4C9BFF" />
            <stop offset="100%" stopColor="#2B4FD0" />
          </linearGradient>
          <radialGradient id="lpDiscFill" cx="50%" cy="16%" r="90%">
            <stop offset="0%" stopColor="#16305F" />
            <stop offset="48%" stopColor="#0A1734" />
            <stop offset="100%" stopColor="#050A16" />
          </radialGradient>
          <linearGradient id="lpSheen" x1="50%" y1="0%" x2="50%" y2="58%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="lpCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5B8CFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#5B8CFF" stopOpacity="0" />
          </radialGradient>
          <filter id="lpBlurLg" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id="lpBlurMd" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* sweeping orbit veils */}
        <ellipse
          cx="300"
          cy="300"
          rx="286"
          ry="112"
          transform="rotate(-24 300 300)"
          fill="none"
          stroke="rgba(147,197,253,0.16)"
          strokeWidth="1"
        />
        <ellipse
          cx="300"
          cy="300"
          rx="262"
          ry="92"
          transform="rotate(22 300 300)"
          fill="none"
          stroke="rgba(56,189,248,0.13)"
          strokeWidth="1"
        />

        {/* outer halo + orbital rings */}
        <circle
          cx="300"
          cy="300"
          r="236"
          fill="none"
          stroke="#4C7DFF"
          strokeWidth="10"
          opacity="0.35"
          filter="url(#lpBlurLg)"
        />
        <circle cx="300" cy="300" r="236" fill="none" stroke="url(#lpRingGrad)" strokeWidth="1.6" />
        <circle
          cx="300"
          cy="300"
          r="208"
          fill="none"
          stroke="rgba(147,197,253,0.3)"
          strokeWidth="1"
          strokeDasharray="2 9"
        />

        {/* inner glass disc */}
        <circle cx="300" cy="300" r="180" fill="url(#lpDiscFill)" />
        <path d="M 124 300 A 176 176 0 0 1 476 300 Z" fill="url(#lpSheen)" />
        <circle cx="300" cy="300" r="180" fill="none" stroke="rgba(160,205,255,0.45)" strokeWidth="1.2" />
        <circle cx="300" cy="300" r="192" fill="none" stroke="rgba(120,170,255,0.22)" strokeWidth="1" />
        <circle cx="300" cy="300" r="150" fill="url(#lpCoreGlow)" opacity="0.5" />

        {/* the "A" mark with bloom */}
        <g transform="translate(300 300) scale(1.42) translate(-100 -100)">
          <path d={AURA_A_PATH} fill="#5B8CFF" opacity="0.9" filter="url(#lpBlurMd)" />
          <path d={AURA_A_PATH} fill="url(#lpHeroA)" />
          <path
            d="M 100 80 Q 100 102 113 102 Q 100 102 100 124 Q 100 102 87 102 Q 100 102 100 80 Z"
            fill="#FFFFFF"
            opacity="0.95"
          />
        </g>
      </svg>

      {/* slowly drifting glossy orbs riding the orbit */}
      <div className="aura-orb animate-orb-float absolute right-[2%] top-[34%] h-14 w-14" />
      <div
        className="aura-orb animate-orb-float absolute left-[1%] top-[46%] h-9 w-9"
        style={{ animationDelay: "-3s" }}
      />
      <div
        className="aura-orb animate-orb-float absolute bottom-[6%] right-[21%] h-6 w-6"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="aura-orb animate-orb-float absolute left-[23%] top-[5%] h-4 w-4"
        style={{ animationDelay: "-1.5s" }}
      />

      {/* floating glass status card */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="glass-card absolute right-0 top-[4%] w-[176px] rounded-2xl p-3.5 sm:right-[-2%] sm:top-[6%] sm:w-[190px]"
      >
        <div className="flex items-start gap-2.5">
          <span className="status-dot status-dot-online mt-1 shrink-0" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold leading-tight text-white">Aura Bot</p>
            <p className="text-[10px] font-medium leading-tight text-[#34D399]">Online</p>
          </div>
          <DiscordGlyph className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
        </div>
        <div className="hairline my-2.5" />
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
  { label: "Server Members", value: "12,483", delta: "+12%", icon: Users, tone: "icon-tile-blue" },
  { label: "Commands Used", value: "48,921", delta: "+8%", icon: Terminal, tone: "icon-tile-violet" },
  { label: "Active Tickets", value: "342", delta: "+21%", icon: Ticket, tone: "icon-tile-cyan" },
];

const mockActions = [
  { label: "Invite Bot", icon: Plus },
  { label: "View Commands", icon: Terminal },
  { label: "Join Support Server", icon: Headphones },
  { label: "Get Premium", icon: Crown },
];

const mockBars = [38, 54, 44, 66, 52, 76, 94, 61, 79, 88, 68, 96];

function DashboardMock() {
  return (
    <div className="relative" aria-hidden="true">
      {/* gradient glow behind the frame */}
      <div className="pointer-events-none absolute -inset-10 rounded-[48px] bg-[radial-gradient(60%_60%_at_60%_15%,rgba(76,125,255,0.28),rgba(124,92,255,0.10)_58%,transparent_76%)] blur-2xl" />

      <div className="glass-card relative overflow-hidden rounded-2xl">
        {/* top bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <div className="glass-pill h-8 min-w-0 flex-1 gap-2 border-white/[0.06] bg-white/[0.03] px-2.5">
            <Search className="h-3 w-3 shrink-0 text-slate-500" />
            <span className="hidden truncate text-[9.5px] text-slate-500 sm:inline">
              Search anything...
            </span>
          </div>
          <span className="btn-icon hidden h-7 w-7 rounded-lg border-white/[0.06] bg-white/[0.03] text-slate-400 sm:inline-flex">
            <Bell className="h-3 w-3" />
          </span>
          <span className="btn-icon hidden h-7 w-7 rounded-lg border-white/[0.06] bg-white/[0.03] text-slate-400 sm:inline-flex">
            <Moon className="h-3 w-3" />
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[#4C7DFF] to-[#7C5CFF] text-[9px] font-bold text-white">
              M
            </span>
            <span className="hidden text-[9.5px] text-slate-300 sm:inline">Marwan</span>
          </span>
        </div>

        <div className="flex">
          {/* sidebar rail */}
          <aside className="glass-rail hidden w-[142px] shrink-0 flex-col gap-0.5 rounded-none border-t-0 border-b-0 border-l-0 border-r border-white/[0.05] bg-white/[0.02] p-2.5 sm:flex">
            <div className="mb-1.5 flex items-center gap-1.5 px-1 py-1">
              <AuraLogo size="xs" showRing={false} />
              <span className="font-display text-[9px] font-black tracking-[0.14em] text-white">
                AURA <span className="text-[#5BC8F5]">BOT</span>
              </span>
            </div>
            {mockNav.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`nav-item gap-1.5 rounded-lg px-1.5 py-1 text-[9.5px] ${
                    item.active ? "nav-item-active" : "text-slate-500"
                  }`}
                >
                  <Icon className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              );
            })}
          </aside>

          {/* content */}
          <div className="min-w-0 flex-1 p-3">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display truncate text-[12.5px] font-bold text-white">
                  Welcome back, Marwan 👋
                </p>
                <p className="mt-0.5 truncate text-[9.5px] text-slate-500">
                  Here&apos;s what&apos;s happening with your server today.
                </p>
              </div>
              <span className="chip chip-blue hidden text-[8.5px] sm:inline-flex">Last 7 days</span>
            </div>

            {/* KPI tiles */}
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {mockStats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="kpi-tile rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`icon-tile ${s.tone} h-6 w-6 rounded-lg`}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <span className="kpi-label truncate text-[8.5px]">{s.label}</span>
                    </div>
                    <p className="kpi-value mt-1.5 text-[14px]">{s.value}</p>
                    <p className="delta-up mt-1 text-[8px]">
                      <ArrowUpRight className="h-2.5 w-2.5" />
                      {s.delta}
                      <span className="font-normal text-slate-500">vs. last 7 days</span>
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-[1.55fr_1fr]">
              {/* activity chart (bars) */}
              <div className="glass-card rounded-xl p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-200">Server Activity</span>
                  <span className="chart-legend-dot bg-[#4C7DFF] text-[#4C7DFF]" />
                </div>
                <div className="mt-2.5 flex h-[78px] items-end gap-1">
                  {mockBars.map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-t-[3px] bg-gradient-to-t from-[#4C7DFF]/25 via-[#4C7DFF]/60 to-[#22D3EE]"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[7.5px] text-slate-500">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>

              {/* quick actions */}
              <div className="glass-card rounded-xl p-2.5">
                <span className="text-[10px] font-semibold text-slate-200">Quick Actions</span>
                <div className="mt-1.5 space-y-1">
                  {mockActions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <div
                        key={a.label}
                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-1.5 py-1.5"
                      >
                        <span className="icon-tile icon-tile-blue h-5 w-5 rounded-md">
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
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Landing page
   ──────────────────────────────────────────────────────────────── */
export default function LandingPage({ onLaunchDashboard }) {
  const { login } = useAuth();
  const router = useRouter();
  // The dashboard is its own route (/dashboard); an explicit handler still wins
  // so the component stays reusable in tests and previews.
  const launchDashboard = onLaunchDashboard ?? (() => router.push("/dashboard"));

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
      title: "Moderation",
      desc: "Keep your server safe and under control.",
      tone: "icon-tile-blue",
    },
    {
      icon: Code,
      title: "Custom Commands",
      desc: "Create your own commands with ease.",
      tone: "icon-tile-violet",
    },
    {
      icon: Ticket,
      title: "Tickets",
      desc: "Support your members faster.",
      tone: "icon-tile-cyan",
    },
    {
      icon: Gift,
      title: "Giveaways",
      desc: "Run giveaways and grow your community.",
      tone: "icon-tile-pink",
    },
    {
      icon: Star,
      title: "Levels & XP",
      desc: "Reward your active members.",
      tone: "icon-tile-amber",
    },
    {
      icon: Bot,
      title: "Auto Moderation",
      desc: "Detect and handle issues automatically.",
      tone: "icon-tile-green",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      desc: "Track your server performance.",
      tone: "icon-tile-blue",
    },
    {
      icon: Grid3x3,
      title: "And More",
      desc: "50+ features to make your server better.",
      tone: "icon-tile-violet",
    },
  ];

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
    { icon: Users, value: "100K+", label: "Servers" },
    { icon: Activity, value: "1M+", label: "Users" },
    { icon: Gauge, value: "99.9%", label: "Uptime" },
  ];

  const checklist = [
    "Real-time server stats",
    "Easy setup & configuration",
    "Beautiful and responsive design",
  ];

  const communityAvatars = [
    { initial: "C", bg: "from-[#7C5CFF] to-[#4C7DFF]" },
    { initial: "N", bg: "from-[#4C7DFF] to-[#22D3EE]" },
    { initial: "I", bg: "from-[#F472B6] to-[#7C5CFF]" },
    { initial: "A", bg: "from-[#22D3EE] to-[#34D399]" },
  ];

  const footerColumns = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Commands", href: "#modules" },
        { label: "Dashboard", href: "#dashboard" },
        { label: "Premium", href: "#premium" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Join Discord", href: "#premium" },
        { label: "Support Server", href: "#support" },
        { label: "Server Showcase", href: "#home" },
        { label: "Changelog", href: "#home" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#home" },
        { label: "API Reference", href: "#home" },
        { label: "Privacy", href: "#privacy" },
        { label: "Terms", href: "#terms" },
      ],
    },
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

      {/* ── 1. Floating glass nav pill ───────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-5 md:px-6 md:pt-7">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card mx-auto flex max-w-[1180px] items-center justify-between gap-3 rounded-full px-2.5 py-2 transition-colors duration-300 hover:border-white/[0.16]"
        >
          <a href="#home" className="flex min-w-0 shrink-0 items-center gap-2.5 pl-1.5">
            <AuraLogo size="sm" />
            <span className="font-display text-[12.5px] font-extrabold tracking-[0.18em] text-white sm:tracking-[0.24em]">
              AURA <span className="text-[#5BC8F5]">BOT</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                className={`relative text-[12.5px] transition-colors duration-200 ${
                  i === 0
                    ? "font-semibold text-white"
                    : "font-medium text-slate-400 hover:text-white"
                }`}
              >
                {l.label}
                {i === 0 ? (
                  <span className="absolute -bottom-1.5 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#4C7DFF] to-[#7C5CFF]" />
                ) : null}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={login}
              aria-label="Continue with Discord"
              title="Continue with Discord"
              className="btn-icon hidden h-9 w-9 rounded-full sm:inline-flex"
            >
              <DiscordGlyph className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={launchDashboard}
              className="btn-primary h-9 px-4 text-[12.5px]"
            >
              <span>Launch Dashboard</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      </header>

      {/* ── 2. Hero ────────────────────────────────────────────── */}
      <section
        id="home"
        className="relative z-10 mx-auto max-w-[1180px] px-5 pb-20 pt-32 sm:px-6 md:pt-40"
      >
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.94fr)] lg:gap-8">
          {/* copy */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <SectionEyebrow icon={Sparkles}>The Ultimate Discord Bot</SectionEyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[40px] font-extrabold leading-[1.02] tracking-[-0.035em] text-white sm:text-[54px] lg:text-[62px] xl:text-[68px]"
            >
              More Than Just
              <br />
              <span className="gradient-text inline-block">a Bot.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[42ch] text-[14.5px] leading-relaxed text-slate-400"
            >
              Aura Bot brings powerful features, seamless moderation, and a better server
              experience — all in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <button type="button" onClick={login} className="btn-primary h-12 px-6 text-[13.5px]">
                <DiscordGlyph className="h-4 w-4" />
                <span>Add to Discord</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={launchDashboard}
                className="btn-glass h-12 px-6 text-[13.5px]"
              >
                <span>Explore Features</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>

            {/* stat chips */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-2.5 pt-4"
            >
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="glass-card flex items-center gap-2.5 rounded-2xl px-3 py-2"
                  >
                    <span className="icon-tile icon-tile-blue h-9 w-9 rounded-xl">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="leading-tight">
                      <span className="font-display block text-[15px] font-extrabold text-white">
                        {s.value}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-slate-500">{s.label}</span>
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
            transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative order-last"
          >
            <HeroArt />
          </motion.div>
        </div>
      </section>

      {/* ── 3. Powerful Features ────────────────────────────────── */}
      <section id="features" className="relative z-10 mx-auto max-w-[1180px] px-5 py-16 sm:px-6">
        <div className="glass-card rounded-3xl p-5 sm:p-8 lg:p-10">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="space-y-3">
              <SectionEyebrow icon={Zap}>What We Offer</SectionEyebrow>
              <h2 className="font-display text-[30px] font-extrabold tracking-[-0.03em] text-white md:text-[40px]">
                <span className="gradient-text inline-block">Powerful Features</span>
              </h2>
              <p className="max-w-[46ch] text-[13.5px] leading-relaxed text-slate-400">
                Everything you need to manage, engage, and grow your community.
              </p>
            </div>

            <button
              type="button"
              onClick={launchDashboard}
              className="btn-glass shrink-0"
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
                  onClick={launchDashboard}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="glass-card glass-card-hover group relative flex cursor-pointer items-start gap-3.5 rounded-2xl p-4 text-left"
                >
                  <span className={`icon-tile ${c.tone} h-11 w-11 rounded-[14px]`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="card-title block">{c.title}</span>
                    <span className="card-sub mt-1 block leading-relaxed">{c.desc}</span>
                  </span>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-600 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white" />
                </motion.button>
              );
            })}
          </div>

          {/* module shortcuts (existing module links + handlers preserved) */}
          <div id="modules" className="mt-9">
            <div className="hairline" />
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-[14px] font-semibold text-white">
                  Everything you need in one place
                </p>
                <p className="mt-0.5 text-[11.5px] text-slate-400">
                  Enable powerful modules to supercharge your server.
                </p>
              </div>
              <button
                type="button"
                onClick={launchDashboard}
                className="btn-glass h-9 shrink-0 text-[12px]"
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
                    onClick={launchDashboard}
                    className="chip cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-[#4C7DFF]/40 hover:text-white"
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

      {/* ── 4. Powerful Dashboard ───────────────────────────────── */}
      <section id="dashboard" className="relative z-10 mx-auto max-w-[1180px] px-5 py-16 sm:px-6">
        <div className="glass-card rounded-3xl p-5 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <SectionEyebrow icon={LayoutDashboard}>Your Server, Simplified</SectionEyebrow>
              <h2 className="font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] text-white md:text-[40px]">
                Powerful <span className="gradient-text inline-block">Dashboard</span>
              </h2>
              <p className="max-w-[42ch] text-[13.5px] leading-relaxed text-slate-400">
                Manage your server with an intuitive and modern dashboard.
              </p>

              <ul className="space-y-3 pt-1">
                {checklist.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[13px] text-slate-200">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[#4C7DFF]/35 bg-[#4C7DFF]/15 text-[#8FB4FF]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={launchDashboard}
                  className="btn-primary h-11 px-5 text-[13px]"
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

      {/* ── 5. Join Thousands of Servers ────────────────────────── */}
      <section id="premium" className="relative z-10 mx-auto max-w-[1180px] px-5 py-16 sm:px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-8"
        >
          <div className="pointer-events-none absolute -left-20 top-1/2 h-[380px] w-[380px] -translate-y-1/2 rounded-full bg-[#4C7DFF]/20 blur-[120px]" />
          <div className="pointer-events-none absolute -right-16 -top-20 h-[340px] w-[340px] rounded-full bg-[#7C5CFF]/20 blur-[120px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_150%_at_0%_50%,rgba(76,125,255,0.16),transparent_62%)]" />

          <div className="relative flex flex-col items-center gap-7 text-center lg:flex-row lg:text-left">
            <span className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl border border-white/[0.14] bg-gradient-to-br from-[#4C7DFF]/45 to-[#7C5CFF]/20 text-white shadow-[0_26px_64px_-20px_rgba(76,125,255,0.9)] backdrop-blur-md">
              <DiscordGlyph className="h-11 w-11" />
            </span>

            <div className="min-w-0 flex-1 space-y-3">
              <SectionEyebrow icon={Users}>Join Our Community</SectionEyebrow>
              <h3 className="font-display text-[26px] font-extrabold tracking-[-0.025em] text-white md:text-[34px]">
                Join Thousands of Servers
              </h3>
              <p className="mx-auto max-w-[54ch] text-[13px] leading-relaxed text-slate-400 lg:mx-0">
                Be part of a growing community of server owners who trust Aura Bot to keep their
                servers amazing.
              </p>

              <div className="flex flex-col items-center gap-3 pt-1 sm:flex-row lg:pt-2">
                <div className="flex -space-x-2.5">
                  {communityAvatars.map((a) => (
                    <span
                      key={a.initial}
                      className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#0A0F1A] bg-gradient-to-br ${a.bg} text-[11px] font-bold text-white`}
                    >
                      {a.initial}
                    </span>
                  ))}
                </div>
                <span className="text-[11.5px] text-slate-400">
                  <span className="font-semibold text-white">1M+</span> Happy Users
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={login}
              className="btn-primary h-11 shrink-0 px-5 text-[13px]"
            >
              <DiscordGlyph className="h-4 w-4" />
              <span>Add to Discord</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── 6. Footer ──────────────────────────────────────────── */}
      <footer id="support" className="relative z-10 mx-auto max-w-[1180px] px-5 pb-10 pt-16 sm:px-6">
        <div className="hairline" />

        <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
          {/* wordmark */}
          <div>
            <div className="flex items-center gap-3">
              <AuraLogo size="md" />
              <div>
                <p className="font-display text-[13px] font-bold tracking-[0.2em] text-white">
                  AURA <span className="text-[#5BC8F5]">BOT</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">More Than Just a Bot.</p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
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
                  className="btn-icon h-9 w-9 rounded-xl"
                >
                  {s.node}
                </a>
              ))}
            </div>
          </div>

          {/* link columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="micro-label">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-[12.5px] text-slate-400 transition-colors duration-200 hover:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-[11.5px] text-slate-500 sm:flex-row">
          <span>Aura Bot © 2025. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="transition-colors duration-200 hover:text-slate-300">
              Privacy
            </a>
            <a href="#terms" className="transition-colors duration-200 hover:text-slate-300">
              Terms
            </a>
            <a href="#support" className="transition-colors duration-200 hover:text-slate-300">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
