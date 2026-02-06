import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, getCurrentUser, refreshTokens, logoutUser } from "@/api";

type User = any | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const setTokens = (access: string, refresh?: string) => {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  };

  const clearTokens = () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  };

  const loadCurrentUser = async (accessToken: string) => {
    try {
      const data = await getCurrentUser(accessToken);
      setUser(data.user ?? data);
    } catch (err) {
      // try refresh flow
      const refresh = localStorage.getItem(REFRESH_KEY);
      if (refresh) {
        try {
          const newTokens = await refreshTokens(refresh);
          setTokens(newTokens.access_token, newTokens.refresh_token);
          const data = await getCurrentUser(newTokens.access_token);
          setUser(data.user ?? data);
        } catch (e) {
          clearTokens();
          setUser(null);
        }
      } else {
        clearTokens();
        setUser(null);
      }
    }
  };

  useEffect(() => {
    (async () => {
      const access = localStorage.getItem(ACCESS_KEY);
      if (access) {
        await loadCurrentUser(access);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await loginUser(email, password);
      if (res.access_token) {
        setTokens(res.access_token, res.refresh_token);
        setUser(res.user ?? null);
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const res = await registerUser(email, password);
      if (res.access_token) {
        setTokens(res.access_token, res.refresh_token);
        setUser(res.user ?? null);
        navigate("/");
      }
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const logout = async () => {
    const access = localStorage.getItem(ACCESS_KEY);
    try {
      if (access) await logoutUser(access);
    } catch (_) {
      // ignore
    }
    clearTokens();
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
