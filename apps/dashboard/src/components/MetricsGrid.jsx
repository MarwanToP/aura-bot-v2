"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Server, Users, Activity, TrendingUp } from "lucide-react";
import { fetchStats } from "../app/lib/api";

function CounterNumber({ value, suffix = "" }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    Math.floor(latest).toLocaleString()
  );
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.8, ease: "easeOut" });
    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
}

const cardItemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

function MetricCard({ title, value, suffix = "", change, icon: Icon, glowColor = "#5865F2" }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [8, -8]);
  const rotateY = useTransform(x, [-60, 60], [-8, 8]);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      variants={cardItemVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.025, translateY: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className="relative group rounded-3xl ios-glass-interactive p-6 overflow-hidden cursor-pointer shadow-2xl"
    >
      {/* iOS Light Specular Highlight Overlay */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Background Ambient Color Reflection Orb */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />

      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          {title}
        </span>
        <div
          className="p-3 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]"
          style={{ color: glowColor }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="text-3xl font-black text-white tracking-tight font-mono mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
        <CounterNumber value={value} suffix={suffix} />
      </div>

      <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10">
        <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <TrendingUp className="w-3.5 h-3.5" />
          {change}
        </span>
        <span className="text-zinc-400 font-mono text-[11px]">Live Telemetry</span>
      </div>
    </motion.div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export default function MetricsGrid() {
  const [statsData, setStatsData] = useState({
    guildCount: 1420,
    userCount: 849200,
    uptime: 99.98,
  });

  useEffect(() => {
    fetchStats().then((res) => {
      if (res && res.guildCount) {
        setStatsData(res);
      }
    });
  }, []);

  const metrics = [
    {
      title: "Active Servers",
      value: statsData.guildCount,
      change: "+12.4% this month",
      icon: Server,
      glowColor: "#5865F2", // Discord Blurple
    },
    {
      title: "Total Users",
      value: statsData.userCount,
      change: "+48.2k new users",
      icon: Users,
      glowColor: "#06b6d4", // Cyan
    },
    {
      title: "System Uptime",
      value: statsData.uptime || 99.98,
      suffix: "%",
      change: "Stable (99.98%)",
      icon: Activity,
      glowColor: "#10b981", // Emerald
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8"
    >
      {metrics.map((m, i) => (
        <MetricCard key={i} {...m} />
      ))}
    </motion.div>
  );
}
