import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, User, DollarSign, Tag } from 'lucide-react';

export default function LedgerForm({ formData, categories, onChange, onSubmit }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);

  // Filter categories based on what user typed
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes((formData.category || '').toLowerCase())
  );

  // Close dropdown if user clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCategory = (name) => {
    onChange({ ...formData, category: name });
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={onSubmit} className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap lg:flex-nowrap items-center gap-3 relative">
      
      {/* Date, Vendor, and Amount Inputs (Same as before) */}
      <div className="flex-1 min-w-[150px] relative">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input type="date" className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
          value={formData.transaction_date} onChange={(e) => onChange({...formData, transaction_date: e.target.value})} />
      </div>

      <div className="flex-[2] min-w-[200px] relative">
        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input placeholder="Vendor / Payee" className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
          value={formData.vendor_raw} onChange={(e) => onChange({...formData, vendor_raw: e.target.value})} />
      </div>

      <div className="flex-1 min-w-[120px] relative">
        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
        <input type="number" step="0.01" placeholder="0.00" className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
          value={formData.amount} onChange={(e) => onChange({...formData, amount: e.target.value})} />
      </div>

      {/* NEW: Custom Styled Category Dropdown */}
      <div className="flex-1 min-w-[180px] relative" ref={dropdownRef}>
        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          placeholder="Category..."
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
          value={formData.category}
          onFocus={() => setShowSuggestions(true)}
          onChange={(e) => {
            onChange({...formData, category: e.target.value});
            setShowSuggestions(true);
          }}
        />

        {/* Floating Menu */}
        {showSuggestions && (
          <div className="absolute z-50 top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 animate-in fade-in zoom-in-95 duration-100">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCategory(c.name)}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center justify-between group"
                >
                  {c.name}
                  <Plus size={14} className="opacity-0 group-hover:opacity-100 text-emerald-400" />
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl">
                ✨ Create "{formData.category}" as new
              </div>
            )}
          </div>
        )}
      </div>

      <button type="submit" className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95">
        <Plus size={24} />
      </button>
    </form>
  );
}