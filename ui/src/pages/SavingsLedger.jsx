import React, { useState, useEffect, useMemo } from 'react';
import { transactionService, incomeService } from '../services/api';

import SavingsHeader from '../components/savings/SavingsHeader';
import IncomeEntryForm from '../components/savings/IncomeEntryForm';
import YearlySavingsCard from '../components/savings/YearlySavingsCard';

export default function SavingsLedger() {
  const [transactions, setTransactions] = useState([]);
  const [incomes, setIncomes] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // NEW: State to track which year is currently being edited
  const [editingYear, setEditingYear] = useState(null);

  const fetchData = async () => {
    try {
      const [txData, incData] = await Promise.all([
        transactionService.getAllTransactions(),
        incomeService.getAll()
      ]);
      setTransactions(txData || []);
      setIncomes(incData || []);
    } catch (err) {
      console.error("Failed to fetch ledger data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveIncome = async (data) => {
    setSaving(true);
    try {
      await incomeService.save(data);
      setEditingYear(null); // Clear edit mode on save
      await fetchData(); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert("Failed to save income record.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteYear = async (year) => {
    if (!window.confirm(`Are you sure you want to delete all NOA data for ${year}?`)) return;
    try {
      await incomeService.delete(year);
      if (editingYear === year) setEditingYear(null);
      await fetchData();
    } catch (err) {
      alert("Failed to delete record.");
      console.error(err);
    }
  };

  const incomesByYear = useMemo(() => {
    return incomes.reduce((acc, curr) => {
      if (!acc[curr.year]) acc[curr.year] = [];
      acc[curr.year].push(curr);
      return acc;
    }, {});
  }, [incomes]);

  const { years, annualExpenses } = useMemo(() => {
    const expenses = {};
    const yearSet = new Set();

    transactions.forEach(t => {
      if (!t.transaction_date) return;
      const year = t.transaction_date.substring(0, 4);
      yearSet.add(year);
      expenses[year] = (expenses[year] || 0) + Math.abs(Number(t.amount) || 0);
    });

    Object.keys(incomesByYear).forEach(y => yearSet.add(y));

    const sortedYears = Array.from(yearSet).sort().reverse();
    return { years: sortedYears, annualExpenses: expenses };
  }, [transactions, incomesByYear]);

  // Construct edit payload dynamically when a user clicks 'Edit'
  const editData = useMemo(() => {
    if (!editingYear) return null;
    return {
      year: editingYear,
      records: incomesByYear[editingYear] || []
    };
  }, [editingYear, incomesByYear]);

  if (loading) {
    return <div className="flex justify-center py-20 text-gray-400 font-bold">Loading savings ledger...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <SavingsHeader />
      
      <div id="entry-form">
        <IncomeEntryForm 
          onSave={handleSaveIncome} 
          isLoading={saving} 
          annualExpenses={annualExpenses}
          initialEditData={editData}
          onCancelEdit={() => setEditingYear(null)}
        />
      </div>

      <div className="space-y-6 mt-8">
        {years.length > 0 ? (
          years.map(year => {
            const recordsForYear = incomesByYear[year];
            const expenses = annualExpenses[year] || 0;

            if (!recordsForYear || recordsForYear.length === 0) return null; 

            return (
              <YearlySavingsCard 
                key={year}
                year={year}
                incomeRecords={recordsForYear}
                totalExpenses={expenses}
                onEdit={(y) => {
                  setEditingYear(y);
                  document.getElementById('entry-form').scrollIntoView({ behavior: 'smooth' });
                }}
                onDelete={handleDeleteYear}
              />
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-400 font-bold">
            No financial data available yet.
          </div>
        )}
      </div>
    </div>
  );
}