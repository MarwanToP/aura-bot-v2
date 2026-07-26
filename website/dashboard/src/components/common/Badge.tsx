import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'online' | 'offline' | 'idle' | 'maintenance' | 'dnd' | 'error';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', children }) => {
  return <span className={`aura-badge aura-badge-${variant}`}>{children}</span>;
};
