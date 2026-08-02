"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const data = [
  { name: "Small (1 - 100)", count: "5,332 (35.9%)", value: 5332, color: "#8b5cf6" },
  { name: "Medium (101 - 500)", count: "4,212 (28.4%)", value: 4212, color: "#3b82f6" },
  { name: "Large (501 - 1000)", count: "3,167 (21.4%)", value: 3167, color: "#ec4899" },
  { name: "Huge (1000+)", count: "2,110 (14.3%)", value: 2110, color: "#f59e0b" },
];

export default function ServerDistributionChart() {
  return (
    <div className="dark-panel p-6 flex flex-col justify-between h-[340px]">
      
      {/* Header */}
      <h3 className="text-sm font-bold text-white tracking-wide mb-2">
        Server Distribution
      </h3>

      <div className="flex items-center justify-between gap-4 flex-1">
        
        {/* Interactive Donut Chart with Center Text */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0b0d14" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#121520] border border-[#1e2333] p-2 rounded-lg text-xs font-semibold text-white shadow-lg">
                        {payload[0].name}: {payload[0].value.toLocaleString()}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-sm font-black text-white leading-tight">14,821</span>
            <span className="text-[10px] text-zinc-400 font-medium">Total</span>
          </div>
        </div>

        {/* Right Legend Details */}
        <div className="space-y-3 text-xs flex-1">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-zinc-300 font-medium text-[11px]">{item.name}</span>
              </div>
              <span className="font-bold text-white font-mono text-[11px]">{item.count}</span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
