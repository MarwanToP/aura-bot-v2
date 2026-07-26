import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { BotProvider, useBots } from './context/BotContext';
import { DashboardShell } from './components/layout/DashboardShell';
import { TabView } from './components/layout/Sidebar';

import { OverviewView } from './views/OverviewView';
import { BotsView } from './views/BotsView';
import { ServersView } from './views/ServersView';
import { CommandsView } from './views/CommandsView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';

import { BotModal } from './components/bots/BotModal';
import { Bot, CreateBotInput } from './types/bot';

import './styles/main.css';
import './styles/components.css';

const MainDashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [botToEdit, setBotToEdit] = useState<Bot | null>(null);

  const { createBot, updateBot } = useBots();

  const handleOpenCreateBot = () => {
    setBotToEdit(null);
    setIsBotModalOpen(true);
  };

  const handleOpenEditBot = (bot: Bot) => {
    setBotToEdit(bot);
    setIsBotModalOpen(true);
  };

  const handleSaveBot = (formData: CreateBotInput) => {
    if (botToEdit) {
      updateBot(botToEdit.id, formData);
    } else {
      createBot(formData);
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewView
            onNavigateTab={setActiveTab}
            onOpenCreateBotModal={handleOpenCreateBot}
          />
        );
      case 'bots':
        return (
          <BotsView
            onOpenCreateModal={handleOpenCreateBot}
            onEditBot={handleOpenEditBot}
          />
        );
      case 'servers':
        return <ServersView />;
      case 'commands':
        return <CommandsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView onNavigateTab={setActiveTab} onOpenCreateBotModal={handleOpenCreateBot} />;
    }
  };

  return (
    <DashboardShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderActiveView()}

      <BotModal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        onSave={handleSaveBot}
        botToEdit={botToEdit}
      />
    </DashboardShell>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BotProvider>
            <MainDashboardContent />
          </BotProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
