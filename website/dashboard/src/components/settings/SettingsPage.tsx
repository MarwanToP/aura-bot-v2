import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { StorageAdapter } from '../../services/storage';
import { useNotifications } from '../../context/NotificationContext';

export const SettingsPage: React.FC = () => {
  const { mode, toggleTheme, accentColor, setAccentColor } = useTheme();
  const { role, setRole } = useAuth();
  const { addNotification } = useNotifications();

  const [apiToken, setApiToken] = useState('aura_live_992817A4B109C4D3');
  const [showToken, setShowToken] = useState(false);

  const colors = [
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Sky', value: '#0ea5e9' }
  ];

  const handleExportData = () => {
    const data = {
      theme: { mode, accentColor },
      timestamp: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-dashboard-config-${Date.now()}.json`;
    a.click();
    addNotification('Backup Downloaded', 'Configuration exported to JSON.', 'success');
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all dashboard settings and local state to seed defaults?')) {
      StorageAdapter.clearAll();
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Platform Settings & RBAC</h2>
        <p style={{ color: 'var(--aura-text-muted)', fontSize: '0.9rem' }}>
          Personalize dashboard themes, API tokens, access permissions, and data persistence.
        </p>
      </div>

      <div className="aura-grid-2">
        {/* Appearance & Branding Customizer */}
        <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>🎨 Aesthetics & Theme Engine</h3>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Base Theme Mode
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={toggleTheme}
                className="aura-btn aura-btn-secondary"
                style={{ flex: 1, borderColor: mode === 'dark' ? 'var(--aura-primary)' : undefined }}
              >
                🌙 Dark Mode {mode === 'dark' && '(Active)'}
              </button>
              <button
                onClick={toggleTheme}
                className="aura-btn aura-btn-secondary"
                style={{ flex: 1, borderColor: mode === 'light' ? 'var(--aura-primary)' : undefined }}
              >
                ☀️ Light Mode {mode === 'light' && '(Active)'}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Primary Accent Color
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {colors.map(c => (
                <button
                  key={c.value}
                  onClick={() => setAccentColor(c.value)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: c.value,
                    border: accentColor === c.value ? '3px solid #ffffff' : 'none',
                    cursor: 'pointer',
                    boxShadow: accentColor === c.value ? '0 0 10px ' + c.value : 'none'
                  }}
                  title={c.label}
                  aria-label={`Set accent to ${c.label}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* API Tokens & Integration */}
        <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>🔑 API Gateway & Access Tokens</h3>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Master Management API Key
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type={showToken ? 'text' : 'password'}
                className="aura-input"
                value={apiToken}
                onChange={e => setApiToken(e.target.value)}
                readOnly
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="aura-btn aura-btn-secondary aura-btn-sm"
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--aura-text-muted)', marginTop: '0.35rem', display: 'block' }}>
              Used to authenticate REST/WebSocket clients to AURA core endpoints.
            </span>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--aura-border)' }}>
            <button
              onClick={() => {
                setApiToken(`aura_live_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
                addNotification('API Token Regenerated', 'Old token invalidated.', 'warning');
              }}
              className="aura-btn aura-btn-secondary aura-btn-sm"
            >
              🔄 Regenerate Secret Token
            </button>
          </div>
        </div>
      </div>

      {/* Role-Based Access Matrix & Data Export */}
      <div className="aura-grid-2">
        {/* RBAC Matrix */}
        <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>🛡️ Role-Based Access Control (RBAC)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--aura-text-secondary)' }}>
            Current active role: <strong style={{ color: 'var(--aura-primary)', textTransform: 'capitalize' }}>{role}</strong>
          </p>

          <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--aura-border)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0' }}>Permission</th>
                <th>Admin</th>
                <th>Moderator</th>
                <th>Viewer</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--aura-border)' }}>
                <td style={{ padding: '0.5rem 0' }}>View Metrics & Catalog</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--aura-border)' }}>
                <td style={{ padding: '0.5rem 0' }}>Edit Bot / Server Config</td>
                <td>✅</td>
                <td>✅</td>
                <td>❌</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--aura-border)' }}>
                <td style={{ padding: '0.5rem 0' }}>Delete Bot / Key Management</td>
                <td>✅</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Data Persistence & Export */}
        <div className="aura-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>💾 Backup & Data Export</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--aura-text-secondary)' }}>
            Export local state definitions to JSON backup file or restore default initial seeds.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
            <button onClick={handleExportData} className="aura-btn aura-btn-primary" style={{ flex: 1 }}>
              📥 Export JSON Config
            </button>
            <button onClick={handleResetDefaults} className="aura-btn aura-btn-danger" style={{ flex: 1 }}>
              ⚠️ Reset Local State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
