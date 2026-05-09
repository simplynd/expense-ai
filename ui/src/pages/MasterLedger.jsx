import React, { useState, useEffect, useMemo } from 'react';
import { transactionService } from '../services/api';

// Sub-components
import LedgerHeader from '../components/ledger/LedgerHeader';
import LedgerFilters from '../components/ledger/LedgerFilters';
import LedgerTable from '../components/ledger/LedgerTable';
import LedgerPagination from '../components/ledger/LedgerPagination';

export default function MasterLedger() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // Sort & Pagination States
  const [sortConfig, setSortConfig] = useState({ key: 'transaction_date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await transactionService.getAllTransactions();
        setTransactions(data || []);
      } catch (err) {
        console.error("Failed to fetch all transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Extract unique years and categories for dropdowns
  const filterOptions = useMemo(() => {
    const years = new Set();
    const categories = new Set();
    
    transactions.forEach(t => {
      if (t.transaction_date) years.add(t.transaction_date.substring(0, 4));
      if (t.category) categories.add(t.category);
    });

    return {
      years: Array.from(years).sort().reverse(),
      categories: Array.from(categories).sort((a, b) => a.localeCompare(b))
    };
  }, [transactions]);

  // Handle combined filtering and sorting instantly
  const processedTransactions = useMemo(() => {
    let result = transactions;

    if (selectedYear !== "All") {
      result = result.filter(t => t.transaction_date?.startsWith(selectedYear));
    }

    if (selectedCategory !== "All") {
      if (selectedCategory === "Uncategorized") {
        result = result.filter(t => !t.category);
      } else {
        result = result.filter(t => t.category === selectedCategory);
      }
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.vendor_normalized || "").toLowerCase().includes(lowerQuery) ||
        (t.vendor_raw || "").toLowerCase().includes(lowerQuery)
      );
    }

    if (minAmount !== "") result = result.filter(t => t.amount >= parseFloat(minAmount));
    if (maxAmount !== "") result = result.filter(t => t.amount <= parseFloat(maxAmount));

    result.sort((a, b) => {
      let aValue = a[sortConfig.key] ?? "";
      let bValue = b[sortConfig.key] ?? "";

      if (typeof aValue === 'string') {
        const compareResult = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? compareResult : -compareResult;
      } else {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return result;
  }, [transactions, selectedYear, selectedCategory, searchQuery, minAmount, maxAmount, sortConfig]);

  // NEW: Calculate dynamic total amount for filtered records
  const totalAmount = useMemo(() => {
    return processedTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [processedTransactions]);

  // Pagination Logic
  const totalPages = Math.ceil(processedTransactions.length / itemsPerPage);
  const currentData = processedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedCategory, searchQuery, minAmount, maxAmount]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return <div className="flex justify-center py-20 text-gray-400 font-bold">Loading master ledger...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <LedgerHeader 
        recordCount={processedTransactions.length} 
        totalAmount={totalAmount} 
      />

      <LedgerFilters 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        selectedYear={selectedYear} setSelectedYear={setSelectedYear}
        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
        minAmount={minAmount} setMinAmount={setMinAmount}
        maxAmount={maxAmount} setMaxAmount={setMaxAmount}
        filterOptions={filterOptions}
      />

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <LedgerTable 
          currentData={currentData} 
          sortConfig={sortConfig} 
          handleSort={handleSort} 
        />
        <LedgerPagination 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          totalPages={totalPages} 
          itemsPerPage={itemsPerPage} 
          totalRecords={processedTransactions.length} 
        />
      </div>
    </div>
  );
}