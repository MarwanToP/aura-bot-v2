"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Server, Users, Activity, TrendingUp, ShieldCheck, Zap } from "lucide-react";

function CounterNumber({ value, suffix = "" }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    Math.floor(latest).toLocaleString()
  );
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: "easeOut" });
    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
}

function MetricCard({ title, value, suffix = "", change, icon: Icon, glowColor = "#5865F2" }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-50, 50], [8, -8]);
  const rotateY = useTransform(x, [-50, 50], [-8, 8]);

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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative group rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 overflow-hidden cursor-pointer shadow-xl"
    >
      {/* Background Ambient Glow */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
        style={{ backgroundColor: glowColor }}
      />

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {title}
        </span>
        <div
          className="p-2.5 rounded-xl border border-white/10 bg-white/[0.05]"
          style={{ color: glowColor }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="text-3xl font-extrabold text-white tracking-tight font-mono mb-2">
        <CounterNumber value={value} suffix={suffix} />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          {change}
        </span>
        <span className="text-zinc-500 font-mono">Live telemetry</span>
      </div>
    </motion.div>
  );
}

export default function MetricsGrid() {
  const metrics = [
    {
      title: "Active Servers",
      value: 1420,
      change: "+12.4% this month",
      icon: Server,
      glowColor: "#5865F2", // Discord Blurple
    },
    {
      title: "Total Users",
      value: 849200,
      change: "+48.2k new users",
      icon: Users,
      glowColor: "#06b6d4", // Cyan
    },
    {
      title: "System Uptime",
      value: 99.98,
      suffix: "%",
      change: "Stable (99.98%)",
      icon: Activity,
      glowColor: "#10b981", // Emerald
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
      {metrics.map((m, i) => (
        <MetricCard key={i} {...m} />
      ))}
    </div>
  );
}
