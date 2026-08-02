"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  guilds: [],
  activeGuildId: null,
  activeGuild: null,
  setActiveGuildId: () => {},
  login: () => {},
  logout: () => {},
  refetchUser: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guilds, setGuilds] = useState([]);
  const [activeGuildId, setActiveGuildId] = useState(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated !== false && (data.id || data.user?.id)) {
          const userData = data.user || data;
          setUser(userData);
          setIsAuthenticated(true);
          const userGuilds = data.guilds || userData.guilds || [];
          setGuilds(userGuilds);
          if (userGuilds.length > 0 && !activeGuildId) {
            setActiveGuildId(userGuilds[0].id);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setGuilds([]);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setGuilds([]);
      }
    } catch (err) {
      console.warn("[AuthContext] Failed to fetch auth status:", err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = () => {
    window.location.href = "/auth/discord";
  };

  const logout = () => {
    window.location.href = "/auth/logout";
  };

  const activeGuild = guilds.find((g) => g.id === activeGuildId) || guilds[0] || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        guilds,
        activeGuildId,
        activeGuild,
        setActiveGuildId,
        login,
        logout,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
