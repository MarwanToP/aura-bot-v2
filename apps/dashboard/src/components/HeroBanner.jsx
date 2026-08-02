"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, Bolt } from "lucide-react";

export default function HeroBanner({ username = "Marwan" }) {
  return (
    <div className="flex flex-col md:flex_row md:items-center justify-between gap-4 pb-2">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Good evening, {username}! <span className="animate-bounce inline-block">👋</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Here's what's happening with Aura Bot today.
        </p>
      </div>

      {/* Right Bot Status Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center gap-4 bg-[#0b0c10] border border-emerald-500/20 px-4 py-3 rounded-2xl shadow-lg"
      >
        <div>
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Bot Status
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-white">Online</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">All systems operational</p>
        </div>

        <motion.div
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center"
        >
          <Bolt className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </div>
  );
}
