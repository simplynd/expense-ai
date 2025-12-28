import React, { useState } from 'react';
import { TrendingUp, LayoutDashboard, DollarSign, CloudUpload, Loader2 } from 'lucide-react';
import MonthlyExpenseChart from '../components/dashboard/MonthlyExpenseChart';
import MonthlyTransactionsTable from '../components/dashboard/MonthlyTransactionsTable';
import { useDashboard } from '../hooks/useDashboard';

function StatCard({ title, value, subtext, icon: Icon, colorClass }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start transition-transform hover:scale-[1.02]">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-xs text-gray-400 mt-1">{subtext}</p>
      </div>
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
        <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState('Nov'); // Default to Nov since you have data there
  const { summary, chartData, transactions, loading, error } = useDashboard(selectedMonth);

  if (loading) return <div className="h-96 flex items-center justify-center">Loading...</div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Updated KPI Row - 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Expense"
          value={`$${summary?.total_expense?.toFixed(2)}`}
          subtext="YTD Total"
          icon={TrendingUp}
          colorClass="bg-blue-600"
        />
        <StatCard
          title="Highest Month"
          value={`${summary?.highest_expense_month} – $${summary?.highest_expense_amount?.toFixed(2)}`}
          subtext="Peak spending"
          icon={LayoutDashboard}
          colorClass="bg-teal-500"
        />
        <StatCard
          title="Avg. Monthly Spend"
          value={`$${summary?.average_monthly_spend?.toFixed(2)}`}
          subtext="Per month"
          icon={DollarSign}
          colorClass="bg-indigo-500"
        />
      </div>

      <MonthlyExpenseChart
        data={chartData}
        selectedMonth={selectedMonth}
        onMonthSelect={setSelectedMonth}
      />

      {/* Passing the real transactions array from our hook */}
      <MonthlyTransactionsTable
        transactions={transactions}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}