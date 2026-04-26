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

    // NEW Cascading Dropdown States
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedType, setSelectedType] = useState('pdf'); // 'pdf' = Statement, 'manual' = Manual

    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    // UI Form States
    const [newCategoryName, setNewCategoryName] = useState("");
    const [cleanVendorName, setCleanVendorName] = useState("");
    const [selectedCategoryName, setSelectedCategoryName] = useState(""); 
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setSelectedIds([]);
    }, [searchTerm]);

    useEffect(() => {
        if (selectedIds.length > 0) {
            const firstTx = transactions.find(t => t.id === selectedIds[0]);
            if (firstTx) {
                setCleanVendorName(firstTx.vendor_normalized || firstTx.vendor_raw || "");
                setSelectedCategoryName(firstTx.category || "");
            }
        } else {
            setCleanVendorName("");
            setSelectedCategoryName("");
        }
    }, [selectedIds, transactions]);

    const fetchData = useCallback(async () => {
        try {
            const [stmtRes, catRes] = await Promise.all([
                statementService.listStatements(),
                transactionService.getCategories()
            ]);
            setStatements(stmtRes.data || []);
            setCategories((catRes || []).sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // NEW: Filter statements based on Year and Type
    const filteredStatements = statements.filter(s => 
        s.source_type === selectedType && 
        s.filename.includes(selectedYear)
    );

    // NEW: Auto-select logic when dropdowns change
    useEffect(() => {
        if (filteredStatements.length > 0) {
            const currentStillValid = filteredStatements.find(s => s.id === selectedStatementId);
            if (!currentStillValid) {
                handleStatementChange(filteredStatements[0].id);
            }
        } else {
            setSelectedStatementId(null);
            setTransactions([]);
            setSelectedIds([]);
        }
    }, [selectedYear, selectedType, statements]);

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
        (t.vendor_normalized?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (t.vendor_raw?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const newCat = await transactionService.createCategory(newCategoryName.trim());
            setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedCategoryName(newCat.name);
            setNewCategoryName("");
        } catch (err) {
            console.error(err);
            alert("Failed to create category");
        }
    };

    const handleApplyChanges = async () => {
        if (selectedIds.length === 0) return;
        
        if (!cleanVendorName || !selectedCategoryName) {
            alert("Please provide both a Clean Vendor Name and select a Category before applying.");
            return;
        }

        try {
            let catId = categories.find(c => c.name.toLowerCase() === selectedCategoryName.toLowerCase())?.id;
            
            if (!catId) {
                const newCat = await transactionService.createCategory(selectedCategoryName);
                catId = newCat.id;
            }

            await transactionService.batchNormalize({
                transaction_ids: selectedIds,
                normalized_vendor: cleanVendorName,
                category_id: catId
            });

            setTransactions(prev => prev.map(t => 
                selectedIds.includes(t.id) 
                ? { ...t, category: selectedCategoryName, vendor_normalized: cleanVendorName } 
                : t
            ));

            setSelectedIds([]);
            setCleanVendorName("");
            setSelectedCategoryName("");
        } catch (err) { 
            console.error(err);
            alert("Error assigning category and normalizing vendor."); 
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">Statement Triage</h2>
                    <p className="text-sm text-gray-500 font-medium">Clean up missing vendors and batch-assign categories.</p>
                </div>
                
                {/* UPDATED: Cascading Dropdowns */}
                <div className="flex items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <Filter size={16} className="ml-2 mr-1 text-gray-400 shrink-0" />
                    
                    {/* Dropdown 1: Year */}
                    <select
                        className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer border-r border-gray-100 pr-2 pl-2"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {['2023', '2024', '2025', '2026'].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    {/* Dropdown 2: Type */}
                    <select
                        className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer border-r border-gray-100 pr-2 pl-2"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="pdf">Statements</option>
                        <option value="manual">Manual</option>
                    </select>

                    {/* Dropdown 3: File / Bucket */}
                    <select
                        className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer pl-2 max-w-[200px] truncate"
                        value={selectedStatementId || ""}
                        onChange={(e) => handleStatementChange(e.target.value)}
                        disabled={filteredStatements.length === 0}
                    >
                        {filteredStatements.length > 0 ? (
                            filteredStatements.map(s => <option key={s.id} value={s.id}>{s.filename}</option>)
                        ) : (
                            <option value="">No files found</option>
                        )}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3">
                    <CategorySidebar
                        categories={categories}
                        selectedCount={selectedIds.length}
                        newCatName={newCategoryName}
                        setNewCatName={setNewCategoryName}
                        cleanVendorName={cleanVendorName}           
                        setCleanVendorName={setCleanVendorName}     
                        selectedCategoryName={selectedCategoryName}       
                        setSelectedCategoryName={setSelectedCategoryName} 
                        onCreateCategory={handleCreateCategory}           
                        onApply={handleApplyChanges}                      
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