import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  apiClient,
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
  onForceLogout,
} from '../services/apiClient';
import type { User, AuthResponse } from '../types';

// ========================
// Context shape
// ========================
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true while restoring session on app start
  role: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<string>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ========================
// Provider
// ========================
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  const clearAuth = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  // Subscribe to force-logout events (e.g. refresh token expired)
  useEffect(() => {
    const unsub = onForceLogout(() => clearAuth());
    return () => { unsub(); };
  }, [clearAuth]);

  // Restore session on mount
  useEffect(() => {
    mounted.current = true;
    const restore = async () => {
      const rt = getRefreshToken();
      if (!rt) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await apiClient.post<AuthResponse>('/api/v1/auth/refresh', { refreshToken: rt }, { skipAuth: true });
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        if (mounted.current) {
          setUser(data.user);
        }
      } catch {
        clearTokens();
      } finally {
        if (mounted.current) setIsLoading(false);
      }
    };
    restore();
    return () => { mounted.current = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.post<AuthResponse>(
      '/api/v1/auth/login',
      { email, password },
      { skipAuth: true },
    );
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    await apiClient.post('/api/v1/auth/signup', { name, email, password }, { skipAuth: true });
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const forgotPassword = useCallback(async (email: string) => {
    const msg = await apiClient.post<string>('/api/v1/auth/forgot-password', { email }, { skipAuth: true });
    return msg;
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    await apiClient.post('/api/v1/auth/verify-otp', { email, otp }, { skipAuth: true });
  }, []);

  const resetPassword = useCallback(async (email: string, otp: string, newPassword: string) => {
    await apiClient.post('/api/v1/auth/reset-password', { email, otp, newPassword }, { skipAuth: true });
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    role: user?.role ?? null,
    login,
    signup,
    logout,
    forgotPassword,
    verifyOtp,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ========================
// Hook
// ========================
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
