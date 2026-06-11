import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { User, UserRole } from '@/types';
import { api, User as ApiUser } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
  canAccess: (allowedRoles: UserRole[]) => boolean;
  isNationalLevel: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY = 'fepms_current_user';

function mapApiUserToType(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    fullName: apiUser.fullName,
    role: apiUser.role,
    province: apiUser.province,
    district: apiUser.district,
    isActive: apiUser.isActive,
    lastLogin: apiUser.lastLogin,
    createdAt: apiUser.createdAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check if we have tokens and fetch current user on mount
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const result = await api.getMe();
          if (result.success && result.data) {
            const mappedUser = mapApiUserToType(result.data);
            setUser(mappedUser);
            localStorage.setItem(AUTH_KEY, JSON.stringify(mappedUser));
          } else {
            setUser(null);
            localStorage.removeItem(AUTH_KEY);
          }
        } catch {
          setUser(null);
          localStorage.removeItem(AUTH_KEY);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    console.log('LOGIN ATTEMPT:', { email });
    
    const result = await api.login(email, password);
    if (result.success && result.data) {
      const mappedUser = mapApiUserToType(result.data.user);
      setUser(mappedUser);
      localStorage.setItem(AUTH_KEY, JSON.stringify(mappedUser));
      console.log('Login successful');
      return true;
    }

    console.log('Login failed');
    return false;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  const isAuthenticated = user !== null;

  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  const canAccess = useCallback((allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  }, [user]);

  const isNationalLevel = useMemo(() => {
    if (!user) return false;
    return user.province === null;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading, hasRole, canAccess, isNationalLevel }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
