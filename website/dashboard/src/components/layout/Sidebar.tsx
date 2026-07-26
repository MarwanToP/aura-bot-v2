import React from 'react';

export type TabView = 'overview' | 'bots' | 'servers' | 'commands' | 'analytics' | 'settings';

interface SidebarProps {
  activeTab: TabView;
  setActiveTab: (tab: TabView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems: { id: TabView; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'bots', label: 'Bots Catalog', icon: '🤖' },
    { id: 'servers', label: 'Guild Servers', icon: '🌐' },
    { id: 'commands', label: 'Command Library', icon: '⚡' },
    { id: 'analytics', label: 'Analytics & Telemetry', icon: '📈' },
    { id: 'settings', label: 'Platform Settings', icon: '⚙️' }
  ];

  return (
    <aside
      style={{
        width: '260px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'var(--aura-bg-surface)',
        borderRight: '1px solid var(--aura-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem',
        zIndex: 10
      }}
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--aura-border)',
          marginBottom: '1.5rem'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--aura-primary), #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.25rem',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}
        >
          A
        </div>
        <div>
          <div style={{ fontFamily: 'var(--aura-font-display)', fontWeight: 800, fontSize: '1.15rem' }}>
            AURA OS
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--aura-text-muted)', fontWeight: 500 }}>
            Bot Core v2.4.0
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
        {menuItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="aura-btn"
              style={{
                justifyContent: 'flex-start',
                width: '100%',
                background: isActive ? 'var(--aura-primary-light)' : 'transparent',
                color: isActive ? 'var(--aura-primary)' : 'var(--aura-text-secondary)',
                borderLeft: isActive ? '3px solid var(--aura-primary)' : '3px solid transparent',
                borderRadius: '0 8px 8px 0',
                padding: '0.75rem 1rem',
                fontWeight: isActive ? 700 : 500
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status Footnote */}
      <div
        style={{
          padding: '1rem',
          background: 'var(--aura-bg-glass)',
          borderRadius: '10px',
          border: '1px solid var(--aura-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'var(--aura-success)',
            boxShadow: '0 0 8px var(--aura-success)'
          }}
        />
        <div style={{ fontSize: '0.8rem' }}>
          <div style={{ fontWeight: 600, color: 'var(--aura-text-primary)' }}>System Operational</div>
          <div style={{ color: 'var(--aura-text-muted)', fontSize: '0.75rem' }}>18ms avg latency</div>
        </div>
      </div>
    </aside>
  );
};
