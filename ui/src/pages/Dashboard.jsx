import React, { useState } from 'react';
import { TrendingUp, LayoutDashboard, DollarSign, CloudUpload } from 'lucide-react';
import MonthlyExpenseChart from '../components/dashboard/MonthlyExpenseChart';
import MonthlyTransactionsTable from '../components/dashboard/MonthlyTransactionsTable'; // New Import

function StatCard({ title, value, subtext, icon: Icon, colorClass }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start transition-transform hover:scale-[1.02] cursor-default">
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

  return (
    <div className="space-y-8 pb-12">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Expense" 
          value="$23,450" 
          subtext="YTD Total" 
          icon={TrendingUp} 
          colorClass="bg-blue-600"
        />
        <StatCard 
          title="Highest Expense Month" 
          value="March – $4,500" 
          subtext="Peak spending" 
          icon={LayoutDashboard} 
          colorClass="bg-teal-500"
        />
        <StatCard 
          title="Average Monthly Spend" 
          value="$1,950" 
          subtext="Per month" 
          icon={DollarSign} 
          colorClass="bg-indigo-500"
        />
        <StatCard 
          title="Statements Uploaded" 
          value="5" 
          subtext="Total documents" 
          icon={CloudUpload} 
          colorClass="bg-emerald-500"
        />
      </div>

      {/* Chart Section */}
      <MonthlyExpenseChart 
        selectedMonth={selectedMonth} 
        onMonthSelect={setSelectedMonth} 
      />

      {/* Transactions Table Section */}
      <MonthlyTransactionsTable selectedMonth={selectedMonth} />
    </div>
  );
}