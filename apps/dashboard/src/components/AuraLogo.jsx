"use client";

import React, { useId } from "react";

export default function AuraLogo({ size = "md", className = "", showRing = true }) {
  // Per-instance id prefix so multiple <AuraLogo /> instances on the same page
  // never emit duplicate SVG ids (invalid HTML + wrong url(#...) resolution).
  const uid = useId().replace(/[^a-zA-Z0-9_]/g, "");
  const gid = `auraGlyphGrad-${uid}`;
  const sid = `auraStarGrad-${uid}`;
  const sheid = `auraSheenGrad-${uid}`;
  const glow = `softAuraGlow-${uid}`;

  const dimensions = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
    banner: "w-28 h-28",
  }[size] || "w-10 h-10";

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${dimensions} ${className}`}>
      {/* Soft Ambient Glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7C5CFF] to-[#5B8CFF] opacity-30 blur-md pointer-events-none" />

      {/* Container Orb / Ring */}
      <div className={`relative w-full h-full rounded-full flex items-center justify-center ${
        showRing ? 'bg-[#0E111A] border border-[#7C5CFF]/30 shadow-[0_0_15px_rgba(124,92,255,0.25)]' : ''
      }`}>
        <svg
          viewBox="0 0 200 200"
          className="w-[85%] h-[85%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Primary Aura Gradient: Soft Violet to Cool Blue */}
            <linearGradient id={gid} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#9B82FF" />
              <stop offset="45%" stopColor="#7C5CFF" />
              <stop offset="100%" stopColor="#5B8CFF" />
            </linearGradient>

            {/* Glowing Star Gradient */}
            <linearGradient id={sid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#C4B5FD" />
              <stop offset="100%" stopColor="#93C5FD" />
            </linearGradient>

            {/* Subtle Top Specular Sheen */}
            <linearGradient id={sheid} x1="50%" y1="0%" x2="50%" y2="60%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            <filter id={glow} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* The Geometric 'A' Body */}
          <path
            d="M 100 24 
               L 164 168 
               L 144 154 
               L 126 166 
               L 108 122 
               L 92 122 
               L 74 166 
               L 56 154 
               L 36 168 
               Z"
            fill={`url(#${gid})`}
            filter={`url(#${glow})`}
          />

          {/* Top Sheen Accent */}
          <path
            d="M 100 24 
               L 128 88 
               L 100 82 
               L 72 88 
               Z"
            fill={`url(#${sheid})`}
            opacity="0.8"
          />

          {/* Central Radiating 4-Point Sparkle Star (✦) */}
          <path
            d="M 100 80 
               Q 100 102 113 102 
               Q 100 102 100 124 
               Q 100 102 87 102 
               Q 100 102 100 80 
               Z"
            fill={`url(#${sid})`}
            filter="drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.9))"
          />
        </svg>
      </div>
    </div>
  );
}
