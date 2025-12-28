import React from 'react';
import { FileText, Edit2, Check, X } from 'lucide-react';

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
  pollCount 
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Statement History</h3>
        {pollCount > 0 && pollCount < 5 && <span className="text-xs text-blue-500 animate-pulse font-medium">Auto-refreshing...</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">File Name</th>
              <th className="px-6 py-4">Uploaded</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {statements.map((s) => (
              <tr 
                key={s.id} 
                onClick={() => onSelect(s)}
                className={`cursor-pointer transition-colors ${selectedId === s.id ? 'bg-blue-50/60' : 'hover:bg-gray-50/50'}`}
              >
                <td className="px-6 py-4">
                  {editingId === s.id ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <input 
                        autoFocus
                        className="border-2 border-blue-500 rounded-lg px-3 py-1 text-sm outline-none w-64"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && onSaveEdit(s.id)}
                      />
                      <button onClick={() => onSaveEdit(s.id)} className="p-1 bg-emerald-500 text-white rounded"><Check size={14}/></button>
                      <button onClick={onCancelEdit} className="p-1 bg-gray-200 text-gray-600 rounded"><X size={14}/></button>
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
                    s.status.toLowerCase() === 'processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-500">{(s.file_size / 1024).toFixed(1)} KB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}