import api from './api';

export const statsService = {
  async getDashboardStats() {
    const response = await api.get('/stats/dashboard');
    return response.data;
  },
};
