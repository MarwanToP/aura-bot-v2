import React, { useState, useEffect } from 'react';
import { Bot, CreateBotInput } from '../../types/bot';
import { Modal } from '../common/Modal';

interface BotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateBotInput) => void;
  botToEdit?: Bot | null;
}

export const BotModal: React.FC<BotModalProps> = ({ isOpen, onClose, onSave, botToEdit }) => {
  const [formData, setFormData] = useState<CreateBotInput>({
    name: '',
    tag: '#0001',
    description: '',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80',
    status: 'online',
    serversCount: 1,
    usersCount: 10,
    shards: 1,
    prefix: '!',
    version: '1.0.0',
    tags: ['AI', 'Moderation'],
    ownerId: 'usr_admin_01',
    apiTokenMasked: 'aura_token_••••••••',
    features: {
      moderation: true,
      music: false,
      ai: true,
      tickets: false,
      economy: false,
      logging: true
    }
  });

  useEffect(() => {
    if (botToEdit) {
      setFormData({
        name: botToEdit.name,
        tag: botToEdit.tag,
        description: botToEdit.description,
        avatar: botToEdit.avatar,
        status: botToEdit.status,
        serversCount: botToEdit.serversCount,
        usersCount: botToEdit.usersCount,
        shards: botToEdit.shards,
        prefix: botToEdit.prefix,
        version: botToEdit.version,
        tags: botToEdit.tags,
        ownerId: botToEdit.ownerId,
        apiTokenMasked: botToEdit.apiTokenMasked,
        features: botToEdit.features
      });
    } else {
      setFormData({
        name: '',
        tag: `#${Math.floor(1000 + Math.random() * 9000)}`,
        description: '',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80',
        status: 'online',
        serversCount: 1,
        usersCount: 100,
        shards: 1,
        prefix: '!',
        version: '1.0.0',
        tags: ['Custom Bot'],
        ownerId: 'usr_admin_01',
        apiTokenMasked: 'aura_token_••••••••',
        features: {
          moderation: true,
          music: false,
          ai: false,
          tickets: false,
          economy: false,
          logging: true
        }
      });
    }
  }, [botToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={botToEdit ? `Edit Bot: ${botToEdit.name}` : 'Create New Bot Instance'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
            Bot Name
          </label>
          <input
            type="text"
            className="aura-input"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. AURA Sentinel"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Command Prefix
            </label>
            <input
              type="text"
              className="aura-input"
              value={formData.prefix}
              onChange={e => setFormData({ ...formData, prefix: e.target.value })}
              placeholder="e.g. !"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Version Tag
            </label>
            <input
              type="text"
              className="aura-input"
              value={formData.version}
              onChange={e => setFormData({ ...formData, version: e.target.value })}
              placeholder="e.g. 1.0.0"
              required
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
            Description
          </label>
          <textarea
            className="aura-input"
            rows={3}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief overview of bot capabilities and modules..."
          />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
            Avatar Image URL
          </label>
          <input
            type="text"
            className="aura-input"
            value={formData.avatar}
            onChange={e => setFormData({ ...formData, avatar: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" onClick={onClose} className="aura-btn aura-btn-secondary">
            Cancel
          </button>
          <button type="submit" className="aura-btn aura-btn-primary">
            {botToEdit ? 'Update Bot' : 'Create Bot'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
