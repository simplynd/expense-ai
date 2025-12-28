import React, { useState, useEffect, useCallback } from 'react';
import { statementService } from '../services/api';
import UploadZone from '../components/statements/UploadZone';
import StatementHistoryTable from '../components/statements/StatementHistoryTable';
import TransactionDetailTable from '../components/statements/TransactionDetailTable';

/**
 * Statements Page Container
 * Orchestrates the uploading, renaming, and detailed viewing of bank statements.
 */
export default function Statements() {
  // Data State
  const [statements, setStatements] = useState([]);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // UI Loading States
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Polling & Editing State
  const [pollCount, setPollCount] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // 1. Fetch List of Statements
  const fetchStatements = useCallback(async () => {
    try {
      const response = await statementService.listStatements();
      // Axios returns the payload in .data
      setStatements(response.data || []);
    } catch (err) {
      console.error("Failed to fetch statement history:", err);
      setStatements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  // 2. Smart Polling Logic (Max 5 attempts, 1 min apart)
  useEffect(() => {
    const isProcessing = statements.some(s => s.status.toLowerCase() === 'processing');

    if (isProcessing && pollCount < 5) {
      const timer = setTimeout(() => {
        console.log(`Polling attempt ${pollCount + 1} of 5...`);
        fetchStatements();
        setPollCount(prev => prev + 1);
      }, 60000); // 1 minute

      return () => clearTimeout(timer);
    }
  }, [statements, pollCount, fetchStatements]);

  // 3. Handle Selecting a Statement to view Transactions
  const handleSelectStatement = async (statement) => {
    setSelectedStatement(statement);
    setTransactions([]); 
    setDetailsLoading(true);
    
    try {
      // Because we updated api.js to return response.data, 
      // 'result' here IS the array of transactions.
      const result = await statementService.getStatementTransactions(statement.id);
      
      console.log("API Result:", result); // Keep this to verify in console
      
      // Ensure we are setting an array
      if (Array.isArray(result)) {
        setTransactions(result);
      } else if (result && result.transactions) {
        // Fallback: in case your API wraps it in a 'transactions' key
        setTransactions(result.transactions);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactions([]);
    } finally {
      // Small delay ensures React finishes state batching
      setTimeout(() => setDetailsLoading(false), 100);
    }
  };

  // 4. Handle Inline Filename Update
  const handleSaveEdit = async (id) => {
    if (!editValue.trim()) return;
    
    try {
      await statementService.updateFilename(id, editValue);
      // Update local list state
      setStatements(prev => prev.map(s => s.id === id ? { ...s, filename: editValue } : s));
      // Update selected statement if it's the one being renamed
      if (selectedStatement?.id === id) {
        setSelectedStatement(prev => ({ ...prev, filename: editValue }));
      }
      setEditingId(null);
    } catch (err) {
      alert("Failed to update filename. Please check your backend.");
    }
  };

  // 5. Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await statementService.upload(file);
      // Reset polling to give the new file a 5-minute window
      setPollCount(0);
      fetchStatements();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Make sure the file is a valid PDF.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Top Section: Upload Box */}
      <UploadZone 
        uploading={uploading} 
        onUpload={handleFileUpload} 
      />
      
      {/* Middle Section: List of uploaded files */}
      <StatementHistoryTable 
        statements={statements}
        selectedId={selectedStatement?.id}
        onSelect={handleSelectStatement}
        editingId={editingId}
        editValue={editValue}
        setEditValue={setEditValue}
        onStartEdit={(e, s) => {
          e.stopPropagation(); // Prevent row selection when clicking edit
          setEditingId(s.id);
          setEditValue(s.filename);
        }}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={() => setEditingId(null)}
        pollCount={pollCount}
      />

      {/* Bottom Section: Transactions within the selected file */}
      {selectedStatement && (
        <TransactionDetailTable 
          transactions={transactions} 
          filename={selectedStatement.filename}
          isLoading={detailsLoading}
        />
      )}
    </div>
  );
}