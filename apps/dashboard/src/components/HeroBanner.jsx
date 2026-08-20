"use client";

import React from "react";
import { motion } from "framer-motion";
import { Server, Users, Terminal } from "lucide-react";
import AuraLogo from "./AuraLogo";

export default function HeroBanner({ username = "Marwan" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-[#0d0922] via-[#140c33] to-[#0d0922] border border-purple-500/30 p-6 md:p-8 shadow-2xl shadow-purple-950/40 select-none"
    >
      {/* Background Cosmic Glow & Nebulae */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-96 h-96 rounded-full bg-purple-600/20 blur-[100px]" />
        <div className="absolute top-0 right-10 w-72 h-72 rounded-full bg-pink-600/15 blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.15),transparent_60%)]" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side Info & Stats Pills */}
        <div className="space-y-4 max-w-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Good evening, {username}!{" "}
              <motion.span
                animate={{ rotate: [0, 20, 0, 20, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block origin-bottom-right"
              >
                👋
              </motion.span>
            </h1>
            <p className="text-sm text-purple-200/80 mt-1 font-medium">
              Here's what's happening with Aura Bot today.
            </p>
          </div>

          {/* 3 Quick Stat Pills (Matching Photo 3) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-white font-bold text-xs shadow-md">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>24 Servers</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-white font-bold text-xs shadow-md">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>128.4K Members</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-white font-bold text-xs shadow-md">
              <Terminal className="w-3.5 h-3.5 text-pink-400" />
              <span>28.7M Commands</span>
            </div>
          </div>
        </div>

        {/* Right Side Cosmic Pedestal Artwork (Matching Photo 3) */}
        <div className="relative flex items-center justify-center shrink-0">
          {/* Glowing Pedestal Platform */}
          <div className="relative w-48 h-36 flex items-center justify-center">
            {/* Holographic Ring Base */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-2 w-40 h-16 rounded-full border-2 border-purple-400/40 shadow-[0_0_30px_rgba(168,85,247,0.6)]"
              style={{ transform: "rotateX(70deg)" }}
            />
            <div
              className="absolute bottom-4 w-32 h-10 rounded-full bg-gradient-to-t from-purple-600/40 to-pink-500/20 blur-sm"
              style={{ transform: "rotateX(70deg)" }}
            />

            {/* Levitating Crystal Logo */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <AuraLogo size="banner" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
