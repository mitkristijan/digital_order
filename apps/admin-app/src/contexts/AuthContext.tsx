'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient';

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  avatar?: string | null;
  tenantId?: string;
  subdomain?: string;
  menuSlug?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  tenantId: string | null;
  /** Slug for customer menu URL: menuSlug or subdomain */
  menuSlug: string | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  refetchUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem('authUser', JSON.stringify(u));
    } else {
      localStorage.removeItem('authUser');
    }
  }, []);

  const refetchUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUserState(null);
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await apiClient.get('/auth/me');
      setUser(data);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUserState(null);
      setIsLoading(false);
      return;
    }
    const stored = localStorage.getItem('authUser');
    if (stored) {
      try {
        setUserState(JSON.parse(stored));
      } catch {
        // invalid stored data
      }
    }
    refetchUser();
  }, [refetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    setUserState(null);
    window.location.href = '/login';
  }, []);

  const tenantId = user?.tenantId ?? null;
  const menuSlug = user?.menuSlug ?? user?.subdomain ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        tenantId,
        menuSlug,
        isLoading,
        setUser,
        refetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
