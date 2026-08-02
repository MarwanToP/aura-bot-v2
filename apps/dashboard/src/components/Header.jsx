import React from 'react';

export default function Header() {
  return (
    <header className="h-16 border-b border-cosmic-border bg-cosmic-bg/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Search Bar */}
      <div className="relative w-80">
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
        />
        <kbd className="absolute right-3 top-2.5 text-[10px] bg-white/10 text-slate-400 px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Profile & Controls */}
      <div className="flex items-center gap-4">
        <button className="text-sm font-medium text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer">
          📚 Docs
        </button>
        <button className="text-sm font-medium text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer">
          🎧 Support
        </button>
        <div className="w-px h-5 bg-white/10"></div>
        
        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <h4 className="text-sm font-bold text-white leading-tight">Marwan Muhammed</h4>
            <span className="text-[10px] text-purple-400 font-semibold">Owner</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white border-2 border-purple-500/50">
            M
          </div>
        </div>
      </div>
    </header>
  );
}
