import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Calculator, X } from 'lucide-react';

export default function IncomeEntryForm({ onSave, isLoading, annualExpenses, initialEditData, onCancelEdit }) {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [incomes, setIncomes] = useState([
    { person_name: 'Nakul', gross_income: '', net_income: '' },
    { person_name: 'Dhara', gross_income: '', net_income: '' }
  ]);

  // If we receive edit data, populate the form
  useEffect(() => {
    if (initialEditData) {
      setYear(initialEditData.year);
      setIncomes(initialEditData.records.length > 0 ? initialEditData.records : [{ person_name: '', gross_income: '', net_income: '' }]);
    } else {
      // Reset form
      setYear(new Date().getFullYear().toString());
      setIncomes([
        { person_name: 'Nakul', gross_income: '', net_income: '' },
        { person_name: 'Dhara', gross_income: '', net_income: '' }
      ]);
    }
  }, [initialEditData]);

  const handleUpdate = (index, field, value) => {
    const updated = [...incomes];
    updated[index][field] = value;
    setIncomes(updated);
  };

  const addPerson = () => {
    setIncomes([...incomes, { person_name: '', gross_income: '', net_income: '' }]);
  };

  const removePerson = (index) => {
    setIncomes(incomes.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!year || incomes.length === 0) return;
    
    onSave({
      year,
      records: incomes.map(inc => ({
        person_name: inc.person_name || 'Unknown',
        gross_income: parseFloat(inc.gross_income) || 0,
        net_income: parseFloat(inc.net_income) || 0
      }))
    });
  };

  const familyNet = incomes.reduce((sum, inc) => sum + (parseFloat(inc.net_income) || 0), 0);
  const yearlyExpense = annualExpenses[year] || 0;
  const calculatedSavings = familyNet - yearlyExpense;

  const formatMoney = (val) => '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const isEditing = !!initialEditData;

  return (
    <div className={`bg-white rounded-3xl shadow-sm border overflow-hidden transition-colors ${isEditing ? 'border-blue-300 ring-4 ring-blue-50' : 'border-gray-100'}`}>
      <div className={`p-6 border-b flex justify-between items-center ${isEditing ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50/30 border-gray-50'}`}>
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
          <Calculator size={16} className={isEditing ? "text-blue-600" : "text-blue-500"} /> 
          {isEditing ? `Editing NOA Data for ${year}` : 'Record NOA Data'}
        </h3>
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tax Year:</label>
          <input 
            type="number" 
            className={`w-24 border rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 ${isEditing ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-200'}`}
            value={year} onChange={(e) => setYear(e.target.value)} required
            disabled={isEditing}
          />
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-3">
          {incomes.map((inc, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100 relative group transition-colors hover:bg-gray-50">
              <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Family Member</label>
                <input 
                  type="text" placeholder="Name"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={inc.person_name} onChange={(e) => handleUpdate(i, 'person_name', e.target.value)} required
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Gross Income</label>
                <input 
                  type="number" step="0.01" placeholder="0.00"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={inc.gross_income} onChange={(e) => handleUpdate(i, 'gross_income', e.target.value)} required
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Net Income</label>
                <input 
                  type="number" step="0.01" placeholder="0.00"
                  className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={inc.net_income} onChange={(e) => handleUpdate(i, 'net_income', e.target.value)} required
                />
              </div>
              
              <button type="button" onClick={() => removePerson(i)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-0.5">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          
          <button type="button" onClick={addPerson} className="text-xs font-black text-blue-600 uppercase tracking-tight hover:underline flex items-center gap-1 pl-2">
            <Plus size={14} /> Add Person
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-800 rounded-2xl items-center">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Total Family Net</span>
            <span className="text-xl font-black text-white">{formatMoney(familyNet)}</span>
          </div>
          <div className="hidden md:block text-slate-600 font-black text-2xl text-center">-</div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">{year} Expenses</span>
            <span className="text-xl font-black text-orange-400">{formatMoney(yearlyExpense)}</span>
          </div>
          <div className="border-t md:border-t-0 md:border-l border-slate-700 pt-3 md:pt-0 md:pl-5 text-right md:text-left">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">Calculated Savings</span>
            <span className={`text-2xl font-black ${calculatedSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatMoney(calculatedSavings)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {isEditing && (
            <button 
              type="button" onClick={onCancelEdit}
              className="bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <X size={16} /> Cancel
            </button>
          )}
          <button 
            type="submit" disabled={isLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
          >
            <Save size={16} /> {isEditing ? 'Update Entry' : 'Save Ledger Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}