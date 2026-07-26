import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types/user';
import { INITIAL_USER } from '../services/mockData';
import { StorageAdapter } from '../services/storage';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => StorageAdapter.get('auth_user', INITIAL_USER));

  const setRole = (newRole: UserRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    StorageAdapter.set('auth_user', updated);
  };

  const login = (email: string) => {
    const newUser: User = {
      ...INITIAL_USER,
      email
    };
    setUser(newUser);
    StorageAdapter.set('auth_user', newUser);
  };

  const logout = () => {
    setUser(null);
    StorageAdapter.remove('auth_user');
  };

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'moderator' && perm !== 'DELETE_BOT' && perm !== 'MANAGE_KEYS') return true;
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'viewer',
        setRole,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
