import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';

const numToMonth = (num) => {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][num - 1];
};

export function useDashboard(selectedMonth) {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const data = await dashboardService.getSummary(2025);
        
        // 1. Create a full 12-month skeleton with 0 expenses
        const fullYear = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => ({
          month: numToMonth(m),
          amount: 0
        }));

        // 2. Overwrite the months we actually have data for
        data.monthly_expenses.forEach(item => {
          const index = item.month - 1;
          fullYear[index].amount = item.expense;
        });
        setChartData(fullYear);

        // 3. Find the highest amount from the API data
        const highestItem = data.monthly_expenses.find(m => m.month === data.highest_expense_month);
        const highestAmount = highestItem ? highestItem.expense : 0;

        setSummary({
          total_expense: data.total_expense,
          highest_expense_month: numToMonth(data.highest_expense_month),
          highest_expense_amount: highestAmount, // Set the real amount here
          average_monthly_spend: data.total_expense / 12 // Simple average over year
        });

      } catch (err) {
        setError("Could not connect to Backend");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  useEffect(() => {
    async function fetchTable() {
      if (!selectedMonth) return;
      try {
        const data = await dashboardService.getTransactionsByMonth(2025, selectedMonth);
        setTransactions(data);
      } catch (err) {
        console.error("Table fetch failed", err);
      }
    }
    fetchTable();
  }, [selectedMonth]);

  return { summary, chartData, transactions, loading, error };
}