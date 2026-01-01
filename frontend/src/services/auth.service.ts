import api from './api';
import { AuthResponse } from '../types';

export const authService = {
  async register(data: {
    email: string;
    password: string;
    name: string;
    shopName: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

