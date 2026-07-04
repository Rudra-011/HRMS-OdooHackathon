import api from './api';

const employeeService = {
  getAll: async (params = {}) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },
  deactivate: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },
  uploadAvatar: async (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`/employees/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  uploadDocument: async (id, file, documentName) => {
    const formData = new FormData();
    formData.append('document', file);
    if (documentName) {
      formData.append('documentName', documentName);
    }
    const response = await api.post(`/employees/${id}/document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default employeeService;