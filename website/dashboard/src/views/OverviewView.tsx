import React from 'react';
import { MetricCard } from '../components/common/MetricCard';
import { useBots } from '../context/BotContext';
import { BotCard } from '../components/bots/BotCard';
import { ChartCanvas } from '../components/common/ChartCanvas';
import { useNotifications } from '../context/NotificationContext';
import { Badge } from '../components/common/Badge';
import { TabView } from '../components/layout/Sidebar';

interface OverviewViewProps {
  onNavigateTab: (tab: TabView) => void;
  onOpenCreateBotModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigateTab,
  onOpenCreateBotModal
}) => {
  const { bots, toggleStatus, deleteBot } = useBots();
  const { notifications } = useNotifications();

  const totalServers = bots.reduce((sum, b) => sum + b.serversCount, 0);
  const totalUsers = bots.reduce((sum, b) => sum + b.usersCount, 0);
  const onlineBots = bots.filter(b => b.status === 'online').length;

  const mockOverviewActivity = [
    { timestamp: '00:00', value: 1200 },
    { timestamp: '04:00', value: 1500 },
    { timestamp: '08:00', value: 2400 },
    { timestamp: '12:00', value: 3100 },
    { timestamp: '16:00', value: 2900 },
    { timestamp: '20:00', value: 3800 },
    { timestamp: '24:00', value: 4200 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner Header */}
      <div
        style={{
          padding: '1.75rem 2rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))',
          border: '1px solid var(--aura-border-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>
            Welcome to AURA Bot Operations Platform
          </h2>
          <p style={{ color: 'var(--aura-text-secondary)', fontSize: '0.95rem' }}>
            Centralized orchestration, command library versioning, and real-time shard telemetry.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onOpenCreateBotModal} className="aura-btn aura-btn-primary">
            ➕ New Bot Instance
          </button>
          <button onClick={() => onNavigateTab('analytics')} className="aura-btn aura-btn-secondary">
            📈 View Telemetry
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="aura-grid-4">
        <MetricCard
          title="Active Bot Instances"
          value={`${onlineBots} / ${bots.length}`}
          change="Operational"
          changeType="positive"
          icon="🤖"
          subtitle="Sharded nodes"
        />
        <MetricCard
          title="Total Connected Guilds"
          value={totalServers.toLocaleString()}
          change="+8.4%"
          changeType="positive"
          icon="🌐"
          subtitle="Across 4 regions"
        />
        <MetricCard
          title="Total User Reach"
          value={totalUsers.toLocaleString()}
          change="+45,200"
          changeType="positive"
          icon="👥"
          subtitle="Active Discord users"
        />
        <MetricCard
          title="Cluster Health"
          value="99.98%"
          change="Optimal"
          changeType="positive"
          icon="🛡️"
          subtitle="18ms response latency"
        />
      </div>

      {/* Overview Analytics & Activity Stream */}
      <div className="aura-grid-2">
        {/* Real-time Activity Trend */}
        <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Overall Command Traffic</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--aura-text-muted)' }}>
                Aggregated command traffic volume today
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="aura-btn aura-btn-secondary aura-btn-sm"
            >
              Full Report
            </button>
          </div>
          <ChartCanvas data={mockOverviewActivity} color="#6366f1" type="area" height={210} />
        </div>

        {/* Live Event Stream */}
        <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Recent System Events</h3>
            <button
              onClick={() => onNavigateTab('settings')}
              className="aura-btn aura-btn-secondary aura-btn-sm"
            >
              Audit Logs
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.slice(0, 4).map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--aura-bg-glass)',
                  borderRadius: '8px',
                  border: '1px solid var(--aura-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Badge variant={item.type}>{item.type}</Badge>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--aura-text-muted)' }}>
                      {item.message}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--aura-text-muted)' }}>
                  {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Bot Instances */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}
        >
          <h3 style={{ fontSize: '1.25rem' }}>Primary Bot Clusters</h3>
          <button onClick={() => onNavigateTab('bots')} className="aura-btn aura-btn-secondary aura-btn-sm">
            View All Bots ({bots.length}) →
          </button>
        </div>

        <div className="aura-grid-2">
          {bots.slice(0, 2).map(bot => (
            <BotCard
              key={bot.id}
              bot={bot}
              onEdit={() => onNavigateTab('bots')}
              onToggleStatus={toggleStatus}
              onDelete={deleteBot}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
