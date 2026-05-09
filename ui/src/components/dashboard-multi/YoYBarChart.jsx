import React from 'react';

export default function YoYBarChart({ years, totals }) {
  if (years.length === 0) return null;

  const maxTotal = Math.max(...Object.values(totals), 1);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-8">Annual Spending Overview</h3>
      
      {/* FIX: Changed to items-stretch so the columns actually take up the full 64 height */}
      <div className="flex items-stretch gap-4 h-64 mt-4">
        {years.map(year => {
          const amount = totals[year] || 0;
          const heightPercent = (amount / maxTotal) * 100;
          
          return (
            /* FIX: Added h-full and justify-end to anchor the content to the bottom */
            <div key={year} className="flex-1 flex flex-col justify-end items-center gap-3 group h-full">
              
              <span className="text-xs font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                ${(amount / 1000).toFixed(1)}k
              </span>
              
              {/* FIX: Replaced style={{ height: '100%' }} with flex-1. This forces the bar track to consume all vertical space between the tooltip and the year label! */}
              <div className="w-full max-w-[80px] bg-blue-50 rounded-t-xl relative overflow-hidden flex items-end justify-center transition-all group-hover:bg-blue-100 flex-1">
                <div 
                  className="w-full bg-blue-500 rounded-t-xl transition-all duration-1000 ease-out" 
                  style={{ height: `${heightPercent}%` }}
                ></div>
              </div>
              
              <span className="text-sm font-black text-gray-700">{year}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}