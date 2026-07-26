import React, { useState } from 'react';
import { Sidebar, TabView } from './Sidebar';
import { NavBar } from './NavBar';
import { NotificationsCenter } from './NotificationsCenter';

interface DashboardShellProps {
  activeTab: TabView;
  setActiveTab: (tab: TabView) => void;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  activeTab,
  setActiveTab,
  children
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--aura-bg-base)' }}>
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <NavBar onToggleNotifications={() => setNotificationsOpen(prev => !prev)} />
        <NotificationsCenter
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />

        <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
