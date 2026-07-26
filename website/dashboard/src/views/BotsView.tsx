import React, { useState } from 'react';
import { useBots } from '../context/BotContext';
import { BotCard } from '../components/bots/BotCard';
import { SearchInput } from '../components/common/SearchInput';
import { BotStatus, Bot } from '../types/bot';

interface BotsViewProps {
  onOpenCreateModal: () => void;
  onEditBot: (bot: Bot) => void;
}

export const BotsView: React.FC<BotsViewProps> = ({ onOpenCreateModal, onEditBot }) => {
  const { bots, toggleStatus, deleteBot } = useBots();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BotStatus | 'all'>('all');

  const filteredBots = bots.filter(b => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Bot Catalog & Fleet Management</h2>
          <p style={{ color: 'var(--aura-text-muted)', fontSize: '0.9rem' }}>
            Full lifecycle control (Create, Read, Update, Delete) for multi-tenant bot instances.
          </p>
        </div>

        <button onClick={onOpenCreateModal} className="aura-btn aura-btn-primary">
          ➕ Register New Bot
        </button>
      </div>

      {/* Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: '360px', width: '100%' }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by bot name, tag, or description..."
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {(['all', 'online', 'idle', 'maintenance', 'offline'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="aura-btn aura-btn-sm"
              style={{
                background: statusFilter === st ? 'var(--aura-primary)' : 'var(--aura-bg-glass)',
                color: statusFilter === st ? '#ffffff' : 'var(--aura-text-secondary)',
                border: '1px solid var(--aura-border)',
                textTransform: 'capitalize'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredBots.length === 0 ? (
        <div
          className="aura-card"
          style={{ textAlign: 'center', padding: '3rem', color: 'var(--aura-text-muted)' }}
        >
          No bots match the specified search query or status filter.
        </div>
      ) : (
        <div className="aura-grid-2">
          {filteredBots.map(bot => (
            <BotCard
              key={bot.id}
              bot={bot}
              onEdit={onEditBot}
              onToggleStatus={toggleStatus}
              onDelete={deleteBot}
            />
          ))}
        </div>
      )}
    </div>
  );
};
