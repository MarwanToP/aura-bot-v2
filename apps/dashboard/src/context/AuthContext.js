"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        }
      })
      .catch(() => {});
  }, []);

  const login = () => {
    window.location.href = "/api/auth/login";
  };

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      setUser(null);
      setIsAuthenticated(false);
      window.location.reload();
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
