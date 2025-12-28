import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Helper to convert month names (Mar) to numbers (3) for your API
const monthToNum = (name) => {
  const months = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
  return months[name] || 1;
};

export const dashboardService = {
  // Matches your /dashboard/summary endpoint
  getSummary: async (year = 2025) => {
    const response = await apiClient.get(`/dashboard/summary?year=${year}`);
    return response.data;
  },

  // Matches your /dashboard/transactions/{year}/{month} endpoint
  getTransactionsByMonth: async (year, monthName) => {
    const monthNum = monthToNum(monthName);
    const response = await apiClient.get(`/dashboard/transactions/${year}/${monthNum}`);
    return response.data;
  }
};

export const statementService = {
  listStatements: () => apiClient.get('/statements/'),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/statements/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};