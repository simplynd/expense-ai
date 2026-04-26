import React from 'react';
import { Tag, ChevronRight, Plus, Edit3, CheckCircle2 } from 'lucide-react';

export default function CategorySidebar({ 
  categories, 
  selectedCount, 
  newCatName, 
  setNewCatName,
  cleanVendorName,
  setCleanVendorName,
  selectedCategoryName,
  setSelectedCategoryName,
  onCreateCategory,
  onApply
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-8 flex flex-col max-h-[85vh]">
      
      {/* 1. Vendor Normalization Input */}
      <div className="p-5 border-b border-gray-50 bg-blue-50/30">
        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Edit3 size={14} /> 1. Clean Vendor Name
        </h3>
        <input 
          className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
          placeholder="e.g. Amazon"
          value={cleanVendorName}
          onChange={(e) => setCleanVendorName(e.target.value)}
          disabled={selectedCount === 0}
        />
        {selectedCount === 0 && (
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Select transactions to edit.</p>
        )}
      </div>

      {/* 2. Category Selection List */}
      <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between shrink-0">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">2. Select Category</h3>
        <Tag size={14} className="text-gray-400" />
      </div>
      
      <div className="p-3 overflow-y-auto flex-1 space-y-1">
        {categories.map(cat => {
          const isSelected = selectedCategoryName === cat.name;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryName(cat.name)}
              disabled={selectedCount === 0}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group disabled:opacity-30 ${
                isSelected 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200/50' 
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              {cat.name}
              {isSelected ? (
                <CheckCircle2 size={16} className="text-white" />
              ) : (
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />
              )}
            </button>
          )
        })}
      </div>

      {/* 3. Create Custom Category */}
      <div className="p-4 bg-gray-50/80 border-t border-gray-100 shrink-0">
        <div className="flex gap-2">
          <input 
            placeholder="Custom category..."
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            disabled={selectedCount === 0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCreateCategory();
            }}
          />
          <button 
            onClick={onCreateCategory}
            disabled={selectedCount === 0 || !newCatName.trim()}
            className="bg-gray-800 text-white p-2 rounded-xl hover:bg-black disabled:opacity-50 transition-colors"
            title="Create Category"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* 4. Submission Button */}
      <div className="p-5 bg-white border-t border-gray-100 shrink-0">
        <button
          onClick={onApply}
          disabled={selectedCount === 0 || !cleanVendorName || !selectedCategoryName}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-40 disabled:hover:bg-emerald-500 transition-all"
        >
          <CheckCircle2 size={16} />
          Apply & Save Rule
        </button>
      </div>
      
    </div>
  );
}