import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const dashboardService = {
  getSummary: async (year = 2025) => {
    const response = await apiClient.get(`/dashboard/summary?year=${year}`);
    return response.data;
  },
  getTransactionsByMonth: async (year, monthName) => {
    const months = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
    const monthNum = months[monthName] || 1;
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
  },

  // Matches your NEW PUT /statements/{id}/filename endpoint
  updateFilename: async (id, newName) => {
    const response = await apiClient.put(`/statements/${id}/filename`, {
      filename: newName
    });
    return response.data;
  },

  // Matches your /transactions/statement/{id}/transactions endpoint
  getStatementTransactions: async (id) => {
    const response = await apiClient.get(`/transactions/statement/${id}/transactions`);
    // CRITICAL: We return response.data directly here
    return response.data;
  }
};

export default apiClient;