import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';

const numToMonth = (num) => {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][num - 1];
};

export function useDashboard(selectedYear, selectedMonth) {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const data = await dashboardService.getSummary(selectedYear); // Using dynamic year
        
        const fullYear = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => ({
          month: numToMonth(m),
          amount: 0
        }));

        data.monthly_expenses.forEach(item => {
          const index = item.month - 1;
          fullYear[index].amount = item.expense;
        });
        setChartData(fullYear);

        const highestItem = data.monthly_expenses.find(m => m.month === data.highest_expense_month);
        const highestAmount = highestItem ? highestItem.expense : 0;

        setSummary({
          total_expense: data.total_expense,
          highest_expense_month: numToMonth(data.highest_expense_month),
          highest_expense_amount: highestAmount,
          average_monthly_spend: data.total_expense / 12
        });

      } catch (err) {
        setError("Could not connect to Backend");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [selectedYear]); // Re-run when year changes

  useEffect(() => {
    async function fetchTable() {
      if (!selectedMonth) return;
      try {
        const data = await dashboardService.getTransactionsByMonth(selectedYear, selectedMonth); // Using dynamic year
        setTransactions(data);
      } catch (err) {
        setTransactions([]);
      }
    }
    fetchTable();
  }, [selectedYear, selectedMonth]); // Re-run when year or month changes

  return { summary, chartData, transactions, loading, error };
}