import React, { createContext, useContext, useState, useEffect } from 'react';
import { ManagerSession } from '../types';

interface AuthContextType {
  user: ManagerSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, phone: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'hh_auth_token_v5';
const USER_KEY = 'hh_auth_user_v5';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Synchronously restore remembered session from localStorage
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<ManagerSession | null>(() => {
    try {
      const rawUser = localStorage.getItem(USER_KEY);
      const rawToken = localStorage.getItem(TOKEN_KEY);
      if (rawUser && rawToken) {
        return JSON.parse(rawUser);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      // If session is already remembered in localStorage, do not block the UI
      return !localStorage.getItem(USER_KEY) && !!localStorage.getItem(TOKEN_KEY);
    } catch {
      return false;
    }
  });

  // Verify and refresh session with server in background
  useEffect(() => {
    let isMounted = true;

    async function checkServerSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/session', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && isMounted) {
            const freshUser: ManagerSession = {
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              loginTime: user?.loginTime || new Date().toISOString(),
              token: storedToken,
            };
            setUser(freshUser);
            setToken(storedToken);
            try {
              localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
            } catch {}
          }
        } else if (res.status === 401) {
          // Token strictly expired past 7 days or revoked
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        // Offline / cold boot fallback: keep current remembered session active
        console.warn('Session verification fallback (offline/cached):', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkServerSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, phone: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, password: pass }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid administrative credentials');
      }

      const receivedToken = data.token;
      const newUser: ManagerSession = {
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        loginTime: new Date().toISOString(),
        token: receivedToken,
      };

      try {
        localStorage.setItem(TOKEN_KEY, receivedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      } catch {}

      setToken(receivedToken);
      setUser(newUser);

      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const currentToken = token;
    try {
      if (currentToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      }
    } catch {}

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
