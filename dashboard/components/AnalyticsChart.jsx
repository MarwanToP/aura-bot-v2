"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { BarChart3, Calendar, Sparkles } from "lucide-react";

const DATA_7_DAYS = [
  { day: "Mon", commands: 42100, moderation: 12400, music: 18200 },
  { day: "Tue", commands: 54300, moderation: 15100, music: 22400 },
  { day: "Wed", commands: 49800, moderation: 11900, music: 20100 },
  { day: "Thu", commands: 68200, moderation: 18400, music: 29500 },
  { day: "Fri", commands: 89400, moderation: 24200, music: 38100 },
  { day: "Sat", commands: 112000, moderation: 31000, music: 49200 },
  { day: "Sun", commands: 98500, moderation: 27800, music: 41000 },
];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#09090b]/95 backdrop-blur-xl p-3.5 shadow-2xl font-mono text-xs">
        <p className="text-zinc-400 font-bold mb-2 border-b border-white/10 pb-1">
          {label} Telemetry
        </p>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-4 text-[#5865F2]">
            <span>Total Commands:</span>
            <span className="font-bold">{payload[0]?.value?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4 text-cyan-400">
            <span>Music Playbacks:</span>
            <span className="font-bold">{payload[1]?.value?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function AnalyticsChart() {
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 shadow-xl my-8">
      
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#5865F2]" />
            Command Analytics & Usage Trends
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time execution stats for slash commands and automated systems.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/[0.03] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setTimeRange("7d")}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
              timeRange === "7d"
                ? "bg-[#5865F2] text-white font-bold shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
              timeRange === "30d"
                ? "bg-[#5865F2] text-white font-bold shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Glowing Spline Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA_7_DAYS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="blurpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5865F2" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#5865F2" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
            <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="commands"
              stroke="#5865F2"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#blurpleGradient)"
            />
            <Area
              type="monotone"
              dataKey="music"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cyanGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
