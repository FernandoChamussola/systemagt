import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, User } from '@/lib/api';

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ user: User }>;
  register: (nome: string, email: string, senha: string, telefone?: string) => Promise<{ codeSentTo: string }>;
  verifyRegistration: (email: string, codigo: string) => Promise<void>;
  resendRegistrationCode: (email: string) => Promise<{ codeSentTo: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUser() {
    try {
      const { user } = await authApi.me();
      setUser(user);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, senha: string) {
    const { user, token } = await authApi.login({ email, senha });
    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    return { user };
  }

  async function register(nome: string, email: string, senha: string, telefone?: string) {
    const response = await authApi.register({ nome, email, senha, telefone });
    return { codeSentTo: response.codeSentTo };
  }

  async function verifyRegistration(email: string, codigo: string) {
    const { user, token } = await authApi.verifyRegistration(email, codigo);
    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
  }

  async function resendRegistrationCode(email: string) {
    const response = await authApi.resendRegistrationCode(email);
    return { codeSentTo: response.codeSentTo };
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignora erros de logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyRegistration, resendRegistrationCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
