import React from 'react';

export default function YoYHeader() {
  return (
    <div className="flex justify-between items-end flex-wrap gap-4">
      <div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Year-over-Year Analysis</h2>
        <p className="text-sm text-gray-500 font-medium">Compare your spending trends and category growth across multiple years.</p>
      </div>
    </div>
  );
}