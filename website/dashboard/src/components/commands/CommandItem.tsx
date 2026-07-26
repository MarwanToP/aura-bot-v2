import React from 'react';
import { Command } from '../../types/command';
import { Badge } from '../common/Badge';

interface CommandItemProps {
  command: Command;
  onToggle: (id: string) => void;
}

export const CommandItem: React.FC<CommandItemProps> = ({ command, onToggle }) => {
  return (
    <div
      style={{
        padding: '1.25rem',
        background: 'var(--aura-bg-card)',
        border: '1px solid var(--aura-border)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        transition: 'var(--aura-transition)'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <code
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--aura-primary)',
              background: 'var(--aura-primary-light)',
              padding: '0.25rem 0.6rem',
              borderRadius: '6px'
            }}
          >
            /{command.name}
          </code>
          <Badge variant="info">{command.category}</Badge>
          <span style={{ fontSize: '0.75rem', color: 'var(--aura-text-muted)' }}>
            v{command.version}
          </span>
        </div>

        {/* Enable / Disable Toggle Switch */}
        <label
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          title={command.enabled ? 'Click to Disable' : 'Click to Enable'}
        >
          <input
            type="checkbox"
            checked={command.enabled}
            onChange={() => onToggle(command.id)}
            style={{ accentColor: 'var(--aura-primary)', width: '18px', height: '18px' }}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            {command.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.85rem', color: 'var(--aura-text-secondary)' }}>
        {command.description}
      </p>

      {/* Options/Parameters Schema */}
      {command.options.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
            padding: '0.5rem',
            background: 'var(--aura-bg-glass)',
            borderRadius: '6px'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--aura-text-muted)', fontWeight: 600 }}>
            Params:
          </span>
          {command.options.map((opt, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.75rem',
                color: 'var(--aura-text-primary)',
                background: 'var(--aura-bg-surface)',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                border: '1px solid var(--aura-border)'
              }}
            >
              [{opt.name}: <span style={{ color: 'var(--aura-primary)' }}>{opt.type}</span>]
              {opt.required && ' *'}
            </span>
          ))}
        </div>
      )}

      {/* Footer info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--aura-text-muted)',
          marginTop: 'auto'
        }}
      >
        <span>Usage Count: {command.usageCount.toLocaleString()} calls</span>
        <span>Cooldown: {command.cooldownSeconds}s</span>
      </div>
    </div>
  );
};
