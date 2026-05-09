import React from 'react';

export default function LedgerHeader({ recordCount, totalAmount }) {
  return (
    <div className="flex justify-between items-end flex-wrap gap-4">
      <div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Master Ledger</h2>
        <p className="text-sm text-gray-500 font-medium">Search, filter, and analyze all historical transactions.</p>
      </div>
      
      <div className="flex gap-8 text-right bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Records</span>
          <span className="text-2xl font-black text-gray-800 leading-none">{recordCount}</span>
        </div>
        <div className="w-px bg-gray-100"></div>
        <div>
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Total Amount</span>
          <span className="text-2xl font-black text-blue-600 leading-none">
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}