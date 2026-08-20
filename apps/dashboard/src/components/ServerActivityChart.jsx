"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ServerActivityChart() {
  const [activeSeries, setActiveSeries] = useState({
    messages: true,
    commands: true,
    voice: true,
    joins: true,
  });

  const toggleSeries = (key) => {
    setActiveSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const dates = ["May 19", "May 20", "May 21", "May 22", "May 23", "May 24", "May 25"];

  return (
    <div className="dark-panel p-5 flex flex-col justify-between border border-purple-500/20 bg-[#0d0b1d] select-none h-full shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-white">Activity Overview</h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend Items */}
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <button
              onClick={() => toggleSeries("messages")}
              className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
                activeSeries.messages ? "opacity-100" : "opacity-40"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <span className="text-zinc-300">Messages</span>
            </button>

            <button
              onClick={() => toggleSeries("commands")}
              className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
                activeSeries.commands ? "opacity-100" : "opacity-40"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
              <span className="text-zinc-300">Commands</span>
            </button>

            <button
              onClick={() => toggleSeries("voice")}
              className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
                activeSeries.voice ? "opacity-100" : "opacity-40"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="text-zinc-300">Voice Time</span>
            </button>

            <button
              onClick={() => toggleSeries("joins")}
              className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
                activeSeries.joins ? "opacity-100" : "opacity-40"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-zinc-300">Joins</span>
            </button>
          </div>

          <button className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 bg-purple-950/50 border border-purple-500/20 px-2.5 py-1 rounded-lg hover:text-white transition-colors cursor-pointer">
            <span>Last 7 days</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full h-56 mt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200">
          <defs>
            <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="cmdGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 40, 80, 120, 160].map((y) => (
            <line
              key={y}
              x1="40"
              y1={y}
              x2="680"
              y2={y}
              stroke="#1f1a3a"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          ))}

          {/* Y Axis Labels */}
          <text x="30" y="165" fill="#71717a" fontSize="10" textAnchor="end">0</text>
          <text x="30" y="125" fill="#71717a" fontSize="10" textAnchor="end">20K</text>
          <text x="30" y="85" fill="#71717a" fontSize="10" textAnchor="end">40K</text>
          <text x="30" y="45" fill="#71717a" fontSize="10" textAnchor="end">60K</text>
          <text x="30" y="5" fill="#71717a" fontSize="10" textAnchor="end">80K</text>

          {/* Series 1: Messages (purple) */}
          {activeSeries.messages && (
            <>
              <path
                d="M 50 140 Q 150 60, 250 110 T 450 30 T 650 90 L 650 160 L 50 160 Z"
                fill="url(#msgGrad)"
              />
              <path
                d="M 50 140 Q 150 60, 250 110 T 450 30 T 650 90"
                fill="none"
                stroke="#a855f7"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {[
                { x: 50, y: 140 },
                { x: 150, y: 85 },
                { x: 250, y: 110 },
                { x: 350, y: 65 },
                { x: 450, y: 30 },
                { x: 550, y: 50 },
                { x: 650, y: 90 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
              ))}
            </>
          )}

          {/* Series 2: Commands (magenta) */}
          {activeSeries.commands && (
            <>
              <path
                d="M 50 150 Q 150 100, 250 130 T 450 60 T 650 110 L 650 160 L 50 160 Z"
                fill="url(#cmdGrad)"
              />
              <path
                d="M 50 150 Q 150 100, 250 130 T 450 60 T 650 110"
                fill="none"
                stroke="#ec4899"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {[
                { x: 50, y: 150 },
                { x: 150, y: 105 },
                { x: 250, y: 130 },
                { x: 350, y: 90 },
                { x: 450, y: 60 },
                { x: 550, y: 80 },
                { x: 650, y: 110 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#ec4899" stroke="#ffffff" strokeWidth="1.5" />
              ))}
            </>
          )}

          {/* Series 3: Voice Time (cyan) */}
          {activeSeries.voice && (
            <>
              <path
                d="M 50 160 Q 150 120, 250 145 T 450 90 T 650 130"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {[
                { x: 50, y: 160 },
                { x: 150, y: 125 },
                { x: 250, y: 145 },
                { x: 350, y: 110 },
                { x: 450, y: 90 },
                { x: 550, y: 105 },
                { x: 650, y: 130 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1" />
              ))}
            </>
          )}

          {/* Series 4: Joins (emerald) */}
          {activeSeries.joins && (
            <>
              <path
                d="M 50 170 Q 150 140, 250 155 T 450 120 T 650 145"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {[
                { x: 50, y: 170 },
                { x: 150, y: 145 },
                { x: 250, y: 155 },
                { x: 350, y: 135 },
                { x: 450, y: 120 },
                { x: 550, y: 130 },
                { x: 650, y: 145 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
              ))}
            </>
          )}
        </svg>

        {/* X Axis Labels */}
        <div className="flex justify-between pl-10 pr-2 pt-2 text-[10px] text-zinc-500 font-mono">
          {dates.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
