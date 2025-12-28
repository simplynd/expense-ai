import React from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function TransactionTriageTable({ 
  transactions, 
  loading, 
  searchTerm, 
  setSearchTerm, 
  selectedIds, 
  onToggleSelect, 
  onSelectAll 
}) {
  
  // Fix for Bug 1: Calculate if "Select All" should be checked
  // It's checked only if there are transactions and EVERY filtered transaction is in selectedIds
  const isAllSelected = transactions.length > 0 && transactions.every(t => selectedIds.includes(t.id));

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-50 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-sm font-bold placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            placeholder="Search by vendor (e.g. 'Amazon')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {selectedIds.length > 0 && (
          <div className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest animate-in fade-in zoom-in">
            {selectedIds.length} Selected
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
              <th className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-blue-600 cursor-pointer"
                  checked={isAllSelected} // Controlled: depends on data
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-6 py-4">Transaction Details</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
            ) : transactions.length > 0 ? (
              transactions.map(t => (
                <tr 
                  key={t.id} 
                  className={`group cursor-pointer transition-colors ${selectedIds.includes(t.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
                  onClick={() => onToggleSelect(t.id)}
                >
                  <td className="px-6 py-5 text-center">
                    {/* Fix for Bug 2: checkbox now correctly toggles via the row click logic */}
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 cursor-pointer" 
                      checked={selectedIds.includes(t.id)}
                      // stopPropagation prevents the click from firing twice (once for input, once for row)
                      onClick={(e) => e.stopPropagation()} 
                      onChange={() => onToggleSelect(t.id)}
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">{t.vendor_raw || t.vendor_normalized}</span>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{t.transaction_date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      t.category ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {t.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-gray-900">
                    ${t.amount?.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="py-20 text-center text-gray-400 italic">No results found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}