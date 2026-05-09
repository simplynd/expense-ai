import React from 'react';

export default function SavingsHeader() {
  return (
    <div className="flex justify-between items-end flex-wrap gap-4">
      <div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Net Savings Ledger</h2>
        <p className="text-sm text-gray-500 font-medium">Input your Notice of Assessment (NOA) details to track true net savings.</p>
      </div>
    </div>
  );
}