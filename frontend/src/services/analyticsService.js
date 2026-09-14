import api from './api';

export const analyticsService = {
  getDashboardSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  getMonthlyAnalytics: async (year) => {
    const response = await api.get('/analytics/monthly', { params: { year } });
    return response.data;
  },

  getCategoryAnalytics: async (month, year) => {
    const response = await api.get('/analytics/categories', { params: { month, year } });
    return response.data;
  },

  getYearlyAnalytics: async (year) => {
    const response = await api.get('/analytics/yearly', { params: { year } });
    return response.data;
  },

  getInsights: async () => {
    const response = await api.get('/analytics/insights');
    return response.data;
  },
};
