'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  totpEnabled: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('[AUTH] No token found');
        setUser(null);
        return;
      }

      console.log('[AUTH] Checking authentication with stored token');
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[AUTH] Auth check successful, user:', data.admin?.email);
        setUser(data.admin);
      } else {
        console.log('[AUTH] Auth check failed with status:', response.status);
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } catch (error) {
      console.error('[AUTH] Auth check failed:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, totpCode?: string) => {
    try {
      console.log('[AUTH] Attempting login for:', email);
      
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, totp_code: totpCode })
      });

      console.log('[AUTH] Login response status:', response.status);
      
      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('[AUTH] Failed to parse response as JSON:', parseErr);
        throw new Error('Server response was not valid JSON');
      }

      console.log('[AUTH] Login response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      console.log('[AUTH] Login successful, storing token');
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}