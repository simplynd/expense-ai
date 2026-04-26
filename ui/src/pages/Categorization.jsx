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
    
    // UI Form States
    const [newCategoryName, setNewCategoryName] = useState("");
    const [cleanVendorName, setCleanVendorName] = useState("");
    const [selectedCategoryName, setSelectedCategoryName] = useState(""); // NEW: Holds selection before saving
    
    const [loading, setLoading] = useState(true);

    // Clear selections whenever the user types in the search box
    useEffect(() => {
        setSelectedIds([]);
    }, [searchTerm]);

    // Auto-fill vendor name AND select existing category when user checks a box
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
        (t.vendor_normalized?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (t.vendor_raw?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    // ACTION 1: Only creates the category and selects it (No assigning)
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const newCat = await transactionService.createCategory(newCategoryName.trim());
            // Update category list and immediately select the new one
            setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedCategoryName(newCat.name);
            setNewCategoryName("");
        } catch (err) {
            console.error(err);
            alert("Failed to create category");
        }
    };

    // ACTION 2: Actually applies the changes to the database
    const handleApplyChanges = async () => {
        if (selectedIds.length === 0) return;
        
        if (!cleanVendorName || !selectedCategoryName) {
            alert("Please provide both a Clean Vendor Name and select a Category before applying.");
            return;
        }

        try {
            // Find the ID of the selected category
            let catId = categories.find(c => c.name.toLowerCase() === selectedCategoryName.toLowerCase())?.id;
            
            // Failsafe in case a category was typed but not "created" via the plus button
            if (!catId) {
                const newCat = await transactionService.createCategory(selectedCategoryName);
                catId = newCat.id;
            }

            // Call backend normalization endpoint
            await transactionService.batchNormalize({
                transaction_ids: selectedIds,
                normalized_vendor: cleanVendorName,
                category_id: catId
            });

            // Instantly update UI table
            setTransactions(prev => prev.map(t => 
                selectedIds.includes(t.id) 
                ? { ...t, category: selectedCategoryName, vendor_normalized: cleanVendorName } 
                : t
            ));

            // Reset form
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
                        selectedCount={selectedIds.length}
                        newCatName={newCategoryName}
                        setNewCatName={setNewCategoryName}
                        cleanVendorName={cleanVendorName}           
                        setCleanVendorName={setCleanVendorName}     
                        selectedCategoryName={selectedCategoryName}       // NEW
                        setSelectedCategoryName={setSelectedCategoryName} // NEW
                        onCreateCategory={handleCreateCategory}           // NEW
                        onApply={handleApplyChanges}                      // NEW
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