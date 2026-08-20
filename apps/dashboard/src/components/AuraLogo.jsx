import React from "react";

export default function AuraLogo({ size = "md", className = "" }) {
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
    banner: "w-32 h-32",
  }[size] || "w-10 h-10";

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${dimensions} ${className}`}>
      {/* Outer Neon Glow Ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-400 opacity-60 blur-md animate-pulse" />
      
      {/* Ring container with SVG crystal icon */}
      <div className="relative w-full h-full rounded-full bg-[#0d091e] border border-purple-500/40 p-1.5 shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(192,132,252,0.8)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="crystalGradLeft" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <linearGradient id="crystalGradRight" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a5b4fc" />
            </linearGradient>
            <linearGradient id="crystalGradCenter" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Ring Circle */}
          <circle
            cx="100"
            cy="100"
            r="88"
            stroke="url(#crystalGradLeft)"
            strokeWidth="3"
            strokeDasharray="6 3"
            opacity="0.6"
          />

          {/* 3D Crystal A Geometry */}
          {/* Left Leg */}
          <polygon
            points="100,25 35,160 70,160 100,85"
            fill="url(#crystalGradLeft)"
            filter="url(#neonGlow)"
          />
          {/* Right Leg */}
          <polygon
            points="100,25 165,160 130,160 100,85"
            fill="url(#crystalGradRight)"
            filter="url(#neonGlow)"
          />
          {/* Crossbar Diamond facet */}
          <polygon
            points="100,80 122,125 100,140 78,125"
            fill="url(#crystalGradCenter)"
            opacity="0.9"
          />
          {/* Glowing Center Core */}
          <polygon
            points="100,95 110,120 100,128 90,120"
            fill="#ffffff"
            opacity="0.9"
          />
        </svg>
      </div>
    </div>
  );
}
