import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'positive',
  icon,
  subtitle
}) => {
  return (
    <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--aura-text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
          {title}
        </span>
        <div
          style={{
            padding: '0.5rem',
            borderRadius: '8px',
            background: 'var(--aura-primary-light)',
            color: 'var(--aura-primary)'
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--aura-text-primary)' }}>
        {value}
      </div>
      {(change || subtitle) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          {change && (
            <span
              style={{
                color:
                  changeType === 'positive'
                    ? 'var(--aura-success)'
                    : changeType === 'negative'
                    ? 'var(--aura-danger)'
                    : 'var(--aura-text-muted)',
                fontWeight: 600
              }}
            >
              {change}
            </span>
          )}
          {subtitle && <span style={{ color: 'var(--aura-text-muted)' }}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
