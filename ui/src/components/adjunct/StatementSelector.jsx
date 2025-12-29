import React from 'react';
import { Calendar } from 'lucide-react';

export default function StatementSelector({ 
  statements, selectedId, onSelect, onToggleCreate, isCreating, newName, setNewName, onCreate 
}) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={16} /> Select Ledger Group
        </h3>
        <button onClick={onToggleCreate} className="text-xs font-black text-blue-600 uppercase tracking-tighter hover:underline">
          {isCreating ? "Cancel" : "+ Create New Group"}
        </button>
      </div>

      {isCreating && (
        <div className="flex gap-3 mb-6 p-4 bg-blue-50 rounded-2xl animate-in slide-in-from-top-4">
          <input 
            className="flex-1 bg-white border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Monthly Bills - Dec 2025"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button onClick={onCreate} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
            Initialize
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {statements.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all border ${
              selectedId === s.id 
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' 
              : 'bg-white text-gray-600 border-gray-100 hover:border-blue-300'
            }`}
          >
            {s.filename}
          </button>
        ))}
      </div>
    </div>
  );
}