import api from './api';

export const incomeService = {
  getAll: async (params = {}) => {
    const response = await api.get('/income', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/income/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/income', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/income/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/income/${id}`);
    return response.data;
  },
};
