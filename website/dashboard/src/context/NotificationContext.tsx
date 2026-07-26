import React, { createContext, useContext, useState } from 'react';
import { NotificationItem, NotificationType } from '../types/notification';
import { INITIAL_NOTIFICATIONS } from '../services/mockData';
import { StorageAdapter } from '../services/storage';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: NotificationType) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    StorageAdapter.get('notifications_list', INITIAL_NOTIFICATIONS)
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (title: string, message: string, type: NotificationType = 'info') => {
    const item: NotificationItem = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      timestamp: 'Just now',
      read: false
    };
    const updated = [item, ...notifications];
    setNotifications(updated);
    StorageAdapter.set('notifications_list', updated);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    StorageAdapter.set('notifications_list', updated);
  };

  const clearAll = () => {
    setNotifications([]);
    StorageAdapter.set('notifications_list', []);
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
