import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';

export function useDashboard(selectedMonth) {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        // Fetch Summary and Chart data at once
        const [summaryData, monthlyData] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getMonthlyExpenses()
        ]);
        setSummary(summaryData);
        setChartData(monthlyData);
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // This effect runs every time the user clicks a different month
  useEffect(() => {
    async function loadTransactions() {
      if (!selectedMonth) return;
      try {
        const data = await dashboardService.getMonthTransactions(selectedMonth);
        setTransactions(data);
      } catch (err) {
        console.error("Error fetching transactions", err);
      }
    }
    loadTransactions();
  }, [selectedMonth]);

  return { summary, chartData, transactions, loading, error };
}