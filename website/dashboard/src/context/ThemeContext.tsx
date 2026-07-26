import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageAdapter } from '../services/storage';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => StorageAdapter.get('theme_mode', 'dark'));
  const [accentColor, setAccentState] = useState<string>(() => StorageAdapter.get('accent_color', '#6366f1'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    StorageAdapter.set('theme_mode', mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.style.setProperty('--aura-primary', accentColor);
    StorageAdapter.set('accent_color', accentColor);
  }, [accentColor]);

  const toggleTheme = () => {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setAccentColor = (color: string) => {
    setAccentState(color);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
