import axios from 'axios';

const API_URL = '/api';

export const api = {
  get: async (endpoint: string, params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/${endpoint}`, { params });
      return response.data;
    } catch (error) {
      console.error(`GET ${endpoint} error:`, error);
      throw error;
    }
  },
  
  post: async (endpoint: string, data: any) => {
    try {
      const response = await axios.post(`${API_URL}/${endpoint}`, data);
      return response.data;
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  },

  // New method for adding an emission record
  addEmission: async (data: any) => {
    return await api.post('emissions', data);
  },

  // Method for fetching dashboard data
  getDashboard: async (filters: any) => {
    return await api.get('dashboard', filters);
  },

  // Method for fetching all mines
  getMines: async () => {
    return await api.get('mines');
  }
};