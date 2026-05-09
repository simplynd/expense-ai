import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export default function YearlySavingsCard({ year, incomeRecords, totalExpenses, onEdit, onDelete }) {
  const familyGross = incomeRecords.reduce((sum, r) => sum + (Number(r.gross_income) || 0), 0);
  const familyNet = incomeRecords.reduce((sum, r) => sum + (Number(r.net_income) || 0), 0);
  
  const savings = familyNet - totalExpenses;
  const savingsRate = familyNet > 0 ? ((savings / familyNet) * 100).toFixed(1) : 0;

  const isPositive = savings >= 0;
  const formatMoney = (val) => '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
      <div className={`p-8 lg:w-1/3 flex flex-col justify-center ${isPositive ? 'bg-emerald-50 border-r border-emerald-100' : 'bg-red-50 border-r border-red-100'}`}>
        <span className="text-xl font-black text-gray-800 mb-1">{year} Overview</span>
        <span className={`text-[11px] font-black uppercase tracking-widest mb-6 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          Net Savings Result
        </span>
        <span className={`text-4xl font-black tracking-tight ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {formatMoney(savings)}
        </span>
        <span className="text-sm font-bold text-gray-500 mt-2">
          Savings Rate: {savingsRate}% of Net
        </span>
      </div>

      <div className="p-8 lg:w-2/3 flex flex-col justify-between gap-6 relative">
        
        {/* Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-2">
          <button onClick={() => onEdit(year)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Year">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(year)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Year">
            <Trash2 size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {incomeRecords.map((person, idx) => (
            <div key={idx} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest block mb-2">{person.person_name}</span>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-400">Gross:</span>
                <span className="text-sm font-black text-gray-700">{formatMoney(Number(person.gross_income))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-400">Net:</span>
                <span className="text-sm font-black text-blue-600">{formatMoney(Number(person.net_income))}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Family Gross</span>
            <span className="text-xl font-black text-gray-800">{formatMoney(familyGross)}</span>
          </div>
          <div>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">Family Net</span>
            <span className="text-xl font-black text-blue-600">{formatMoney(familyNet)}</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-1">Total Expenses</span>
            <span className="text-xl font-black text-orange-600">{formatMoney(totalExpenses)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}