import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Badge } from '../common/Badge';

interface NotificationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, clearAll } = useNotifications();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '75px',
        right: '2rem',
        width: '380px',
        maxHeight: '520px',
        background: 'var(--aura-bg-surface)',
        border: '1px solid var(--aura-border)',
        borderRadius: '16px',
        boxShadow: 'var(--aura-shadow-lg)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      role="dialog"
      aria-label="Notification Center"
    >
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--aura-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <h3 style={{ fontSize: '1rem' }}>Events & Alerts</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={clearAll}
            className="aura-btn aura-btn-secondary aura-btn-sm"
            style={{ fontSize: '0.75rem' }}
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="aura-btn aura-btn-secondary aura-btn-sm"
            aria-label="Close notifications"
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
        {notifications.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--aura-text-muted)',
              fontSize: '0.85rem'
            }}
          >
            No active notifications
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              style={{
                padding: '0.85rem',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                background: item.read ? 'transparent' : 'var(--aura-primary-light)',
                border: '1px solid var(--aura-border)',
                cursor: 'pointer',
                transition: 'var(--aura-transition)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.35rem'
                }}
              >
                <Badge variant={item.type}>{item.type}</Badge>
                <span style={{ fontSize: '0.7rem', color: 'var(--aura-text-muted)' }}>
                  {item.timestamp}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--aura-text-secondary)' }}>
                {item.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
