import React, { useState } from 'react';
import { Server } from '../../types/server';
import { ServerService } from '../../services/serverService';
import { ServerCard } from './ServerCard';
import { SearchInput } from '../common/SearchInput';
import { useNotifications } from '../../context/NotificationContext';

export const ServerList: React.FC = () => {
  const [servers, setServers] = useState<Server[]>(() => ServerService.getServers());
  const [searchQuery, setSearchQuery] = useState('');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const { addNotification } = useNotifications();

  const handleUpdatePrefix = (id: string, newPrefix: string) => {
    const updated = ServerService.updateServerPrefix(id, newPrefix);
    setServers(ServerService.getServers());
    addNotification('Prefix Updated', `Server ${updated.name} prefix changed to '${newPrefix}'.`, 'success');
  };

  const filteredServers = ServerService.filterServers(searchQuery, premiumOnly);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Connected Guild Servers</h2>
          <p style={{ color: 'var(--aura-text-muted)', fontSize: '0.9rem' }}>
            Manage server subscriptions, active bot routing, and per-guild configuration settings.
          </p>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '360px', width: '100%' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by guild name or owner..."
            />
          </div>

          <label
            className="aura-card"
            style={{
              padding: '0.6rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={premiumOnly}
              onChange={e => setPremiumOnly(e.target.checked)}
              style={{ accentColor: 'var(--aura-primary)', width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>⭐ PRO Guilds Only</span>
          </label>
        </div>
      </div>

      {/* Grid */}
      {filteredServers.length === 0 ? (
        <div
          className="aura-card"
          style={{ textAlign: 'center', padding: '3rem', color: 'var(--aura-text-muted)' }}
        >
          No servers matching criteria.
        </div>
      ) : (
        <div className="aura-grid-2">
          {filteredServers.map(server => (
            <ServerCard key={server.id} server={server} onUpdatePrefix={handleUpdatePrefix} />
          ))}
        </div>
      )}
    </div>
  );
};
