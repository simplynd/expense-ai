import React from 'react';
import { Tag, ChevronRight, Plus } from 'lucide-react';

export default function CategorySidebar({ 
  categories, 
  onAssign, 
  selectedCount, 
  newCatName, 
  setNewCatName 
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
      <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Categories</h3>
        <Tag size={14} className="text-gray-300" />
      </div>
      
      <div className="p-2 max-h-[60vh] overflow-y-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onAssign(cat.name)}
            disabled={selectedCount === 0}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all group disabled:opacity-30"
          >
            {cat.name}
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <div className="p-4 bg-blue-50/50 border-t border-blue-100">
        <div className="flex gap-2">
          <input 
            placeholder="Custom category..."
            className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <button 
            onClick={() => onAssign(newCatName)}
            className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}