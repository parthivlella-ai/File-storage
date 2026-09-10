import api from './api';

export const authService = {
  async register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data.token) {
      localStorage.setItem('securehub_token', response.data.token);
      localStorage.setItem('securehub_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('securehub_token', response.data.token);
      localStorage.setItem('securehub_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    if (response.data.user) {
      localStorage.setItem('securehub_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData);
    if (response.data.user) {
      localStorage.setItem('securehub_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  logout() {
    localStorage.removeItem('securehub_token');
    localStorage.removeItem('securehub_user');
  },

  getStoredUser() {
    try {
      const userStr = localStorage.getItem('securehub_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('securehub_token');
  },
};
