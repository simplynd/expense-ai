import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// We removed the "const data = [...]" from here so it doesn't conflict
export default function MonthlyExpenseChart({ data, onMonthSelect, selectedMonth }) {
  
  // Safety check: if data isn't loaded yet, show a placeholder
  if (!data || data.length === 0) {
    return <div className="h-[400px] flex items-center justify-center bg-white rounded-2xl border border-gray-100 text-gray-400">Loading chart data...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Monthly Expenses</h3>
        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
          Year 2025
        </span>
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
              <Cell 
                key={`cell-${index}`} 
                fill={entry.month === selectedMonth ? '#2563EB' : '#93C5FD'} 
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}