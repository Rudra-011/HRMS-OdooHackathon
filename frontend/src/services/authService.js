import api from './api';

const authService = {
  signUp: async (data) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },
  signIn: async (data) => {
    const response = await api.post('/auth/signin', data);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  changePassword: async (data) => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  },
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },
  getPendingRegistrations: async () => {
    const response = await api.get('/auth/pending-registrations');
    return response.data;
  },
  updateRegistrationStatus: async (id, data) => {
    const response = await api.put(`/auth/registration/${id}/status`, data);
    return response.data;
  }
};

export default authService;