import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function YoYSummaryCards({ years, totals }) {
  // Local state to hold the user's selected years
  const [primaryYear, setPrimaryYear] = useState('');
  const [comparisonYear, setComparisonYear] = useState('');

  // Auto-select the two most recent years when the data first loads
  useEffect(() => {
    if (years.length > 0) {
      setPrimaryYear(years[years.length - 1]);
      setComparisonYear(years.length > 1 ? years[years.length - 2] : years[0]);
    }
  }, [years]);

  if (years.length === 0 || !primaryYear || !comparisonYear) return null;

  const currentTotal = totals[primaryYear] || 0;
  const previousTotal = totals[comparisonYear] || 0;

  // Calculate percentage change
  let percentChange = 0;
  if (previousTotal > 0) {
    percentChange = ((currentTotal - previousTotal) / previousTotal) * 100;
  }

  const isIncrease = percentChange > 0;
  const isDecrease = percentChange < 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Primary Year Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2">
          <select 
            className="text-[11px] font-black text-gray-700 uppercase tracking-widest bg-gray-100 hover:bg-gray-200 border-none rounded-lg px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 transition-colors"
            value={primaryYear}
            onChange={(e) => setPrimaryYear(e.target.value)}
          >
            {years.map(y => <option key={`primary-${y}`} value={y}>{y} Total</option>)}
          </select>
          <span className="text-[10px] text-gray-400 font-bold uppercase">Primary</span>
        </div>
        <span className="text-3xl font-black text-gray-800">
          ${currentTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Comparison Year Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2">
          <select 
            className="text-[11px] font-black text-gray-700 uppercase tracking-widest bg-gray-100 hover:bg-gray-200 border-none rounded-lg px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 transition-colors"
            value={comparisonYear}
            onChange={(e) => setComparisonYear(e.target.value)}
          >
            {years.map(y => <option key={`comp-${y}`} value={y}>{y} Total</option>)}
          </select>
          <span className="text-[10px] text-gray-400 font-bold uppercase">Comparison</span>
        </div>
        <span className="text-3xl font-black text-gray-500">
          ${previousTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* YoY Change Card */}
      <div className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-center ${
        isDecrease ? 'bg-emerald-50 border-emerald-100' : 
        isIncrease ? 'bg-red-50 border-red-100' : 
        'bg-gray-50 border-gray-100'
      }`}>
        <span className={`text-[11px] font-black uppercase tracking-widest block mb-2 ${
           isDecrease ? 'text-emerald-600' : isIncrease ? 'text-red-600' : 'text-gray-500'
        }`}>
          YoY Change ({comparisonYear} ➔ {primaryYear})
        </span>
        <div className="flex items-center gap-2">
          {isDecrease ? <TrendingDown className="text-emerald-500" size={28} /> : 
           isIncrease ? <TrendingUp className="text-red-500" size={28} /> : 
           <Minus className="text-gray-400" size={28} />}
          <span className={`text-3xl font-black ${
            isDecrease ? 'text-emerald-600' : isIncrease ? 'text-red-600' : 'text-gray-600'
          }`}>
            {Math.abs(percentChange).toFixed(1)}%
          </span>
        </div>
      </div>

    </div>
  );
}