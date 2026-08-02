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
import { ChevronDown } from "lucide-react";

const DATA = [
  { date: "May 19", users: 12000, commands: 5000, messages: 3500 },
  { date: "May 20", users: 15000, commands: 8000, messages: 5200 },
  { date: "May 21", users: 14000, commands: 7500, messages: 4800 },
  { date: "May 22", users: 19000, commands: 12000, messages: 7100 },
  { date: "May 23", users: 17000, commands: 10500, messages: 6300 },
  { date: "May 24", users: 18000, commands: 11200, messages: 6900 },
  { date: "May 25", users: 23000, commands: 16000, messages: 9400 },
];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="dark-panel p-3.5 shadow-2xl text-xs font-medium space-y-1.5 border border-[#1e2333]">
        <p className="text-zinc-400 font-bold border-b border-[#1e2333] pb-1">{label}</p>
        <div className="flex items-center justify-between gap-4 text-[#8b5cf6]">
          <span>Users:</span> <span className="font-bold">{payload[0]?.value?.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[#ec4899]">
          <span>Commands:</span> <span className="font-bold">{payload[1]?.value?.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[#3b82f6]">
          <span>Messages:</span> <span className="font-bold">{payload[2]?.value?.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function ServerActivityChart() {
  const [timeRange, setTimeRange] = useState("Last 7 days");

  return (
    <div className="dark-panel p-6 flex flex-col justify-between h-[360px]">
      
      {/* Header & Controls */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Server Activity</h3>
        </div>

        <div className="flex items-center gap-6">
          {/* Legend Pills */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#8b5cf6]" /> Users
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ec4899]" /> Commands
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]" /> Messages
            </span>
          </div>

          {/* Time Filter Button */}
          <button className="px-3 py-1.5 rounded-xl bg-[#0b0d14] border border-[#1e2333] text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 transition-colors">
            <span>{timeRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Recharts Spline Area Chart */}
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="purpleG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="pinkG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="blueG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="users"
              stroke="#8b5cf6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#purpleG)"
              dot={{ r: 4, fill: "#8b5cf6", stroke: "#0b0d14", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="commands"
              stroke="#ec4899"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#pinkG)"
              dot={{ r: 4, fill: "#ec4899", stroke: "#0b0d14", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="messages"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#blueG)"
              dot={{ r: 4, fill: "#3b82f6", stroke: "#0b0d14", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
