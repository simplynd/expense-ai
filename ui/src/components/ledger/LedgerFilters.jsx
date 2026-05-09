import React from 'react';
import { Search, Filter } from 'lucide-react';

export default function LedgerFilters({
  searchQuery, setSearchQuery,
  selectedYear, setSelectedYear,
  selectedCategory, setSelectedCategory,
  minAmount, setMinAmount,
  maxAmount, setMaxAmount,
  filterOptions
}) {
  return (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="flex-1 min-w-[200px] relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text"
          placeholder="Search vendors..."
          className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100">
          <Filter size={14} className="text-gray-400" />
          <select 
            className="bg-transparent border-none text-xs font-bold text-gray-600 outline-none cursor-pointer" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="All">All Years</option>
            {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100">
          <select 
            className="bg-transparent border-none text-xs font-bold text-gray-600 outline-none cursor-pointer w-32 truncate" 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Uncategorized">Uncategorized</option>
            {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Amount Range */}
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            placeholder="Min $" 
            className="w-20 bg-gray-50 border-none rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500" 
            value={minAmount} 
            onChange={(e) => setMinAmount(e.target.value)} 
          />
          <span className="text-gray-300">-</span>
          <input 
            type="number" 
            placeholder="Max $" 
            className="w-20 bg-gray-50 border-none rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500" 
            value={maxAmount} 
            onChange={(e) => setMaxAmount(e.target.value)} 
          />
        </div>
      </div>
    </div>
  );
}