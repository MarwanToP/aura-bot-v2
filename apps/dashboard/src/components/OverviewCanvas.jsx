import React from 'react';

export default function OverviewCanvas() {
  return (
    <main className="p-6 space-y-6 bg-cosmic-gradient min-h-screen text-white">
      {/* Hero Greeting Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900/40 border border-purple-500/30 backdrop-blur-xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Good evening, Marwan! 👋</h2>
          <p className="text-sm text-slate-400 mt-1">Here's what's happening with Aura Bot today.</p>
          <div className="flex gap-4 mt-4 text-xs font-semibold">
            <span className="bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl">🌐 24 Servers</span>
            <span className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl">👥 128.4K Members</span>
            <span className="bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-xl">⚡ 28.7M Commands</span>
          </div>
        </div>

        {/* Server Health Meter */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center min-w-[180px]">
          <span className="text-xs text-slate-400 uppercase font-semibold">Server Health</span>
          <div className="text-3xl font-black text-emerald-400 my-1">92</div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">Excellent</span>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Servers', val: '24', change: '+2 this week', color: 'border-purple-500/30' },
          { label: 'Members', val: '128.4K', change: '+3.7% this week', color: 'border-cyan-500/30' },
          { label: 'Commands Used', val: '28.7M', change: '+11.3% this week', color: 'border-indigo-500/30' },
          { label: 'Uptime', val: '99.97%', change: '30d average', color: 'border-emerald-500/30' },
        ].map((card, i) => (
          <div key={i} className={`p-4 rounded-2xl bg-slate-900/50 border ${card.color} backdrop-blur-md`}>
            <span className="text-xs text-slate-400 font-medium">{card.label}</span>
            <div className="text-2xl font-black mt-1 mb-2">{card.val}</div>
            <span className="text-[10px] text-emerald-400 font-semibold">{card.change}</span>
          </div>
        ))}
      </div>

      {/* Activity Overview & Top Commands */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart Area */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Activity Overview</h3>
            <span className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-slate-300">Last 7 days</span>
          </div>
          <div className="h-48 rounded-xl bg-purple-950/20 border border-purple-500/10 flex items-center justify-center text-slate-500 text-sm font-mono">
            [ Activity Chart: Messages, Commands, Voice Time, Joins ]
          </div>
        </div>

        {/* Top Commands */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-md">
          <h3 className="font-bold text-lg mb-4">Top Commands</h3>
          <div className="space-y-3 text-sm">
            {[
              { cmd: '/verify', uses: '6.42M uses' },
              { cmd: '/help', uses: '5.11M uses' },
              { cmd: '/play', uses: '4.21M uses' },
              { cmd: '/ticket', uses: '3.56M uses' },
              { cmd: '/ban', uses: '2.91M uses' },
            ].map((c, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                <span className="font-mono text-purple-300 font-bold">{c.cmd}</span>
                <span className="text-xs text-slate-400">{c.uses}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
