"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  username: string;
  email: string;
  playerCode: string;
  avatar: string;
}

export interface PlayerStat {
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalPoints: number;
  rating: number;
}

interface AuthContextType {
  user: User | null;
  stats: PlayerStat | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  stats: null,
  token: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<PlayerStat | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = async (authToken?: string) => {
    try {
      const activeToken = authToken || localStorage.getItem("session_token");
      if (!activeToken) {
        setLoading(false);
        return;
      }

      setToken(activeToken);

      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setStats(data.stats);
        }
      } else {
        localStorage.removeItem("session_token");
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("session_token", newToken);
    setToken(newToken);
    setUser(newUser);
    fetchCurrentUser(newToken);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("session_token");
    setToken(null);
    setUser(null);
    setStats(null);
    router.push("/login");
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        token,
        loading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
