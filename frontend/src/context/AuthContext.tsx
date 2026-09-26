import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient, AuthSession } from '../services/apiClient';
import { backendApi, BackendUser } from '../services/backendApi';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Inventory Manager' | 'Warehouse Staff' | 'Administrator';
  avatar?: string;
  rawRole: 'MANAGER' | 'STAFF' | string;
}

export interface UserPermissions {
  canCreateProduct: boolean;
  canEditProduct: boolean;
  canDeleteProduct: boolean;
  canValidateReceipt: boolean;
  canValidateDelivery: boolean;
  canValidateTransfer: boolean;
  canApplyAdjustment: boolean;
  canManageWarehouses: boolean;
  canManageLocations: boolean;
  canManageCategories: boolean;
  canManageReorderRules: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  serverOnline: boolean;
  permissions: UserPermissions;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  loadCurrentUser: () => Promise<void>;
}

const defaultPermissions: UserPermissions = {
  canCreateProduct: false,
  canEditProduct: false,
  canDeleteProduct: false,
  canValidateReceipt: false,
  canValidateDelivery: false,
  canValidateTransfer: false,
  canApplyAdjustment: false,
  canManageWarehouses: false,
  canManageLocations: false,
  canManageCategories: false,
  canManageReorderRules: false,
};

function computePermissions(role: string): UserPermissions {
  const isManager = role.toUpperCase() === 'MANAGER' || role === 'Inventory Manager' || role === 'Administrator';
  return {
    canCreateProduct: isManager,
    canEditProduct: isManager,
    canDeleteProduct: isManager,
    canValidateReceipt: true, // both manager and staff can process receipts
    canValidateDelivery: true, // both manager and staff can process deliveries
    canValidateTransfer: true,
    canApplyAdjustment: isManager, // only manager can reconcile discrepancies
    canManageWarehouses: isManager,
    canManageLocations: isManager,
    canManageCategories: isManager,
    canManageReorderRules: isManager,
  };
}

function mapRoleToUi(rawRole: string): UserProfile['role'] {
  const normalized = rawRole.toUpperCase();
  if (normalized === 'MANAGER' || normalized === 'ADMIN') return 'Inventory Manager';
  return 'Warehouse Staff';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverOnline, setServerOnline] = useState<boolean>(true);

  const permissions = user ? computePermissions(user.rawRole) : defaultPermissions;

  const handleSetSession = (session: AuthSession) => {
    apiClient.setSession(session);
    setAccessToken(session.accessToken);
    const uiUser: UserProfile = {
      id: session.user.id.toString(),
      name: session.user.name,
      email: session.user.email,
      role: mapRoleToUi(session.user.role),
      rawRole: session.user.role,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
    };
    setUser(uiUser);
  };

  const loadCurrentUser = useCallback(async () => {
    try {
      const session = apiClient.getSession();
      if (!session || !session.accessToken) {
        setUser(null);
        setAccessToken(null);
        setIsLoading(false);
        return;
      }

      setAccessToken(session.accessToken);

      // Verify token with backend /auth/me
      try {
        const me: BackendUser = await backendApi.auth.getMe();
        const profile: UserProfile = {
          id: me.id.toString(),
          name: me.name,
          email: me.email,
          role: mapRoleToUi(me.role),
          rawRole: me.role,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
        };
        setUser(profile);
      } catch (err: any) {
        // If 401, refresh token logic in apiClient already tried or cleared
        if (err.status === 401) {
          apiClient.clearSession();
          setUser(null);
          setAccessToken(null);
        } else {
          // If offline, maintain cached session for seamless demo experience
          const cached = session.user;
          setUser({
            id: cached.id.toString(),
            name: cached.name,
            email: cached.email,
            role: mapRoleToUi(cached.role),
            rawRole: cached.role,
            avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const session = await backendApi.auth.login({ email, password });
      handleSetSession(session);
      return {
        id: session.user.id.toString(),
        name: session.user.name,
        email: session.user.email,
        role: mapRoleToUi(session.user.role),
        rawRole: session.user.role,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = apiClient.getRefreshToken();
    try {
      if (refreshToken) {
        await backendApi.auth.logout(refreshToken);
      }
    } catch {
      // ignore logout errors
    } finally {
      apiClient.clearSession();
      setUser(null);
      setAccessToken(null);
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    const refreshToken = apiClient.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const newSession = await backendApi.auth.refresh(refreshToken);
      handleSetSession(newSession);
      return true;
    } catch {
      apiClient.clearSession();
      setUser(null);
      setAccessToken(null);
      return false;
    }
  };

  useEffect(() => {
    loadCurrentUser();
    const unsub = apiClient.subscribeConnectionChange((online) => setServerOnline(online));
    return unsub;
  }, [loadCurrentUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        serverOnline,
        permissions,
        login,
        logout,
        refreshSession,
        loadCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
