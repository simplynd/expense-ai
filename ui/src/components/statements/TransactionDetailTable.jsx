import React from 'react';
import { Loader2, Info } from 'lucide-react';

export default function TransactionDetailTable({ transactions = [], filename, isLoading }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <div>
          <h3 className="text-xl font-extrabold text-gray-800">
            Transactions: <span className="text-blue-600">{filename}</span>
          </h3>
          <p className="text-sm text-gray-400 mt-1">Parsed by AI from uploaded PDF</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-gray-400 block uppercase">Total Transactions</span>
          <span className="text-2xl font-black text-gray-900">{transactions.length}</span>
        </div>
      </div>
      
      <div className="max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10 shadow-sm">
            <tr className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Vendor</th>
              <th className="px-8 py-5">Category</th>
              <th className="px-8 py-5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              // Case 1: Still fetching
              <tr>
                <td colSpan="4" className="p-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-blue-300" size={32} />
                    <span className="text-gray-400 font-medium italic">Loading statement transactions...</span>
                  </div>
                </td>
              </tr>
            ) : transactions.length > 0 ? (
              // Case 2: Data available
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-8 py-5 text-sm text-gray-500 font-medium">{t.transaction_date || 'N/A'}</td>
                  <td className="px-8 py-5 text-sm font-bold text-gray-900">{t.vendor_normalized || t.vendor_raw}</td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 tracking-wider">
                      {t.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-blue-600">${t.amount?.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              // Case 3: Done loading, but array is empty
              <tr>
                <td colSpan="4" className="p-20 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Info size={24} />
                    <span>No transactions found for this statement.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}