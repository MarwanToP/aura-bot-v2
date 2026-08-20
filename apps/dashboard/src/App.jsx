"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import OverviewCanvas from './components/OverviewCanvas.jsx';
import ModerationCanvas from './components/ModerationCanvas.jsx';
import SecurityCanvas from './components/SecurityCanvas.jsx';
import TicketsCanvas from './components/TicketsCanvas.jsx';
import TempVoiceCanvas from './components/TempVoiceCanvas.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [guildConfig, setGuildConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial full module configuration for active guild
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/guilds/123456789012345678/full-config');
        if (res.ok) {
          const data = await res.json();
          setGuildConfig(data.modules);
        }
      } catch (err) {
        console.error('Failed to load dashboard configuration:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <OverviewCanvas config={guildConfig?.overview} />;
      case 'moderation':
      case 'auto_moderation':
        return <ModerationCanvas config={guildConfig?.security} />;
      case 'security':
      case 'anti_nuke':
        return <SecurityCanvas config={guildConfig?.security} />;
      case 'tickets':
        return <TicketsCanvas config={guildConfig?.tickets} />;
      case 'voice':
        return <TempVoiceCanvas config={guildConfig?.tempVoice} />;
      default:
        return <OverviewCanvas config={guildConfig?.overview} />;
    }
  };

  return (
    <div className="flex bg-cosmic-bg text-white min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-purple-400">
              <span className="animate-spin text-3xl">🌀</span>
            </div>
          ) : (
            renderActiveTab()
          )}
        </div>
      </div>
    </div>
  );
}
