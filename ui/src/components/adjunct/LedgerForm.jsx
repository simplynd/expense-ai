import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, User, DollarSign, Tag, Repeat } from 'lucide-react';

export default function LedgerForm({ formData, categories, onChange, onSubmit }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);
  
  // NEW: State for recurring feature
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurMonths, setRecurMonths] = useState(12);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes((formData.category || '').toLowerCase())
  );

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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the recurring settings back to the parent
    onSubmit(e, isRecurring, parseInt(recurMonths, 10));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap lg:flex-nowrap items-center gap-3 relative">
      
      <div className="flex-1 min-w-[150px] relative">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          type="date" required
          className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
          value={formData.transaction_date}
          onChange={e => onChange({...formData, transaction_date: e.target.value})}
        />
      </div>

      <div className="flex-[1.5] min-w-[200px] relative">
        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          required placeholder="Vendor / Description..."
          className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
          value={formData.vendor_raw}
          onChange={e => onChange({...formData, vendor_raw: e.target.value})}
        />
      </div>

      <div className="flex-1 min-w-[120px] relative">
        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          type="number" step="0.01" required placeholder="0.00"
          className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-black text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          value={formData.amount}
          onChange={e => onChange({...formData, amount: e.target.value})}
        />
      </div>

      <div className="flex-[1.5] min-w-[200px] relative" ref={dropdownRef}>
        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          required placeholder="Category..."
          className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
          value={formData.category}
          onFocus={() => setShowSuggestions(true)}
          onChange={e => {
            onChange({...formData, category: e.target.value});
            setShowSuggestions(true);
          }}
        />

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

      {/* NEW: Recurring Toggle UI */}
      <div className="flex items-center gap-2 px-2 border-l border-gray-100 shrink-0 h-10">
        <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-blue-600 transition-colors">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.value)}
            onClick={() => setIsRecurring(!isRecurring)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
          />
          <Repeat size={14} /> Recur
        </label>
        {isRecurring && (
          <input
            type="number" min="2" max="24"
            value={recurMonths}
            onChange={(e) => setRecurMonths(e.target.value)}
            className="w-14 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg px-2 py-1.5 text-xs font-black focus:ring-2 focus:ring-blue-500 outline-none"
            title="Number of months to repeat"
          />
        )}
      </div>

      <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors shrink-0 shadow-sm shadow-blue-200">
        <Plus size={20} />
      </button>
    </form>
  );
}