import React, { useState, useEffect, useMemo } from 'react';
import { transactionService } from '../services/api';

import YoYHeader from '../components/dashboard-multi/YoYHeader';
import YoYSummaryCards from '../components/dashboard-multi/YoYSummaryCards';
import YoYBarChart from '../components/dashboard-multi/YoYBarChart';
import YoYCategoryTable from '../components/dashboard-multi/YoYCategoryTable';

export default function MultiYearDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await transactionService.getAllTransactions();
        setTransactions(data || []);
      } catch (err) {
        console.error("Failed to fetch all transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute YoY Aggregations
  const { years, totals, catTotals } = useMemo(() => {
    const yearSet = new Set();
    const annualTotals = {};
    const categoryTotals = {};

    transactions.forEach(t => {
      if (!t.transaction_date) return;
      
      const year = t.transaction_date.substring(0, 4);
      const amount = Number(t.amount) || 0;
      const cat = t.category || 'Uncategorized';

      yearSet.add(year);

      // Add to Annual Total
      annualTotals[year] = (annualTotals[year] || 0) + amount;

      // Add to Category Matrix
      if (!categoryTotals[cat]) categoryTotals[cat] = {};
      categoryTotals[cat][year] = (categoryTotals[cat][year] || 0) + amount;
    });

    // Sort years chronologically (e.g., 2024, 2025, 2026)
    const sortedYears = Array.from(yearSet).sort();

    return { years: sortedYears, totals: annualTotals, catTotals: categoryTotals };
  }, [transactions]);

  if (loading) {
    return <div className="flex justify-center py-20 text-gray-400 font-bold">Loading YoY analytics...</div>;
  }

  if (years.length === 0) {
    return <div className="text-center py-20 text-gray-400 font-bold">No transaction data available for analysis.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <YoYHeader />
      
      <YoYSummaryCards years={years} totals={totals} />
      
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <YoYBarChart years={years} totals={totals} />
      </div>

      <YoYCategoryTable years={years} catTotals={catTotals} />
    </div>
  );
}