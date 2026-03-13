import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  loginUser,
  registerUser,
  getCurrentUser,
  refreshTokens,
  logoutUser,
  getSubscription,
} from "@/api";
import type { UsageSummary, PlanId, Subscription } from "@/types";

type User = any | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  // Subscription
  plan: PlanId;
  subscription: Subscription | null;
  usage: UsageSummary | null;
  refreshUsage: () => Promise<void>;
  // Auth
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // OAuth callback helper
  loadFromTokens: (access: string, refresh: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_KEY  = "access_token";
const REFRESH_KEY = "refresh_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]                 = useState<User>(null);
  const [loading, setLoading]           = useState(true);
  const [plan, setPlan]                 = useState<PlanId>("free");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage]               = useState<UsageSummary | null>(null);
  const navigate = useNavigate();

  const setTokens = (access: string, refresh?: string) => {
    if (access)  localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  };

  const clearTokens = () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  };

  const refreshUsage = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (!token) return;
    try {
      const data = await getSubscription(token);
      setSubscription(data.subscription);
      setPlan(data.subscription?.plan_id ?? "free");
      setUsage(data.usage);
    } catch (e) {
      console.warn("Could not refresh usage:", e);
    }
  }, []);

  const loadCurrentUser = async (accessToken: string) => {
    try {
      const data = await getCurrentUser(accessToken);
      setUser(data.user ?? data);
      await refreshUsage();
    } catch {
      const refresh = localStorage.getItem(REFRESH_KEY);
      if (refresh) {
        try {
          const newTokens = await refreshTokens(refresh);
          setTokens(newTokens.access_token, newTokens.refresh_token);
          const data = await getCurrentUser(newTokens.access_token);
          setUser(data.user ?? data);
          await refreshUsage();
        } catch {
          clearTokens();
          setUser(null);
        }
      } else {
        clearTokens();
        setUser(null);
      }
    }
  };

  // Used by AuthCallbackPage after OAuth redirect
  const loadFromTokens = async (access: string, refresh: string) => {
    setTokens(access, refresh);
    await loadCurrentUser(access);
  };

  useEffect(() => {
    (async () => {
      const access = localStorage.getItem(ACCESS_KEY);
      if (access) await loadCurrentUser(access);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password);
    if (res.access_token) {
      setTokens(res.access_token, res.refresh_token);
      setUser(res.user ?? null);
      await refreshUsage();
      navigate("/");
    }
  };

  const register = async (email: string, password: string) => {
    const res = await registerUser(email, password);
    if (res.access_token) {
      setTokens(res.access_token, res.refresh_token);
      setUser(res.user ?? null);
      await refreshUsage();
      navigate("/");
    }
  };

  const logout = async () => {
    const access = localStorage.getItem(ACCESS_KEY);
    try {
      if (access) await logoutUser(access);
    } catch (_) {}
    clearTokens();
    setUser(null);
    setSubscription(null);
    setPlan("free");
    setUsage(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        plan,
        subscription,
        usage,
        refreshUsage,
        login,
        register,
        logout,
        loadFromTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
