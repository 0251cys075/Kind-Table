import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (data: Partial<UserProfile> & { password: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>;
  demoLogin: (role: 'donor' | 'ngo' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('kindtable_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem('kindtable_user', JSON.stringify(user));
      } catch {
        // ignore
      }
    } else {
      localStorage.removeItem('kindtable_user');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Login failed.' };
      }
      setUser(data.user);
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Could not connect to server.' };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: Partial<UserProfile> & { password: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, message: resData.message || 'Signup failed.' };
      }
      setUser(resData.user);
      return { success: true, message: resData.message };
    } catch {
      return { success: false, message: 'Could not connect to server.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kindtable_user');
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return { success: false, message: 'Not logged in.' };
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({ userId: user.id, ...data }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, message: resData.message || 'Profile update failed.' };
      }
      setUser(resData.user);
      return { success: true, message: resData.message };
    } catch {
      return { success: false, message: 'Could not connect to server.' };
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: 'donor' | 'ngo' | 'admin') => {
    const creds = {
      donor: { email: 'donor@kindtable.org', password: 'password123' },
      ngo: { email: 'ngo@kindtable.org', password: 'password123' },
      admin: { email: 'admin@kindtable.org', password: 'password123' },
    };
    await login(creds[role].email, creds[role].password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
