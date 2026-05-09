import React, { useState } from 'react';
import { Calendar, Filter, Edit2, Trash2, Check, X, Copy, CheckSquare, Square } from 'lucide-react';

export default function StatementSelector({ 
  statements, selectedId, onSelect, onToggleCreate, isCreating, newName, setNewName, onCreate,
  onRename, onDelete,
  onClone // NEW PROP
}) {
  const [selectedYear, setSelectedYear] = useState('All');
  
  // Local state for inline editing
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // NEW: Local state for Bulk Cloning
  const [isCloning, setIsCloning] = useState(false);
  const [cloneSelection, setCloneSelection] = useState([]);
  const [targetCloneYear, setTargetCloneYear] = useState((new Date().getFullYear() + 1).toString());

  const filteredStatements = selectedYear === 'All' 
    ? statements 
    : statements.filter(s => s.filename.includes(selectedYear));

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditValue(s.filename);
  };

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== statements.find(s => s.id === editingId)?.filename) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const toggleCloneSelection = (id) => {
    setCloneSelection(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const executeClone = () => {
    if (cloneSelection.length === 0) return;

    // Map selected IDs to their old names and dynamically generate the new names
    const itemsToClone = cloneSelection.map(id => {
      const stmt = statements.find(s => s.id === id);
      // Regex replaces the last 4 digits at the end of the string with the target year
      const newName = stmt.filename.replace(/\d{4}$/, targetCloneYear);
      return { id, oldName: stmt.filename, newName };
    });

    onClone(itemsToClone);
    setIsCloning(false);
    setCloneSelection([]);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={16} /> Select Ledger Group
        </h3>
        
        <div className="flex items-center gap-4">
          {!isCloning && (
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <Filter size={14} className="text-gray-400" />
              <select 
                className="bg-transparent border-none text-xs font-bold text-gray-600 outline-none cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="All">All Years</option>
                {['2026', '2025', '2024', '2023'].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          {!isCreating && (
            <button 
              onClick={() => { setIsCloning(!isCloning); setCloneSelection([]); }} 
              className={`text-xs font-black uppercase tracking-tighter flex items-center gap-1 ${isCloning ? 'text-gray-500 hover:text-gray-800' : 'text-indigo-600 hover:underline'}`}
            >
              {isCloning ? "Cancel Cloning" : <><Copy size={14} /> Bulk Clone</>}
            </button>
          )}

          {!isCloning && (
            <button onClick={onToggleCreate} className="text-xs font-black text-blue-600 uppercase tracking-tighter hover:underline">
              {isCreating ? "Cancel" : "+ Create New Group"}
            </button>
          )}
        </div>
      </div>

      {/* CLONING ACTION BAR */}
      {isCloning && (
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in slide-in-from-top-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-indigo-900">
              {cloneSelection.length} selected
            </span>
            <div className="h-4 w-px bg-indigo-200"></div>
            <span className="text-sm text-indigo-700 font-medium">Target Year:</span>
            <select 
              className="bg-white border-none rounded-lg px-2 py-1 text-sm font-bold text-indigo-900 outline-none cursor-pointer shadow-sm"
              value={targetCloneYear}
              onChange={(e) => setTargetCloneYear(e.target.value)}
            >
              {['2027', '2026', '2025', '2024'].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={executeClone}
            disabled={cloneSelection.length === 0}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all"
          >
            Clone Groups
          </button>
        </div>
      )}

      {isCreating && (
        <div className="flex gap-3 mb-6 p-4 bg-blue-50 rounded-2xl animate-in slide-in-from-top-4">
          <input 
            className="flex-1 bg-white border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g., Monthly Bills - Dec 2025"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCreate()}
          />
          <button onClick={onCreate} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700">
            Initialize
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {filteredStatements.length > 0 ? (
          filteredStatements.map(s => {
            if (editingId === s.id) {
              return (
                <div key={s.id} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-2xl px-2 py-1.5">
                  <input 
                    autoFocus
                    className="bg-white border-none rounded-lg px-3 py-1.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 w-48"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button onClick={handleSave} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Check size={14}/></button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"><X size={14}/></button>
                </div>
              );
            }

            const isSelectedForClone = cloneSelection.includes(s.id);

            return (
              <div key={s.id} className="relative group">
                <button
                  onClick={() => isCloning ? toggleCloneSelection(s.id) : onSelect(s)}
                  className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all border flex items-center gap-2 ${
                    isCloning 
                    ? isSelectedForClone 
                      ? 'bg-indigo-100 border-indigo-400 text-indigo-900 shadow-inner' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'
                    : selectedId === s.id 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 pr-10' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50 pr-10'
                  }`}
                >
                  {isCloning && (
                    isSelectedForClone ? <CheckSquare size={16} className="text-indigo-600"/> : <Square size={16} className="text-gray-300"/>
                  )}
                  {s.filename}
                </button>
                
                {/* Hover Action Icons (Hidden during cloning) */}
                {!isCloning && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(s); }} className={`p-1.5 rounded-md hover:bg-black/10 ${selectedId === s.id ? 'text-blue-100 hover:text-white' : 'text-gray-400 hover:text-gray-800'}`}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} className={`p-1.5 rounded-md hover:bg-red-500 hover:text-white ${selectedId === s.id ? 'text-blue-100' : 'text-gray-400'}`}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <span className="text-sm text-gray-400 italic py-2">
            No ledger groups found{selectedYear !== 'All' ? ` for ${selectedYear}` : ''}.
          </span>
        )}
      </div>
    </div>
  );
}