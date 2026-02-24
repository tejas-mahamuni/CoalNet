import axios from 'axios';

const API_URL = '/api';

// Type definitions
interface EmissionData {
  mineId: string;
  date: string;
  fuel_used: number;
  electricity_used: number;
  explosives_used: number;
  transport_fuel_used: number;
}

interface DashboardFilters {
  mineName?: string;
  period?: string;
}

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

  post: async (endpoint: string, data: unknown) => {
    try {
      const response = await axios.post(`${API_URL}/${endpoint}`, data);
      return response.data;
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  },

  // New method for adding an emission record
  addEmission: async (data: EmissionData) => {
    return await api.post('emissions', data);
  },

  // Method for fetching dashboard data
  getDashboard: async (filters: DashboardFilters) => {
    return await api.get('dashboard', filters);
  },

  // Method for fetching all mines
  getMines: async () => {
    return await api.get('mines');
  },

  // Method for fetching emissions data for a specific mine
  getMineEmissions: async (mineId: string) => {
    return await api.get(`emissions/${mineId}`);
  },

  // Method for exporting mine emissions data as CSV
  exportMineEmissions: async (mineId: string) => {
    try {
      const response = await axios.get(`${API_URL}/export/${mineId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Export ${mineId} error:`, error);
      throw error;
    }
  },

  // Method for triggering migration
  runMigration: async () => {
    return await api.post('migrate', {});
  },

  // Method for uploading CSV file
  uploadCSV: async (file: File, mineId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mineId', mineId);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Upload CSV error:', error);
      throw error;
    }
  },

  // Method for getting visualization data
  getVisualizationData: async (mineId: string) => {
    return await api.get(`visualization/${mineId}`);
  },

  // Method for generating ARIMA forecast (calls ML service via backend)
  generateForecast: async (mineId: string, horizon: number = 7) => {
    return await api.post(`forecast/${mineId}`, { horizon });
  },

  // Method for fetching cached forecast
  getForecast: async (mineId: string, horizon: number = 7) => {
    return await api.get(`forecast/${mineId}`, { horizon });
  },

  // Method for fetching forecast intelligence insights
  getForecastInsights: async (mineId: string, horizon: number = 7) => {
    return await api.get(`forecast/insights/${mineId}`, { horizon });
  },

  // Method for multi-mine forecast comparison
  compareMineForecasts: async (mineIds: string[], horizon: number = 7) => {
    return await api.post('forecast/compare', { mineIds, horizon });
  },

  // Method for fetching report data
  getForecastReport: async (mineId: string, horizon: number = 7) => {
    return await api.get(`forecast/report/${mineId}`, { horizon });
  },

  // Method for fetching AQI data for a mine
  getAqi: async (mineId: string) => {
    return await api.get(`aqi/${mineId}`);
  },

  // Method for fetching home page stats
  getHomeStats: async () => {
    return await api.get('home-stats');
  },
};
