"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCards() {
  const cards = [
    {
      title: "Servers",
      value: "24",
      change: "+2 this week",
      isPositive: true,
      stroke: "#a855f7",
      fill: "url(#purpleGrad)",
    },
    {
      title: "Members",
      value: "128.4K",
      change: "+3.7% this week",
      isPositive: true,
      stroke: "#3b82f6",
      fill: "url(#blueGrad)",
    },
    {
      title: "Commands Used",
      value: "28.7M",
      change: "+11.3% this week",
      isPositive: true,
      stroke: "#06b6d4",
      fill: "url(#cyanGrad)",
    },
    {
      title: "Tickets Created",
      value: "3.2K",
      change: "-4.3% this week",
      isPositive: false,
      stroke: "#ec4899",
      fill: "url(#pinkGrad)",
    },
    {
      title: "Uptime",
      value: "99.97%",
      change: "30d average",
      isPositive: true,
      stroke: "#f59e0b",
      fill: "url(#amberGrad)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 select-none">
      {cards.map((c, idx) => (
        <motion.div
          key={c.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.08 }}
          className="dark-panel p-4 flex flex-col justify-between border border-purple-500/20 bg-[#0d0b1d] hover:border-purple-500/40 transition-all hover:-translate-y-1 shadow-lg"
        >
          <div>
            <span className="text-xs font-semibold text-zinc-400 block">
              {c.title}
            </span>
            <span className="text-2xl font-black text-white leading-tight mt-0.5 block">
              {c.value}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div
              className={`flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                c.isPositive
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : "text-pink-400 bg-pink-500/10 border-pink-500/20"
              }`}
            >
              {c.isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              <span>{c.change}</span>
            </div>

            {/* Sparkline Graphic */}
            <div className="w-20 h-8">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={
                    c.isPositive
                      ? "M 0 30 Q 25 10, 50 22 T 100 5 L 100 40 L 0 40 Z"
                      : "M 0 10 Q 25 25, 50 15 T 100 35 L 100 40 L 0 40 Z"
                  }
                  fill={c.fill}
                />
                <path
                  d={
                    c.isPositive
                      ? "M 0 30 Q 25 10, 50 22 T 100 5"
                      : "M 0 10 Q 25 25, 50 15 T 100 35"
                  }
                  fill="none"
                  stroke={c.stroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
