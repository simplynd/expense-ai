import React, { useState, useEffect } from 'react';
import { statementService, transactionService } from '../services/api';
import StatementSelector from '../components/adjunct/StatementSelector';
import LedgerForm from '../components/adjunct/LedgerForm';
import TransactionTable from '../components/adjunct/TransactionTable';
import { UploadCloud, FolderOpen } from 'lucide-react';

export default function AdjunctOutlays() {
  const [statements, setStatements] = useState([]);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [formData, setFormData] = useState({ transaction_date: new Date().toISOString().split('T')[0], vendor_raw: '', amount: '', category: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const rawStmtData = await statementService.listStatements();
      const rawCatData = await transactionService.getCategories();
      const dataArray = Array.isArray(rawStmtData) ? rawStmtData : (rawStmtData?.data || []);
      const manualOnly = dataArray.filter(s => s.source_type === 'manual');
      setStatements(manualOnly);
      setCategories(rawCatData || []);
    } catch (err) { console.error("Failed to load layout:", err); }
  };

  const handleSelect = async (stmt) => {
    setSelectedStatement(stmt);
    try {
      const txs = await statementService.getStatementTransactions(stmt.id);
      setTransactions(txs || []);
    } catch (err) { console.error("Failed to fetch transactions:", err); }
  };

  const handleRenameBucket = async (id, newName) => {
    try {
      await statementService.updateFilename(id, newName);
      setStatements(prev => prev.map(s => s.id === id ? { ...s, filename: newName } : s));
    } catch (err) {
      console.error(err);
      alert("Failed to rename ledger group.");
    }
  };

  const handleDeleteBucket = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this manual group and ALL of its transactions?")) return;
    try {
      await statementService.deleteStatement(id);
      setStatements(prev => prev.filter(s => s.id !== id));
      if (selectedStatement?.id === id) {
        setSelectedStatement(null);
        setTransactions([]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete ledger group.");
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const newStmt = await statementService.createManualStatement(newName);
      setStatements(prev => [newStmt, ...prev]);
      setNewName("");
      setIsCreating(false);
      handleSelect(newStmt);
    } catch (err) { alert("Failed to create ledger."); }
  };

  const handleAdd = async (e, isRecurring, recurMonths) => {
    e.preventDefault();
    if (!formData.transaction_date || !formData.vendor_raw || !formData.amount || !formData.category) return;

    const [year, month, day] = formData.transaction_date.split('-').map(Number);
    const monthsToProcess = isRecurring ? recurMonths : 1;

    try {
      for (let i = 0; i < monthsToProcess; i++) {
        let m = month + i;
        let y = year;
        while (m > 12) { m -= 12; y += 1; }
        
        const dateString = `${y}-${m.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const payload = {
          statement_id: selectedStatement.id,
          transaction_date: dateString,
          vendor_raw: formData.vendor_raw,
          amount: parseFloat(formData.amount),
          category: formData.category
        };
        await transactionService.addManualTransaction(payload);
      }

      const freshData = await statementService.getStatementTransactions(selectedStatement.id);
      setTransactions(freshData);
      setFormData({ ...formData, vendor_raw: '', amount: '', category: '' });
      
    } catch (err) { alert("Addition failed. Check inputs."); }
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const yearInput = prompt("Enter the Year for this legacy spreadsheet (e.g., 2024):", new Date().getFullYear() - 1);
    if (!yearInput) { e.target.value = null; return; }
    const year = parseInt(yearInput, 10);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const parseCSVLine = (line) => {
          const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
          return line.split(re).map(s => s.replace(/(^"|"$)/g, '').trim());
      };

      const lines = text.split('\n').filter(l => l.trim() !== '');
      const transactionsToCreate = [];

      for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 13) continue; 

          const categoryName = cols[0];
          if (!categoryName) continue;

          for (let m = 1; m <= 12; m++) {
              const valStr = cols[m];
              if (!valStr) continue;
              
              const cleanVal = valStr.replace(/[^0-9.-]+/g, "");
              const amount = parseFloat(cleanVal);

              if (!isNaN(amount) && amount > 0) {
                  const monthStr = m.toString().padStart(2, '0');
                  transactionsToCreate.push({
                      statement_id: selectedStatement.id,
                      transaction_date: `${year}-${monthStr}-01`,
                      vendor_raw: categoryName,
                      category: categoryName,
                      amount: amount
                  });
              }
          }
      }

      if (transactionsToCreate.length === 0) {
          alert("No valid data found. Ensure it is saved as: Category | Jan | Feb | ... | Dec");
          e.target.value = null;
          return;
      }

      if (confirm(`Found ${transactionsToCreate.length} valid entries for ${year}. Ready to import?`)) {
          try {
              for (const tx of transactionsToCreate) {
                   await transactionService.addManualTransaction(tx);
              }
              const freshData = await statementService.getStatementTransactions(selectedStatement.id);
              setTransactions(freshData);
              alert("Legacy Import Successful!");
          } catch (err) {
              console.error(err);
              alert("Some transactions failed to import.");
          }
      }
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      await transactionService.deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleUpdate = async (id, updatedFields) => {
    try {
      const payload = { ...updatedFields, amount: parseFloat(updatedFields.amount) };
      const updatedTx = await transactionService.updateManualTransaction(id, payload);
      setTransactions(transactions.map(t => t.id === id ? updatedTx : t));
    } catch (err) { alert("Update failed."); }
  };

  const handleBulkClone = async (itemsToClone) => {
    try {
      const clonePromises = itemsToClone.map(item => statementService.createManualStatement(item.newName));
      const newStatements = await Promise.all(clonePromises);
      setStatements(prev => [...prev, ...newStatements]);
    } catch (err) {
      console.error(err);
      alert("An error occurred while cloning ledger groups.");
    }
  };

  return (
    // NEW FLEXBOX MASTER-DETAIL LAYOUT
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* LEFT SIDEBAR: Statement Selector */}
      <StatementSelector
        statements={statements} selectedId={selectedStatement?.id} onSelect={handleSelect}
        onToggleCreate={() => setIsCreating(!isCreating)} isCreating={isCreating}
        newName={newName} setNewName={setNewName} onCreate={handleCreate} 
        onRename={handleRenameBucket} onDelete={handleDeleteBucket} onClone={handleBulkClone}
      />

      {/* RIGHT PANEL: Details & Transactions */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
        {selectedStatement ? (
          <>
            {/* Detail Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">
                  Active Ledger
                </span>
                <h2 className="text-2xl font-black text-gray-800">
                  {selectedStatement.filename}
                </h2>
              </div>

              {/* Moved CSV Uploader to Header */}
              <label className="cursor-pointer bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center gap-2 shadow-sm">
                <UploadCloud size={16} /> Import Legacy CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
              </label>
            </div>

            {/* Scrollable Main Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 space-y-8 animate-in fade-in duration-300">
              <LedgerForm formData={formData} categories={categories} onChange={setFormData} onSubmit={handleAdd} />
              <TransactionTable transactions={transactions} onDelete={handleDelete} onUpdate={handleUpdate} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30">
             <FolderOpen size={48} className="text-gray-200 mb-4" />
             <h3 className="text-lg font-black text-gray-800 mb-2">No Ledger Selected</h3>
             <p className="text-sm font-medium max-w-sm">
               Select a bucket from the left sidebar to view its transactions, add new entries, or manage its budget.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}