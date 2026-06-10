import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { User, UserRole } from '@/types';
import { api, User as ApiUser } from '@/lib/api';


interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
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
    return null;
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
            api.clearTokens();
            localStorage.removeItem(AUTH_KEY);
          }
        } catch {
          setUser(null);
          api.clearTokens();
          localStorage.removeItem(AUTH_KEY);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    console.log('LOGIN ATTEMPT:', { email });

    try {
      const result = await api.login(email, password);
      console.log('LOGIN RESPONSE:', result);

      if (result.success && result.data) {
        const mappedUser = mapApiUserToType(result.data.user);
        setUser(mappedUser);
        localStorage.setItem(AUTH_KEY, JSON.stringify(mappedUser));
        console.log('Login successful (api)');
        return { success: true };
      }

      const message = result.message || result.error || 'Invalid credentials. Please try again.';
      console.error('Login failed:', message);
      return { success: false, message };
    } catch (err) {
      console.error('API login failed:', err);
      return { success: false, message: 'An error occurred while connecting to the server. Please check the backend URL and try again.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore logout errors for demo fallback
    }
    try {
      api.clearTokens();
    } catch {}
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

  // Idle session timeout (15 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: NodeJS.Timeout;
    const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 mins

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        alert('Your session has expired due to inactivity. Please log in again.');
      }, IDLE_TIMEOUT);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [isAuthenticated, logout]);

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
