"use client";

import React from "react";
import { Search, Bell, BookOpen, Headphones, ChevronDown } from "lucide-react";
import AuraLogo from "./AuraLogo";

export default function Header() {
  return (
    <header className="h-16 border-b border-[#1c1836] bg-[#07060f]/90 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-50 shadow-lg shadow-black/40 select-none">
      {/* Left Brand Header in Header */}
      <div className="flex items-center gap-3">
        <AuraLogo size="md" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-white text-base tracking-wider uppercase bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
              AURA BOT
            </h1>
          </div>
          <span className="text-[9px] text-purple-400 font-extrabold tracking-widest uppercase block -mt-0.5">
            CONTROL PANEL
          </span>
        </div>
      </div>

      {/* Middle Global Search Bar */}
      <div className="relative w-72 md:w-96">
        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-purple-400/70" />
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full bg-[#110e24] border border-purple-500/20 rounded-xl pl-10 pr-12 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-all shadow-inner"
        />
        <kbd className="absolute right-3 top-2.5 text-[10px] bg-purple-500/10 border border-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-0.5">
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </div>

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-3">
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 transition-all cursor-pointer">
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>Docs</span>
          <span className="text-zinc-500 text-[10px]">&gt;</span>
        </button>

        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 transition-all cursor-pointer">
          <Headphones className="w-3.5 h-3.5 text-purple-400" />
          <span>Support</span>
        </button>

        {/* Notifications Bell */}
        <button className="relative p-2 rounded-xl bg-[#110e24] border border-purple-500/20 text-zinc-300 hover:text-white hover:border-purple-500/50 transition-all cursor-pointer">
          <Bell className="w-4 h-4 text-purple-300" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
        </button>

        <div className="w-px h-6 bg-purple-500/20 mx-1" />

        {/* User Profile */}
        <div className="flex items-center gap-2.5 bg-[#110e24] border border-purple-500/20 hover:border-purple-500/40 p-1.5 pr-3 rounded-xl transition-all cursor-pointer">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 p-[1.5px] shadow-md shadow-purple-900/40">
              <div className="w-full h-full rounded-full bg-[#0d091e] overflow-hidden flex items-center justify-center font-bold text-white text-xs">
                {/* Visual avatar initials or uploaded avatar */}
                <span className="bg-gradient-to-tr from-purple-400 to-pink-400 bg-clip-text text-transparent font-extrabold">
                  MM
                </span>
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#07060f]" />
          </div>

          <div className="text-left">
            <h4 className="text-xs font-bold text-white leading-tight flex items-center gap-1">
              Marwan Muhammed
            </h4>
            <span className="text-[10px] text-purple-400 font-semibold block leading-tight">
              Owner
            </span>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
        </div>
      </div>
    </header>
  );
}
