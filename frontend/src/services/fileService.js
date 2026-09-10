import api, { API_BASE_URL } from './api';

export const fileService = {
  async uploadFiles(files, folderId = null, onUploadProgress = null) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    if (folderId && folderId !== 'root') {
      formData.append('folderId', folderId);
    }

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  async getFiles(params = {}) {
    const response = await api.get('/files', { params });
    return response.data;
  },

  async searchFiles(q, category = 'all') {
    const response = await api.get('/files/search', { params: { q, category } });
    return response.data;
  },

  async getFileById(id) {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },

  async updateFile(id, data) {
    const response = await api.put(`/files/${id}`, data);
    return response.data;
  },

  async moveToTrash(id) {
    const response = await api.delete(`/files/${id}`);
    return response.data;
  },

  async batchActions(action, fileIds, folderId = null) {
    const response = await api.post('/files/batch', { action, fileIds, folderId });
    return response.data;
  },

  getDownloadUrl(id, shareToken = null) {
    const token = localStorage.getItem('securehub_token');
    const base = `${API_BASE_URL}/files/${id}/download`;
    const params = new URLSearchParams();
    if (shareToken) params.append('shareToken', shareToken);
    else if (token) params.append('token', token);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  },

  getPreviewUrl(id, shareToken = null) {
    const token = localStorage.getItem('securehub_token');
    const base = `${API_BASE_URL}/files/${id}/preview`;
    const params = new URLSearchParams();
    if (shareToken) params.append('shareToken', shareToken);
    else if (token) params.append('token', token);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  },
};
