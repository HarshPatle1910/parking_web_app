import React, { createContext, useContext, useState, useEffect } from 'react';
import { Owner } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  owner: Owner | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    shopName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedOwner = localStorage.getItem('owner');

    if (storedToken && storedOwner) {
      setToken(storedToken);
      setOwner(JSON.parse(storedOwner));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    if (response.success) {
      setOwner(response.data.owner);
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('owner', JSON.stringify(response.data.owner));
    } else {
      throw new Error('Login failed');
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    shopName: string;
    phone?: string;
  }) => {
    const response = await authService.register(data);
    if (response.success) {
      setOwner(response.data.owner);
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('owner', JSON.stringify(response.data.owner));
    } else {
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    setOwner(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('owner');
  };

  return (
    <AuthContext.Provider
      value={{
        owner,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!owner && !!token,
      }}
    >
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

