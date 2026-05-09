import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function LedgerTable({ currentData, sortConfig, handleSort }) {
  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronDown size={14} className="opacity-20 inline ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-blue-600 inline ml-1" />
      : <ChevronDown size={14} className="text-blue-600 inline ml-1" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead className="bg-gray-50/50 border-b border-gray-100">
          <tr className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors w-32" onClick={() => handleSort('transaction_date')}>
              Date <SortIcon column="transaction_date" />
            </th>
            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('vendor_normalized')}>
              Vendor <SortIcon column="vendor_normalized" />
            </th>
            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors w-48" onClick={() => handleSort('category')}>
              Category <SortIcon column="category" />
            </th>
            <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors w-32" onClick={() => handleSort('amount')}>
              Amount <SortIcon column="amount" />
            </th>
          </tr>
        </thead>
        <tbody>
          {currentData.length > 0 ? (
            currentData.map(t => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 text-sm text-gray-500 font-medium">{t.transaction_date || 'N/A'}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{t.vendor_normalized || t.vendor_raw}</div>
                  {t.vendor_normalized && t.vendor_raw !== t.vendor_normalized && (
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-sm">{t.vendor_raw}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-600 tracking-wider">
                    {t.category || 'Uncategorized'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-black text-gray-800">
                  ${t.amount?.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic font-medium">
                No transactions match your current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}