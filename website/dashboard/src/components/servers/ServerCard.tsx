import React, { useState } from 'react';
import { Server } from '../../types/server';
import { Badge } from '../common/Badge';

interface ServerCardProps {
  server: Server;
  onUpdatePrefix: (id: string, prefix: string) => void;
}

export const ServerCard: React.FC<ServerCardProps> = ({ server, onUpdatePrefix }) => {
  const [editingPrefix, setEditingPrefix] = useState(false);
  const [prefixVal, setPrefixVal] = useState(server.prefix);

  const handleSavePrefix = () => {
    onUpdatePrefix(server.id, prefixVal);
    setEditingPrefix(false);
  };

  return (
    <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <img
            src={server.icon}
            alt={server.name}
            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem' }}>{server.name}</h3>
              {server.isPremium && <Badge variant="warning">⭐ PRO</Badge>}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--aura-text-muted)' }}>
              Owner: {server.ownerName} | Region: {server.region}
            </div>
          </div>
        </div>
      </div>

      {/* Member Stats & Prefix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          padding: '0.75rem',
          background: 'var(--aura-bg-glass)',
          borderRadius: '8px'
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--aura-text-muted)' }}>Members</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
            {server.memberCount.toLocaleString()}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--aura-text-muted)' }}>Custom Prefix</div>
          {editingPrefix ? (
            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
              <input
                type="text"
                className="aura-input"
                style={{ padding: '0.2rem 0.4rem', fontSize: '0.85rem' }}
                value={prefixVal}
                onChange={e => setPrefixVal(e.target.value)}
              />
              <button
                onClick={handleSavePrefix}
                className="aura-btn aura-btn-primary aura-btn-sm"
              >
                Save
              </button>
            </div>
          ) : (
            <div
              onClick={() => setEditingPrefix(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                fontWeight: 700,
                color: 'var(--aura-primary)'
              }}
              title="Click to change prefix"
            >
              <code>{server.prefix}</code>
              <span style={{ fontSize: '0.75rem', color: 'var(--aura-text-muted)' }}>✏️</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Bot Badges */}
      <div>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--aura-text-muted)',
            marginBottom: '0.4rem',
            fontWeight: 600
          }}
        >
          Assigned Bot Clusters:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {server.activeBots.map(botId => (
            <Badge key={botId} variant="info">
              🤖 {botId.replace('bot_', '')}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
