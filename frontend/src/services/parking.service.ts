import api from './api';
import { DashboardStats, ParkingSession } from '../types';

export const parkingService = {
  async recordEntry(data: {
    vehicleNumber: string;
    imageUrl?: string;
    timestamp?: string;
  }) {
    const response = await api.post('/parking/entry', data);
    return response.data;
  },

  async recordExit(data: {
    vehicleNumber: string;
    imageUrl?: string;
    timestamp?: string;
  }) {
    const response = await api.post('/parking/exit', data);
    return response.data;
  },

  async calculateCharge(data: {
    sessionId: string;
    amount?: number;
    hourlyRate?: number;
  }) {
    const response = await api.post('/parking/calculate-charge', data);
    return response.data;
  },

  async sendReceipt(sessionId: string, recipientPhone: string) {
    const response = await api.post('/parking/send-receipt', {
      sessionId,
      recipientPhone,
    });
    return response.data;
  },

  async getDashboardStats(): Promise<{ success: boolean; data: DashboardStats }> {
    const response = await api.get('/parking/dashboard');
    return response.data;
  },

  async searchVehicles(query: string): Promise<{ success: boolean; data: ParkingSession[] }> {
    const response = await api.get(`/parking/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

