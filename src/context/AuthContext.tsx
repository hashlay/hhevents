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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<ManagerSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore & verify session against server
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
            setUser({
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              loginTime: new Date().toISOString(),
              token: storedToken,
            });
            setToken(storedToken);
          }
        } else {
          // Token invalid or expired on server
          localStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        // Fallback: If offline or during cold boot, preserve session if token exists
        console.warn('Session verification fallback:', err);
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
      try {
        localStorage.setItem(TOKEN_KEY, receivedToken);
      } catch {}

      setToken(receivedToken);
      setUser({
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        loginTime: new Date().toISOString(),
        token: receivedToken,
      });

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
