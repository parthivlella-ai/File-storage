import api from './api';

export const adminService = {
  async getSystemStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  async getAllUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async toggleUserBlock(userId) {
    const response = await api.put(`/admin/users/${userId}/toggle-block`);
    return response.data;
  },

  async updateUserQuota(userId, storageLimitGB) {
    const response = await api.put(`/admin/users/${userId}/quota`, { storageLimitGB });
    return response.data;
  },

  async getAllFilesMetadata(params = {}) {
    const response = await api.get('/admin/files', { params });
    return response.data;
  },
};
