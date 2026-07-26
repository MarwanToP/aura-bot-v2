import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { UserRole } from '../../types/user';

interface NavBarProps {
  onToggleNotifications: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({ onToggleNotifications }) => {
  const { user, role, setRole } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <header
      style={{
        height: '70px',
        background: 'var(--aura-bg-surface)',
        borderBottom: '1px solid var(--aura-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 9
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Management Dashboard</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* RBAC Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--aura-text-muted)', fontWeight: 600 }}>Role:</span>
          <select
            value={role}
            onChange={e => setRole(e.target.value as UserRole)}
            className="aura-input"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', width: 'auto' }}
            aria-label="Select User Role"
          >
            <option value="admin">👑 Admin</option>
            <option value="moderator">🛡️ Moderator</option>
            <option value="developer">💻 Developer</option>
            <option value="viewer">👁️ Viewer</option>
          </select>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="aura-btn aura-btn-secondary aura-btn-sm"
          title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme Mode"
        >
          {mode === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onToggleNotifications}
          className="aura-btn aura-btn-secondary aura-btn-sm"
          style={{ position: 'relative' }}
          aria-label="Open Notifications Center"
        >
          🔔
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--aura-danger)',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '0.65rem',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Info */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img
              src={user.avatar}
              alt={user.displayName}
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--aura-primary)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--aura-text-primary)' }}>
                {user.displayName}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--aura-text-muted)', textTransform: 'capitalize' }}>
                {user.role}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
