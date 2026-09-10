import api from './api';

export const folderService = {
  async createFolder(name, parentFolder = null, color = '#3b82f6') {
    const response = await api.post('/folders', { name, parentFolder, color });
    return response.data;
  },

  async getFolders(parentFolder = null, all = false) {
    const response = await api.get('/folders', { params: { parentFolder, all } });
    return response.data;
  },

  async getBreadcrumbs(folderId) {
    const response = await api.get(`/folders/${folderId}/breadcrumbs`);
    return response.data;
  },

  async updateFolder(id, data) {
    const response = await api.put(`/folders/${id}`, data);
    return response.data;
  },

  async moveToTrash(id) {
    const response = await api.delete(`/folders/${id}`);
    return response.data;
  },
};
