import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bot, CreateBotInput, UpdateBotInput } from '../types/bot';
import { BotService } from '../services/botService';
import { useNotifications } from './NotificationContext';

interface BotContextType {
  bots: Bot[];
  selectedBot: Bot | null;
  setSelectedBot: (bot: Bot | null) => void;
  createBot: (input: CreateBotInput) => Bot;
  updateBot: (id: string, updates: UpdateBotInput) => Bot;
  deleteBot: (id: string) => void;
  toggleStatus: (id: string) => void;
  refreshBots: () => void;
}

const BotContext = createContext<BotContextType | undefined>(undefined);

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const { addNotification } = useNotifications();

  const refreshBots = () => {
    const data = BotService.getBots();
    setBots(data);
    if (!selectedBot && data.length > 0) {
      setSelectedBot(data[0]);
    }
  };

  useEffect(() => {
    refreshBots();
  }, []);

  const handleCreateBot = (input: CreateBotInput): Bot => {
    const created = BotService.createBot(input);
    refreshBots();
    addNotification('Bot Created', `${created.name} was successfully initialized.`, 'success');
    return created;
  };

  const handleUpdateBot = (id: string, updates: UpdateBotInput): Bot => {
    const updated = BotService.updateBot(id, updates);
    refreshBots();
    if (selectedBot?.id === id) setSelectedBot(updated);
    addNotification('Bot Updated', `${updated.name} settings updated.`, 'info');
    return updated;
  };

  const handleDeleteBot = (id: string) => {
    const bot = bots.find(b => b.id === id);
    BotService.deleteBot(id);
    refreshBots();
    if (selectedBot?.id === id) {
      const remaining = bots.filter(b => b.id !== id);
      setSelectedBot(remaining.length > 0 ? remaining[0] : null);
    }
    addNotification('Bot Deleted', `${bot?.name || 'Bot'} was removed from catalog.`, 'warning');
  };

  const handleToggleStatus = (id: string) => {
    const updated = BotService.toggleBotStatus(id);
    refreshBots();
    if (selectedBot?.id === id) setSelectedBot(updated);
    addNotification(
      'Status Changed',
      `${updated.name} is now ${updated.status.toUpperCase()}`,
      updated.status === 'online' ? 'success' : 'warning'
    );
  };

  return (
    <BotContext.Provider
      value={{
        bots,
        selectedBot,
        setSelectedBot,
        createBot: handleCreateBot,
        updateBot: handleUpdateBot,
        deleteBot: handleDeleteBot,
        toggleStatus: handleToggleStatus,
        refreshBots
      }}
    >
      {children}
    </BotContext.Provider>
  );
};

export const useBots = () => {
  const context = useContext(BotContext);
  if (!context) throw new Error('useBots must be used within BotProvider');
  return context;
};
