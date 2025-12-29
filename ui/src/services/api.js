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

  updateFilename: async (id, newName) => {
    const response = await apiClient.put(`/statements/${id}/filename`, {
      filename: newName
    });
    return response.data;
  },

  getStatementTransactions: async (id) => {
    const response = await apiClient.get(`/transactions/statement/${id}/transactions`);
    return response.data;
  },

  // NEW: Create a bucket for manual entries (Adjunct Outlays)
  createManualStatement: async (filename) => {
    const response = await apiClient.post('/statements/manual', { filename });
    return response.data;
  },

};

// --- ADDED THIS SECTION ---
export const transactionService = {
  // Get all available categories
  getCategories: async () => {
    const response = await apiClient.get('/transactions/categories');
    return response.data;
  },

  // Bulk assign category
  // payload: { transaction_ids: [1, 2, 3], category_name: "Food" }
  assignCategory: async (payload) => {
    const response = await apiClient.post('/transactions/assign-category', payload);
    return response.data;
  },

  // NEW: Create a manual record
  addManualTransaction: async (payload) => {
    const response = await apiClient.post('/transactions/manual', payload);
    return response.data;
  },

  // NEW: Update a manual record
  updateManualTransaction: async (id, payload) => {
    const response = await apiClient.put(`/transactions/${id}`, payload);
    return response.data;
  },

  // NEW: Delete a manual record
  deleteTransaction: async (id) => {
    const response = await apiClient.delete(`/transactions/${id}`);
    return response.data;
  },
  
};
// ---------------------------

export default apiClient;