import React, { useState, useEffect } from 'react';
import { AnalyticsService } from '../../services/analyticsService';
import { AnalyticsData } from '../../types/analytics';
import { MetricCard } from '../common/MetricCard';
import { ChartCanvas } from '../common/ChartCanvas';

export const AnalyticsPanel: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>(() => AnalyticsService.getAnalytics());
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    const interval = setInterval(() => {
      setData(AnalyticsService.refreshMetrics());
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Telemetry & Real-Time Analytics</h2>
          <p style={{ color: 'var(--aura-text-muted)', fontSize: '0.9rem' }}>
            Cluster latency, command execution volumes, category trends, and server growth telemetry.
          </p>
        </div>

        {/* Timeframe selector */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--aura-bg-glass)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--aura-border)' }}>
          {(['24h', '7d', '30d'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className="aura-btn aura-btn-sm"
              style={{
                background: timeframe === tf ? 'var(--aura-primary)' : 'transparent',
                color: timeframe === tf ? '#fff' : 'var(--aura-text-secondary)'
              }}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="aura-grid-4">
        <MetricCard
          title="Cluster Uptime"
          value={`${data.uptimePercentage}%`}
          change="+0.02%"
          changeType="positive"
          icon="⚡"
          subtitle="Last 30 Days"
        />
        <MetricCard
          title="Avg Latency"
          value={`${data.averageLatencyMs}ms`}
          change="-2ms"
          changeType="positive"
          icon="📡"
          subtitle="Ping to API gateway"
        />
        <MetricCard
          title="Total Commands"
          value={data.totalCommandsExecuted.toLocaleString()}
          change="+14.2%"
          changeType="positive"
          icon="🤖"
          subtitle="Executed this month"
        />
        <MetricCard
          title="Active Guilds"
          value={data.activeServersCount.toLocaleString()}
          change="+120"
          changeType="positive"
          icon="🌐"
          subtitle="Connected clusters"
        />
      </div>

      {/* Charts Grid */}
      <div className="aura-grid-2">
        {/* Latency History Chart */}
        <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>API Gateway Latency (ms)</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--aura-text-muted)' }}>
              Real-time response ping across cluster shards
            </span>
          </div>
          <ChartCanvas data={data.latencyHistory} color="#10b981" type="area" height={200} />
        </div>

        {/* Command Volume Chart */}
        <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Daily Command Executions</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--aura-text-muted)' }}>
              Weekly usage distribution trends
            </span>
          </div>
          <ChartCanvas data={data.commandUsageHistory} color="#6366f1" type="bar" height={200} />
        </div>
      </div>

      {/* Category Breakdown & Leaderboard */}
      <div className="aura-grid-2">
        {/* Category Breakdown */}
        <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Module Usage Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {data.categoryDistribution.map((cat, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600 }}>{cat.category}</span>
                  <span style={{ color: 'var(--aura-text-muted)' }}>
                    {cat.count.toLocaleString()} ({cat.percentage}%)
                  </span>
                </div>
                <div
                  style={{
                    height: '8px',
                    width: '100%',
                    background: 'var(--aura-bg-glass)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${cat.percentage}%`,
                      background: 'var(--aura-primary)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Commands Leaderboard */}
        <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Top Executed Commands</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.topCommands.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem',
                  background: 'var(--aura-bg-glass)',
                  borderRadius: '8px',
                  border: '1px solid var(--aura-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      fontWeight: 800,
                      color: 'var(--aura-primary)',
                      fontSize: '0.9rem',
                      width: '20px'
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <code style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.command}</code>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--aura-text-secondary)' }}>
                  {item.calls.toLocaleString()} calls
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
