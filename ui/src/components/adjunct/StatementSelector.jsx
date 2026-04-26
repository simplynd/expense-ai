import React, { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';

export default function StatementSelector({ 
  statements, selectedId, onSelect, onToggleCreate, isCreating, newName, setNewName, onCreate 
}) {
  // NEW: Local state for year filtering
  const [selectedYear, setSelectedYear] = useState('All');

  // Filter buckets based on filename
  const filteredStatements = selectedYear === 'All' 
    ? statements 
    : statements.filter(s => s.filename.includes(selectedYear));

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={16} /> Select Ledger Group
        </h3>
        
        <div className="flex items-center gap-4">
          {/* NEW: Year Filter Dropdown */}
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

          <button onClick={onToggleCreate} className="text-xs font-black text-blue-600 uppercase tracking-tighter hover:underline">
            {isCreating ? "Cancel" : "+ Create New Group"}
          </button>
        </div>
      </div>

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
          filteredStatements.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all border ${
                selectedId === s.id 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {s.filename}
            </button>
          ))
        ) : (
          <span className="text-sm text-gray-400 italic py-2">
            No ledger groups found{selectedYear !== 'All' ? ` for ${selectedYear}` : ''}.
          </span>
        )}
      </div>
    </div>
  );
}