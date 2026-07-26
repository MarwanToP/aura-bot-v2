import React from 'react';
import { Bot } from '../../types/bot';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

interface BotCardProps {
  bot: Bot;
  onEdit: (bot: Bot) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export const BotCard: React.FC<BotCardProps> = ({ bot, onEdit, onToggleStatus, onDelete }) => {
  const { hasPermission } = useAuth();
  const canDelete = hasPermission('DELETE_BOT');

  return (
    <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Bot Top Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <img
            src={bot.avatar}
            alt={bot.name}
            style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>{bot.name}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--aura-text-muted)' }}>{bot.tag}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--aura-text-muted)', marginTop: '2px' }}>
              Prefix: <code style={{ color: 'var(--aura-primary)', fontWeight: 700 }}>{bot.prefix}</code> | v{bot.version}
            </div>
          </div>
        </div>
        <Badge variant={bot.status}>{bot.status}</Badge>
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.85rem', color: 'var(--aura-text-secondary)', lineHeight: 1.5 }}>
        {bot.description}
      </p>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          padding: '0.75rem',
          background: 'var(--aura-bg-glass)',
          borderRadius: '8px',
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--aura-text-muted)' }}>Guilds</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{bot.serversCount.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--aura-text-muted)' }}>Users</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{bot.usersCount.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--aura-text-muted)' }}>Latency</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--aura-success)' }}>
            {bot.latencyMs}ms
          </div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {bot.tags.map((tag, i) => (
          <span
            key={i}
            style={{
              fontSize: '0.7rem',
              padding: '0.2rem 0.5rem',
              background: 'var(--aura-bg-surface)',
              borderRadius: '4px',
              color: 'var(--aura-text-secondary)',
              border: '1px solid var(--aura-border)'
            }}
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--aura-border)'
        }}
      >
        <button
          onClick={() => onToggleStatus(bot.id)}
          className="aura-btn aura-btn-secondary aura-btn-sm"
        >
          {bot.status === 'online' ? '⏸️ Pause' : '▶️ Activate'}
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onEdit(bot)}
            className="aura-btn aura-btn-secondary aura-btn-sm"
          >
            ✏️ Edit
          </button>
          {canDelete && (
            <button
              onClick={() => onDelete(bot.id)}
              className="aura-btn aura-btn-danger aura-btn-sm"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
