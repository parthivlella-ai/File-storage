import api from './api';

export const trashService = {
  async getTrashItems() {
    const response = await api.get('/trash');
    return response.data;
  },

  async restoreFile(id) {
    const response = await api.put(`/trash/files/${id}/restore`);
    return response.data;
  },

  async restoreFolder(id) {
    const response = await api.put(`/trash/folders/${id}/restore`);
    return response.data;
  },

  async permanentlyDeleteFile(id) {
    const response = await api.delete(`/trash/files/${id}`);
    return response.data;
  },

  async permanentlyDeleteFolder(id) {
    const response = await api.delete(`/trash/folders/${id}`);
    return response.data;
  },

  async emptyTrash() {
    const response = await api.delete('/trash/empty');
    return response.data;
  },
};
