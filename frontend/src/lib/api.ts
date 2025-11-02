// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const api = {
  // Dashboard
  getDashboard: async (filters?: { mineId?: string; mineName?: string; period?: string; startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (filters?.mineId) params.append('mineId', filters.mineId);
    if (filters?.mineName) params.append('mineName', filters.mineName);
    if (filters?.period) params.append('period', filters.period);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE_URL}/dashboard?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    return response.json();
  },

  // Mines
  getMines: async () => {
    const response = await fetch(`${API_BASE_URL}/mines`);
    if (!response.ok) throw new Error('Failed to fetch mines');
    return response.json();
  },

  // Health check
  getHealth: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Failed to fetch health status');
    return response.json();
  },

  // Data
  getData: async () => {
    const response = await fetch(`${API_BASE_URL}/data`);
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
  }
};

