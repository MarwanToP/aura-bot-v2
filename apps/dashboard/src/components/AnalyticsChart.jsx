"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

const DATA_7_DAYS = [
  { day: "Mon", commands: 42100, moderation: 12400, music: 18200 },
  { day: "Tue", commands: 54300, moderation: 15100, music: 22400 },
  { day: "Wed", commands: 49800, moderation: 11900, music: 20100 },
  { day: "Thu", commands: 68200, moderation: 18400, music: 29500 },
  { day: "Fri", commands: 89400, moderation: 24200, music: 38100 },
  { day: "Sat", commands: 112000, moderation: 31000, music: 49200 },
  { day: "Sun", commands: 98500, moderation: 27800, music: 41000 },
];

const DATA_30_DAYS = [
  { day: "W1", commands: 210000, moderation: 64000, music: 98000 },
  { day: "W2", commands: 285000, moderation: 82000, music: 124000 },
  { day: "W3", commands: 340000, moderation: 98000, music: 156000 },
  { day: "W4", commands: 412000, moderation: 115000, music: 194000 },
];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl ios-glass-dropdown p-4 shadow-2xl font-mono text-xs border border-white/20">
        <p className="text-zinc-400 font-bold mb-2 border-b border-white/10 pb-1.5 uppercase tracking-wider text-[10px]">
          {label} Telemetry
        </p>
        <div className="space-y-2">
          <div className="flex justify-between gap-6 text-[#5865F2]">
            <span className="font-semibold">Total Commands:</span>
            <span className="font-extrabold">{payload[0]?.value?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-6 text-cyan-400">
            <span className="font-semibold">Music Playbacks:</span>
            <span className="font-extrabold">{payload[1]?.value?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function AnalyticsChart() {
  const [timeRange, setTimeRange] = useState("7d");
  const [chartData, setChartData] = useState(DATA_7_DAYS);

  useEffect(() => {
    setChartData(timeRange === "7d" ? DATA_7_DAYS : DATA_30_DAYS);
  }, [timeRange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-3xl ios-glass-interactive p-6 shadow-2xl relative overflow-hidden"
    >
      {/* Specular Highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/30 text-[#5865F2]">
              <BarChart3 className="w-5 h-5" />
            </div>
            Command Analytics & Usage Trends
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time execution stats for slash commands and automated telemetry.
          </p>
        </div>

        <div className="flex items-center gap-1.5 ios-glass-pill p-1 rounded-2xl">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setTimeRange("7d")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all ${
              timeRange === "7d"
                ? "bg-[#5865F2] text-white font-bold shadow-lg shadow-[#5865F2]/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            7 Days
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setTimeRange("30d")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all ${
              timeRange === "30d"
                ? "bg-[#5865F2] text-white font-bold shadow-lg shadow-[#5865F2]/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            30 Days
          </motion.button>
        </div>
      </div>

      {/* Glowing Spline Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="blurpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5865F2" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#5865F2" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="day" stroke="#a1a1aa" fontSize={11} tickLine={false} />
            <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="commands"
              stroke="#5865F2"
              strokeWidth={3.5}
              fillOpacity={1}
              fill="url(#blurpleGradient)"
            />
            <Area
              type="monotone"
              dataKey="music"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#cyanGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </motion.div>
  );
}
