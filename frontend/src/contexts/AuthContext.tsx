"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface AuthUser {
  id: string;
  pseudonym: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/auth/me`, {
        withCredentials: true,
      });
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async () => {
    const { data } = await axios.post(
      `${API}/api/auth/session`,
      {},
      { withCredentials: true }
    );
    setUser(data);
  };

  const logout = async () => {
    await axios.post(`${API}/api/auth/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
