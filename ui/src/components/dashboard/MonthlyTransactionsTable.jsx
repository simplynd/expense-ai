import React, { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';

export default function MonthlyTransactionsTable({ transactions = [], selectedMonth, selectedYear }) {
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Derive unique categories from the current month's transactions
  const uniqueCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category || 'Uncategorized'));
    return ['All', ...Array.from(cats)].sort();
  }, [transactions]);

  // Apply the filter
  const filteredTransactions = useMemo(() => {
    if (categoryFilter === 'All') return transactions;
    return transactions.filter(t => (t.category || 'Uncategorized') === categoryFilter);
  }, [transactions, categoryFilter]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-lg font-bold text-gray-800">
          Transactions – <span className="text-blue-600">{selectedMonth} {selectedYear}</span>
        </h3>
        
        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          <Filter size={14} className="text-gray-400" />
          <select 
            className="bg-transparent border-none text-xs font-bold text-gray-600 outline-none cursor-pointer"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Vendor</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{t.transaction_date}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">
                        {t.vendor_normalized || t.vendor_raw}
                      </span>
                      {t.vendor_normalized && (
                        <span className="text-[10px] font-medium text-gray-400 mt-0.5 truncate max-w-[200px]" title={t.vendor_raw}>
                          {t.vendor_raw}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-widest">
                      {t.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-gray-900">
                      ${t.amount?.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                  No {categoryFilter !== 'All' ? `'${categoryFilter}'` : ''} transactions found for this month.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}