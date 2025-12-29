import React, { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';

export default function TransactionTable({ transactions, onDelete, onUpdate }) {
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const startEdit = (t) => {
    setEditId(t.id);
    setEditForm({ 
      transaction_date: t.transaction_date, 
      vendor_raw: t.vendor_raw, 
      amount: t.amount 
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };

  const handleSave = (id) => {
    onUpdate(id, editForm);
    setEditId(null);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 bg-gray-50/50">
            <th className="px-8 py-4">Date</th>
            <th className="px-8 py-4">Vendor</th>
            <th className="px-8 py-4">Category</th>
            <th className="px-8 py-4 text-right">Amount</th>
            <th className="px-8 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm">
          {transactions.map(t => (
            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
              {editId === t.id ? (
                <>
                  <td className="px-8 py-4">
                    <input 
                      type="date" 
                      className="bg-blue-50 border-none rounded-lg p-2 font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-hidden" 
                      value={editForm.transaction_date} 
                      onChange={e => setEditForm({...editForm, transaction_date: e.target.value})} 
                    />
                  </td>
                  <td className="px-8 py-4">
                    <input 
                      className="bg-blue-50 border-none rounded-lg p-2 font-bold w-full focus:ring-2 focus:ring-blue-500 outline-hidden" 
                      value={editForm.vendor_raw} 
                      onChange={e => setEditForm({...editForm, vendor_raw: e.target.value})} 
                    />
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-gray-400 italic text-xs">Category Locked</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <input 
                      type="number" 
                      step="0.01" 
                      className="bg-blue-50 border-none rounded-lg p-2 font-bold w-24 text-right focus:ring-2 focus:ring-blue-500 outline-hidden" 
                      value={editForm.amount} 
                      onChange={e => setEditForm({...editForm, amount: e.target.value})} 
                    />
                  </td>
                  <td className="px-8 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => handleSave(t.id)} className="text-emerald-600 hover:scale-110 transition-transform">
                        <Check size={20} />
                      </button>
                      <button onClick={cancelEdit} className="text-gray-400 hover:text-red-400">
                        <X size={20} />
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-8 py-5 font-bold text-gray-500">{t.transaction_date}</td>
                  <td className="px-8 py-5 font-black text-gray-800">{t.vendor_raw}</td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                      {t.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-gray-900">
                    ${Number(t.amount).toFixed(2)}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center gap-4">
                      <button onClick={() => startEdit(t)} className="text-gray-300 hover:text-blue-500 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => onDelete(t.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan="5" className="px-8 py-12 text-center text-gray-400 italic font-medium">
                No entries found in this ledger.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}