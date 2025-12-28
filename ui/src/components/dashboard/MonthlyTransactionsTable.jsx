import React from 'react';

export default function MonthlyTransactionsTable({ transactions = [], selectedMonth }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50">
        <h3 className="text-lg font-bold text-gray-800">
          Transactions – <span className="text-blue-600">{selectedMonth} 2025</span>
        </h3>
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
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{t.transaction_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold">
                    {/* {t.vendor_normalized || t.vendor_raw} */}
                    { t.vendor_raw}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      {t.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-blue-600">
                      ${t.amount?.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                  No transactions found for {selectedMonth}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}