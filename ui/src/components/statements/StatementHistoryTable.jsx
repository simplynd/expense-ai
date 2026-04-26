import React, { useState } from 'react';
import { FileText, Edit2, Check, X, Filter, Trash2 } from 'lucide-react';

export default function StatementHistoryTable({ 
  statements, 
  selectedId, 
  onSelect, 
  editingId, 
  editValue, 
  setEditValue, 
  onStartEdit, 
  onSaveEdit, 
  onCancelEdit,
  pollCount,
  onDelete // NEW PROP
}) {
  const [selectedYear, setSelectedYear] = useState('All');

  const filteredStatements = selectedYear === 'All' 
    ? statements 
    : statements.filter(s => s.filename.includes(selectedYear));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800">Statement History</h3>
          {pollCount > 0 && pollCount < 5 && <span className="text-xs text-blue-500 animate-pulse font-medium">Auto-refreshing...</span>}
        </div>

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
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">File Name</th>
              <th className="px-6 py-4">Uploaded</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredStatements.length > 0 ? (
              filteredStatements.map(s => (
                <tr 
                  key={s.id} 
                  onClick={() => onSelect(s)}
                  className={`cursor-pointer transition-colors ${selectedId === s.id ? 'bg-blue-50/50' : 'hover:bg-gray-50/30'}`}
                >
                  <td className="px-6 py-4">
                    {editingId === s.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          autoFocus
                          className="border border-blue-300 rounded px-2 py-1 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onSaveEdit(e, s.id);
                            if (e.key === 'Escape') onCancelEdit();
                          }}
                        />
                        <button onClick={(e) => onSaveEdit(e, s.id)} className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"><Check size={14}/></button>
                        <button onClick={onCancelEdit} className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"><X size={14}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 group">
                        <FileText className={selectedId === s.id ? "text-blue-600" : "text-gray-400"} size={20} />
                        <span className="font-bold text-gray-700">{s.filename}</span>
                        <button onClick={(e) => onStartEdit(e, s)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white rounded-md border border-gray-200 shadow-sm transition-all">
                          <Edit2 size={12} className="text-gray-400" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(s.uploaded_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-extrabold uppercase px-2 py-1 rounded-md ${
                      s.status.toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                      s.status.toLowerCase() === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* NEW: Delete Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents the row's onSelect from firing
                        onDelete(s.id);
                      }} 
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Statement"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">
                  No statements found{selectedYear !== 'All' ? ` for ${selectedYear}` : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}