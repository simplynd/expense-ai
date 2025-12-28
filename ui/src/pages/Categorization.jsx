import React, { useState, useEffect, useCallback } from 'react';
import { Filter } from 'lucide-react';
import { transactionService, statementService } from '../services/api';
import CategorySidebar from '../components/categorization/CategorySidebar';
import TransactionTriageTable from '../components/categorization/TransactionTriageTable';

export default function Categorization() {
    const [statements, setStatements] = useState([]);
    const [selectedStatementId, setSelectedStatementId] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);

    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [loading, setLoading] = useState(true);

    // ... inside your Categorization component

    // ADD THIS: Clear selections whenever the user types in the search box
    useEffect(() => {
        setSelectedIds([]);
    }, [searchTerm]);

    // ... rest of your component

    const fetchData = useCallback(async () => {
        try {
            const [stmtRes, catRes] = await Promise.all([
                statementService.listStatements(),
                transactionService.getCategories()
            ]);
            setStatements(stmtRes.data || []);
            setCategories((catRes || []).sort((a, b) => a.name.localeCompare(b.name)));

            if (stmtRes.data?.length > 0 && !selectedStatementId) {
                handleStatementChange(stmtRes.data[0].id);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [selectedStatementId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleStatementChange = async (id) => {
        setSelectedStatementId(id);
        setLoading(true);
        try {
            const data = await statementService.getStatementTransactions(id);
            setTransactions(data || []);
            setSelectedIds([]);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const filteredTransactions = transactions.filter(t =>
        (t.vendor_normalized || t.vendor_raw || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleBulkAssign = async (catName) => {
        const name = catName || newCategoryName;
        if (selectedIds.length === 0 || !name) return;
        try {
            await transactionService.assignCategory({ transaction_ids: selectedIds, category_name: name });
            setTransactions(prev => prev.map(t => selectedIds.includes(t.id) ? { ...t, category: name } : t));
            if (!categories.find(c => c.name.toLowerCase() === name.toLowerCase())) fetchData();
            setSelectedIds([]);
            setNewCategoryName("");
        } catch (err) { alert("Error assigning category"); }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">Bulk Categorization</h2>
                    <p className="text-sm text-gray-500 font-medium">Select a statement and batch-assign categories.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <Filter size={16} className="ml-2 text-gray-400" />
                    <select
                        className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer"
                        value={selectedStatementId || ""}
                        onChange={(e) => handleStatementChange(e.target.value)}
                    >
                        {statements.map(s => <option key={s.id} value={s.id}>{s.filename}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3">
                    <CategorySidebar
                        categories={categories}
                        onAssign={handleBulkAssign}
                        selectedCount={selectedIds.length}
                        newCatName={newCategoryName}
                        setNewCatName={setNewCategoryName}
                    />
                </div>
                <div className="lg:col-span-9">
                    <TransactionTriageTable
                        transactions={filteredTransactions}
                        loading={loading}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedIds={selectedIds}
                        onToggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                        onSelectAll={(checked) => setSelectedIds(checked ? filteredTransactions.map(t => t.id) : [])}
                    />
                </div>
            </div>
        </div>
    );
}