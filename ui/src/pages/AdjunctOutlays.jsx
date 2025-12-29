import React, { useState, useEffect } from 'react';
import { statementService, transactionService } from '../services/api';
import StatementSelector from '../components/adjunct/StatementSelector';
import LedgerForm from '../components/adjunct/LedgerForm';
import TransactionTable from '../components/adjunct/TransactionTable';

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
      // 1. Fetch raw responses
      const rawStmtData = await statementService.listStatements();
      const rawCatData = await transactionService.getCategories();

      // 2. Extract the array (Handling cases where it might be rawStmtData or rawStmtData.data)
      const dataArray = Array.isArray(rawStmtData)
        ? rawStmtData
        : (rawStmtData?.data || []);

      // 3. Filter using source_type
      const manualOnly = dataArray.filter(s => s.source_type === 'manual');

      setStatements(manualOnly);

      // 4. Handle categories similarly
      const categoriesArray = Array.isArray(rawCatData)
        ? rawCatData
        : (rawCatData?.data || []);
      setCategories(categoriesArray.sort((a, b) => a.name.localeCompare(b.name)));

    } catch (err) {
      console.error("Failed to refresh Adjunct Outlays data:", err);
    }
  };

  const handleSelect = async (stmt) => {
    setSelectedStatement(stmt);
    setTransactions(await statementService.getStatementTransactions(stmt.id));
  };

  const handleCreate = async () => {
    const newStmt = await statementService.createManualStatement(newName);
    setStatements([newStmt, ...statements]);
    setIsCreating(false);
    handleSelect(newStmt);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.vendor_raw || !formData.amount) return;

    try {
      const payload = { 
        ...formData, 
        statement_id: selectedStatement.id, 
        amount: parseFloat(formData.amount) 
      };
      
      const newTx = await transactionService.addManualTransaction(payload);
      
      // Update the transaction list
      setTransactions([newTx, ...transactions]);
      
      // OPTIONAL: Refresh categories if the user typed a new one
      const categoryExists = categories.some(c => c.name === formData.category);
      if (formData.category && !categoryExists) {
        const updatedCats = await transactionService.getCategories();
        setCategories(updatedCats.sort((a, b) => a.name.localeCompare(b.name)));
      }

      // Reset form (keep date and category for the next entry)
      setFormData({ ...formData, vendor_raw: '', amount: '' });
    } catch (err) {
      alert("Failed to add transaction. Check if fields are valid.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete?")) {
      await transactionService.deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleUpdate = async (id, updatedFields) => {
    try {
      // payload for update as per your API spec
      const payload = {
        ...updatedFields,
        amount: parseFloat(updatedFields.amount)
      };
      const updatedTx = await transactionService.updateManualTransaction(id, payload);

      // Update local state to reflect changes immediately
      setTransactions(transactions.map(t => t.id === id ? updatedTx : t));
    } catch (err) {
      console.error("Failed to update transaction:", err);
      alert("Update failed. Make sure the amount is a valid number.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <StatementSelector
        statements={statements} selectedId={selectedStatement?.id} onSelect={handleSelect}
        onToggleCreate={() => setIsCreating(!isCreating)} isCreating={isCreating}
        newName={newName} setNewName={setNewName} onCreate={handleCreate}
      />
      {selectedStatement && (
        <div className="space-y-6">
          <LedgerForm formData={formData} categories={categories} onChange={setFormData} onSubmit={handleAdd} />
          <TransactionTable
            transactions={transactions}
            onDelete={handleDelete}
            onUpdate={handleUpdate} // <-- Add this
          />
        </div>
      )}
    </div>
  );
}