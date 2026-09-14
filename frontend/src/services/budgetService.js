import api from './api';

export const budgetService = {
  getAll: async (params = {}) => {
    const response = await api.get('/budgets', { params });
    return response.data;
  },

  getStatus: async (params = {}) => {
    const response = await api.get('/budgets/status', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/budgets', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/budgets/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
};
