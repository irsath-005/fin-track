import api from './api';

export const investmentService = {
  getAll: async (params = {}) => {
    const response = await api.get('/investments', { params });
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/investments/summary');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/investments/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/investments', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/investments/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/investments/${id}`);
    return response.data;
  },
};
