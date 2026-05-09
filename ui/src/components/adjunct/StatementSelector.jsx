import React, { useState, useMemo } from 'react';
import { Calendar, Filter, Edit2, Trash2, Check, X, Copy, CheckSquare, Square, FolderOpen, Search, Plus } from 'lucide-react';

export default function StatementSelector({ 
  statements, selectedId, onSelect, onToggleCreate, isCreating, newName, setNewName, onCreate,
  onRename, onDelete, onClone 
}) {
  // UPDATED: Default to current year instead of 'All'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const [isCloning, setIsCloning] = useState(false);
  const [cloneSelection, setCloneSelection] = useState([]);
  const [targetCloneYear, setTargetCloneYear] = useState((new Date().getFullYear() + 1).toString());

  // Dynamically parse years and clean names from the statements
  const { years, parsedStatements } = useMemo(() => {
    const yearSet = new Set();
    const parsed = statements.map(s => {
      const match = s.filename.match(/\b(20\d{2})\b/);
      const year = match ? match[0] : 'Other';
      if (year !== 'Other') yearSet.add(year);
      
      const cleanName = match ? s.filename.replace(/\s*-\s*20\d{2}/, '').trim() : s.filename;
      return { ...s, parsedYear: year, cleanName };
    });

    // Ensure the current year is in the dropdown list even if no groups exist for it yet
    const currentYear = new Date().getFullYear().toString();
    if (!yearSet.has(currentYear)) yearSet.add(currentYear);

    return { years: Array.from(yearSet).sort().reverse(), parsedStatements: parsed };
  }, [statements]);

  // Filter and sort the list
  const filteredStatements = parsedStatements.filter(s => {
    const matchesYear = selectedYear === 'All' || s.parsedYear === selectedYear;
    const matchesSearch = s.cleanName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesYear && matchesSearch;
  }).sort((a, b) => a.cleanName.localeCompare(b.cleanName));

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
    setCloneSelection(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const executeClone = () => {
    if (cloneSelection.length === 0) return;
    const itemsToClone = cloneSelection.map(id => {
      const stmt = statements.find(s => s.id === id);
      const newName = stmt.filename.replace(/\d{4}$/, targetCloneYear);
      return { id, oldName: stmt.filename, newName };
    });

    onClone(itemsToClone);
    setIsCloning(false);
    setCloneSelection([]);
  };

  return (
    <div className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-full">
      
      {/* Sidebar Header & Controls */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <FolderOpen size={14} /> Ledger Groups
          </h2>
          <button onClick={onToggleCreate} className="text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 p-1.5 rounded-lg" title="Create New Group">
            <Plus size={16} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" placeholder="Search buckets..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Calendar size={14} className="text-gray-400" />
            <select 
              className="w-full bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
              value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="All">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {!isCloning && !isCreating && (
          <button onClick={() => setIsCloning(true)} className="w-full flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2.5 rounded-xl transition-colors">
            <Copy size={12} /> Bulk Clone Groups
          </button>
        )}
      </div>

      {/* CLONING ACTION PANEL */}
      {isCloning && (
        <div className="p-4 bg-indigo-600 text-white flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold">{cloneSelection.length} selected</span>
            <button onClick={() => { setIsCloning(false); setCloneSelection([]); }} className="text-indigo-200 hover:text-white"><X size={16}/></button>
          </div>
          <div className="flex items-center gap-2 bg-indigo-700 rounded-lg p-2">
            <span className="text-[10px] font-bold uppercase">To Year:</span>
            <select className="bg-transparent text-sm font-bold outline-none flex-1" value={targetCloneYear} onChange={(e) => setTargetCloneYear(e.target.value)}>
              {['2027', '2026', '2025', '2024'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={executeClone} disabled={cloneSelection.length === 0} className="w-full bg-white text-indigo-600 py-2 rounded-lg text-xs font-black uppercase tracking-wider disabled:opacity-50">
            Execute Clone
          </button>
        </div>
      )}

      {/* CREATION PANEL */}
      {isCreating && (
        <div className="p-4 bg-blue-600 text-white flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider">New Group</span>
            <button onClick={onToggleCreate} className="text-blue-200 hover:text-white"><X size={16}/></button>
          </div>
          <input 
            autoFocus className="w-full bg-blue-700 border-none rounded-lg px-3 py-2 text-sm font-bold placeholder:text-blue-300 outline-none focus:ring-2 focus:ring-white"
            placeholder={`e.g. Roof Repair - ${new Date().getFullYear()}`} value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCreate()}
          />
          <button onClick={onCreate} className="w-full bg-white text-blue-600 py-2 rounded-lg text-xs font-black uppercase tracking-wider">Initialize</button>
        </div>
      )}

      {/* Vertical Group List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-gray-50/30">
        {filteredStatements.map(s => {
          if (editingId === s.id) {
            return (
              <div key={s.id} className="flex flex-col gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <input 
                  autoFocus className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none w-full"
                  value={editValue} onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditingId(null); }}
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="flex-1 bg-emerald-500 text-white rounded-lg py-1 hover:bg-emerald-600 flex justify-center"><Check size={14}/></button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-300 text-gray-700 rounded-lg py-1 hover:bg-gray-400 flex justify-center"><X size={14}/></button>
                </div>
              </div>
            );
          }

          const isSelectedForClone = cloneSelection.includes(s.id);
          const isActive = selectedId === s.id && !isCloning;

          return (
            <div key={s.id} className="relative group">
              <button
                onClick={() => isCloning ? toggleCloneSelection(s.id) : onSelect(s)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  isCloning 
                    ? isSelectedForClone ? 'bg-indigo-100 border border-indigo-300' : 'bg-white border border-transparent hover:bg-gray-100'
                    : isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                {isCloning && (isSelectedForClone ? <CheckSquare size={16} className="text-indigo-600"/> : <Square size={16} className="text-gray-300"/>)}
                
                <div className="flex flex-col overflow-hidden">
                  <span className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>
                    {s.cleanName}
                  </span>
                  {(selectedYear === 'All' || searchTerm) && s.parsedYear !== 'Other' && (
                    <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                      {s.parsedYear}
                    </span>
                  )}
                </div>
              </button>
              
              {!isCloning && !isActive && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(s); }} className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50"><Edit2 size={12} /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={12} /></button>
                </div>
              )}
            </div>
          );
        })}
        {filteredStatements.length === 0 && (
          <div className="text-center py-10 text-xs font-bold text-gray-400 uppercase tracking-widest">
            No groups found for {selectedYear}
          </div>
        )}
      </div>
    </div>
  );
}