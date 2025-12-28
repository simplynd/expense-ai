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
  const [selectedMonth, setSelectedMonth] = useState('Mar');
  const { summary, chartData, transactions, loading, error } = useDashboard(selectedMonth);

  // If the API is still thinking, show a loading spinner
  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-gray-500 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-medium">Fetching financial data...</p>
      </div>
    );
  }

  // If the server is down or returns an error
  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-center">
        {error}. Please ensure your backend server is running at http://127.0.0.1:8000
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* KPI Row - Using Real Data from Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Expense" 
          value={`$${summary?.total_expense?.toLocaleString()}`} 
          subtext="YTD Total" 
          icon={TrendingUp} 
          colorClass="bg-blue-600"
        />
        <StatCard 
          title="Highest Month" 
          value={`${summary?.highest_expense_month} – $${summary?.highest_expense_amount?.toLocaleString()}`} 
          subtext="Peak spending" 
          icon={LayoutDashboard} 
          colorClass="bg-teal-500"
        />
        <StatCard 
          title="Avg. Monthly Spend" 
          value={`$${summary?.average_monthly_spend?.toLocaleString()}`} 
          subtext="Per month" 
          icon={DollarSign} 
          colorClass="bg-indigo-500"
        />
        <StatCard 
          title="Statements" 
          value={summary?.statements_uploaded} 
          subtext="Total uploaded" 
          icon={CloudUpload} 
          colorClass="bg-emerald-500"
        />
      </div>

      {/* Chart Section - Passing real chartData */}
      <MonthlyExpenseChart 
        data={chartData}
        selectedMonth={selectedMonth} 
        onMonthSelect={setSelectedMonth} 
      />

      {/* Table Section - Passing real transactions */}
      <MonthlyTransactionsTable 
        transactions={transactions}
        selectedMonth={selectedMonth} 
      />
    </div>
  );
}