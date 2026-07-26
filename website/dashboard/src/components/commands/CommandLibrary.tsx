import React, { useState } from 'react';
import { Command, CommandCategory } from '../../types/command';
import { CommandService } from '../../services/commandService';
import { CommandItem } from './CommandItem';
import { SearchInput } from '../common/SearchInput';

export const CommandLibrary: React.FC = () => {
  const [commands, setCommands] = useState<Command[]>(() => CommandService.getCommands());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CommandCategory | 'all'>('all');

  const categories: { id: CommandCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Commands' },
    { id: 'moderation', label: '🛡️ Moderation' },
    { id: 'ai', label: '🤖 AI Synthesis' },
    { id: 'music', label: '🎵 Music' },
    { id: 'utility', label: '⚡ Utility' },
    { id: 'economy', label: '💎 Economy' }
  ];

  const handleToggle = (id: string) => {
    CommandService.toggleCommand(id);
    setCommands(CommandService.getCommands());
  };

  const filteredCommands = CommandService.searchCommands(searchQuery, activeCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Command Library & Schema</h2>
          <p style={{ color: 'var(--aura-text-muted)', fontSize: '0.9rem' }}>
            Configure slash commands, permissions, cooldown rates, and API version tags.
          </p>
        </div>

        {/* Search & Categories Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ maxWidth: '360px', width: '100%' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search commands or descriptions..."
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {categories.map(cat => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="aura-btn aura-btn-sm"
                  style={{
                    background: isSelected ? 'var(--aura-primary)' : 'var(--aura-bg-glass)',
                    color: isSelected ? '#ffffff' : 'var(--aura-text-secondary)',
                    border: '1px solid var(--aura-border)'
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Commands Grid */}
      {filteredCommands.length === 0 ? (
        <div
          className="aura-card"
          style={{ textAlign: 'center', padding: '3rem', color: 'var(--aura-text-muted)' }}
        >
          No commands matching search criteria.
        </div>
      ) : (
        <div className="aura-grid-2">
          {filteredCommands.map(cmd => (
            <CommandItem key={cmd.id} command={cmd} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
};
