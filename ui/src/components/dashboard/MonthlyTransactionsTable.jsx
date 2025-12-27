import React from 'react';
import { Plus, Minus, ShoppingCart, Car, Zap, Utensils } from 'lucide-react';

// Sample data that looks like your API response
const mockTransactions = [
  { id: 101, date: '2025-03-15', vendor: 'Amazon', category: 'Shopping', type: 'Credit', amount: 150.50, color: 'bg-blue-100 text-blue-700' },
  { id: 102, date: '2025-03-12', vendor: 'Indian Frootland', category: 'Groceries', type: 'Debit', amount: 26.50, color: 'bg-green-100 text-green-700' },
  { id: 103, date: '2025-03-10', vendor: 'Shell Gas', category: 'Transport', type: 'Debit', amount: 85.00, color: 'bg-purple-100 text-purple-700' },
  { id: 104, date: '2025-03-05', vendor: 'Netflix', category: 'Entertainment', type: 'Subscription', amount: 19.99, color: 'bg-gray-100 text-gray-700' },
];

export default function MonthlyTransactionsTable({ selectedMonth }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Header Area */}
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Monthly Transactions – <span className="text-blue-600">{selectedMonth} 2025</span>
          </h3>
          <p className="text-sm text-gray-400 mt-1">Detailed breakdown of your spending</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-blue-100">
            <Plus size={18} />
          </button>
          <button className="p-2 hover:bg-gray-50 text-gray-400 rounded-lg transition-colors border border-gray-100">
            <Minus size={18} />
          </button>
        </div>
      </div>

      {/* Actual Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mockTransactions.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">{item.date}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-bold">{item.vendor}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.color}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 font-medium">{item.type}</td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-bold text-blue-600">${item.amount.toFixed(2)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Empty State Footer (Visible if no month selected) */}
      {!selectedMonth && (
        <div className="p-12 text-center text-gray-400">
          Select a month from the chart to view transactions
        </div>
      )}
    </div>
  );
}