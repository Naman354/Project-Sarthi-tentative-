"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setAccessToken } from "../lib/api";
import type { User, AuthResponseData, ApiResponse } from "../types/auth";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applyAuth = useCallback((newUser: User | null, token: string | null) => {
    setUser(newUser);
    setTokenState(token);
    setAccessToken(token);
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const newToken = await api.attemptSilentRefresh();
      if (!newToken) {
        applyAuth(null, null);
        return false;
      }

      // Fetch user profile with new access token
      const profileRes = await api.get<{ user: User }>("/auth/me");
      if (profileRes.success && profileRes.data?.user) {
        applyAuth(profileRes.data.user, newToken);
        return true;
      }

      applyAuth(null, null);
      return false;
    } catch {
      applyAuth(null, null);
      return false;
    }
  }, [applyAuth]);

  // Initial silent authentication check on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await refreshSession();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [refreshSession]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.post<AuthResponseData>("/auth/login", { email, password });
      if (res.success && res.data) {
        applyAuth(res.data.user, res.data.accessToken);
        return { success: true };
      }
      return { success: false, error: res.message || "Failed to log in" };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unexpected error during login",
      };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.post<AuthResponseData>("/auth/register", { name, email, password });
      if (res.success && res.data) {
        applyAuth(res.data.user, res.data.accessToken);
        return { success: true };
      }
      return { success: false, error: res.message || "Failed to create account" };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unexpected error during registration",
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post<ApiResponse>("/auth/logout");
    } finally {
      applyAuth(null, null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
