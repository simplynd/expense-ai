import React, { useState } from 'react';
import { Tag, ChevronRight, Plus, Edit3, CheckCircle2, Trash2, Edit2, Check, X } from 'lucide-react';

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
  onApply,
  onDelete,
  onRenameCategory, // NEW PROP
  onDeleteCategory  // NEW PROP
}) {
  // Local state for inline category editing
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatValue, setEditCatValue] = useState("");

  const startEdit = (cat) => {
    setEditingCatId(cat.id);
    setEditCatValue(cat.name);
  };

  const handleSave = (id) => {
    if (editCatValue.trim() && editCatValue.trim() !== categories.find(c => c.id === id)?.name) {
      onRenameCategory(id, editCatValue.trim());
    }
    setEditingCatId(null);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-8 flex flex-col max-h-[85vh]">
      
      <div className="p-5 border-b border-gray-50 bg-blue-50/30">
        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2"><Edit3 size={14} /> 1. Clean Vendor Name</span>
          <span className="text-[9px] text-blue-400 bg-white px-1.5 py-0.5 rounded shadow-sm">OPTIONAL</span>
        </h3>
        <input 
          className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
          placeholder="Leave blank to keep original names"
          value={cleanVendorName}
          onChange={(e) => setCleanVendorName(e.target.value)}
          disabled={selectedCount === 0}
        />
        {selectedCount === 0 && (
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Select transactions to edit.</p>
        )}
      </div>

      <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between shrink-0">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">2. Select Category</h3>
        <Tag size={14} className="text-gray-400" />
      </div>
      
      <div className="p-3 overflow-y-auto flex-1 space-y-1">
        {categories.map(cat => {
          if (editingCatId === cat.id) {
            return (
              <div key={cat.id} className="flex items-center gap-1 bg-white border border-blue-200 rounded-xl px-2 py-2">
                <input 
                  autoFocus
                  className="bg-gray-50 border-none rounded px-2 py-1 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-0"
                  value={editCatValue}
                  onChange={(e) => setEditCatValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave(cat.id);
                    if (e.key === 'Escape') setEditingCatId(null);
                  }}
                />
                <button onClick={() => handleSave(cat.id)} className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 shrink-0"><Check size={12}/></button>
                <button onClick={() => setEditingCatId(null)} className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 shrink-0"><X size={12}/></button>
              </div>
            );
          }

          const isSelected = selectedCategoryName === cat.name;
          return (
            <div key={cat.id} className="relative group">
              <button
                onClick={() => setSelectedCategoryName(cat.name)}
                disabled={selectedCount === 0}
                className={`w-full flex items-center justify-between px-4 py-3 pr-16 rounded-xl text-sm font-bold transition-all disabled:opacity-30 ${
                  isSelected 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200/50' 
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {isSelected ? (
                  <CheckCircle2 size={16} className="text-white shrink-0" />
                ) : (
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 shrink-0" />
                )}
              </button>
              
              {/* Category Management Actions */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); startEdit(cat); }} className={`p-1.5 rounded-md hover:bg-black/10 ${isSelected ? 'text-blue-100 hover:text-white' : 'text-gray-400 hover:text-gray-800'}`}>
                  <Edit2 size={12} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); }} className={`p-1.5 rounded-md hover:bg-red-500 hover:text-white ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

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

      <div className="p-5 bg-white border-t border-gray-100 shrink-0 space-y-3">
        <button
          onClick={onApply}
          disabled={selectedCount === 0 || !selectedCategoryName}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-40 disabled:hover:bg-emerald-500 transition-all"
        >
          <CheckCircle2 size={16} />
          {cleanVendorName.trim() ? "Apply & Save Rule" : "Categorize Only"}
        </button>
        
        <button
          onClick={onDelete}
          disabled={selectedCount === 0}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 focus:ring-4 focus:ring-red-500/20 disabled:opacity-40 disabled:hover:bg-red-50 transition-all"
        >
          <Trash2 size={16} />
          Delete Selected
        </button>
      </div>
      
    </div>
  );
}