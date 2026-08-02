import React from 'react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuCategories = [
    {
      title: 'OVERVIEW',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: '⚡' }],
    },
    {
      title: 'MANAGE',
      items: [
        { id: 'servers', label: 'Servers', icon: '🌐' },
        { id: 'members', label: 'Members', icon: '👥' },
        { id: 'commands', label: 'Commands', icon: '⚙️' },
        { id: 'automation', label: 'Automation', icon: '🤖' },
        { id: 'tickets', label: 'Tickets', icon: '🎟️' },
        { id: 'reaction_roles', label: 'Reaction Roles', icon: '🎭' },
        { id: 'welcome', label: 'Welcome', icon: '👋' },
        { id: 'verification', label: 'Verification', icon: '🛡️' },
        { id: 'giveaways', label: 'Giveaways', icon: '🎁' },
        { id: 'polls', label: 'Polls', icon: '📊' },
      ],
    },
    {
      title: 'MODERATION',
      items: [
        { id: 'moderation', label: 'Moderation', icon: '⚖️' },
        { id: 'auto_moderation', label: 'Auto Moderation', icon: '🛡️' },
        { id: 'logs', label: 'Logs', icon: '📝' },
        { id: 'security', label: 'Security', icon: '🔒' },
        { id: 'anti_nuke', label: 'Anti-Nuke', icon: '☣️' },
        { id: 'voice', label: 'Voice', icon: '🔊' },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { id: 'analytics', label: 'Analytics', icon: '📈' },
        { id: 'invite_tracker', label: 'Invite Tracker', icon: '🔗' },
        { id: 'serverstats', label: 'ServerStats', icon: '📊' },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-cosmic-bg border-r border-cosmic-border flex flex-col h-screen sticky top-0 p-4 overflow-y-auto">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/30">
          A
        </div>
        <div>
          <h1 className="font-extrabold text-white text-lg tracking-wide">AURA BOT</h1>
          <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">CONTROL PANEL</span>
        </div>
      </div>

      {/* Navigation Categories */}
      <nav className="flex-1 space-y-6">
        {menuCategories.map((cat, i) => (
          <div key={i}>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
              {cat.title}
            </h3>
            <div className="space-y-1">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab && setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-md shadow-purple-900/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bot Footer Status */}
      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Aura Bot v2.0.0</span>
        </div>
        <span className="text-purple-400 font-mono">42ms</span>
      </div>
    </aside>
  );
}
