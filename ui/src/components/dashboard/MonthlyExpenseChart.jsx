import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Temporary mock data based on your API spec
const data = [
  { month: 'Jan', amount: 1200 },
  { month: 'Feb', amount: 2100 },
  { month: 'Mar', amount: 4500 }, // Highest month
  { month: 'Apr', amount: 1800 },
  { month: 'May', amount: 2400 },
  { month: 'Jun', amount: 1700 },
  { month: 'Jul', amount: 2900 },
  { month: 'Aug', amount: 3100 },
  { month: 'Sep', amount: 1500 },
  { month: 'Oct', amount: 2200 },
  { month: 'Nov', amount: 1900 },
  { month: 'Dec', amount: 2400 },
];

export default function MonthlyExpenseChart({ onMonthSelect, selectedMonth }) {
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
          />
          <Tooltip 
            cursor={{ fill: '#F8FAFC' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Bar 
            dataKey="amount" 
            radius={[6, 6, 0, 0]} 
            onClick={(data) => onMonthSelect(data.month)}
            className="cursor-pointer"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.month === selectedMonth ? '#2563EB' : '#93C5FD'} 
                className="transition-all duration-300"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}