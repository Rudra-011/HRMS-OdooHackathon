import api from './api';

const salaryService = {
  getMySalary: async () => {
    const response = await api.get('/salary/my');
    return response.data;
  },

  getEmployeeSalary: async (employeeId) => {
    const response = await api.get(`/salary/${employeeId}`);
    return response.data;
  },

  upsertSalary: async (employeeId, data) => {
    const response = await api.post(`/salary/${employeeId}`, data);
    return response.data;
  },

  getAllSalaries: async () => {
    const response = await api.get('/salary');
    return response.data;
  }
};

export default salaryService;