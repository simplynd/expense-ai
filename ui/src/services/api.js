import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const dashboardService = {
  // 1. Get the 4 KPI numbers (Total, Highest Month, etc.)
  getSummary: async () => {
    const response = await apiClient.get('/dashboard/summary');
    return response.data;
  },

  // 2. Get the data for the Bar Chart
  getMonthlyExpenses: async () => {
    const response = await apiClient.get('/dashboard/monthly-expenses');
    return response.data;
  },

  // 3. Get transactions for a specific month
  getMonthTransactions: async (month) => {
    const response = await apiClient.get(`/dashboard/month/${month}/transactions`);
    return response.data;
  }
};

export default apiClient;