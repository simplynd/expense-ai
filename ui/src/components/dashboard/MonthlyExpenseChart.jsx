import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar } from 'lucide-react';

export default function MonthlyExpenseChart({ data, onMonthSelect, selectedMonth, selectedYear, onYearSelect }) {
  
  if (!data || data.length === 0) {
    return <div className="h-[400px] flex items-center justify-center bg-white rounded-2xl border border-gray-100 text-gray-400">Loading chart data...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Monthly Expenses</h3>
        
        {/* MOVED: Year Selector Dropdown */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          <Calendar size={14} className="text-gray-400" />
          <select 
            className="bg-transparent border-none text-xs font-bold text-gray-600 outline-none cursor-pointer"
            value={selectedYear}
            onChange={(e) => onYearSelect(parseInt(e.target.value))}
          >
            {[2022, 2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94A3B8', fontSize: 12 }} 
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            cursor={{ fill: '#F8FAFC' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Expense']}
          />
          <Bar 
            dataKey="amount" 
            radius={[6, 6, 0, 0]} 
            onClick={(clickedData) => onMonthSelect(clickedData.month)}
            className="cursor-pointer"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.month === selectedMonth ? '#2563EB' : '#93C5FD'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}