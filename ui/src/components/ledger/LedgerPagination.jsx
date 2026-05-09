import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function LedgerPagination({ currentPage, setCurrentPage, totalPages, itemsPerPage, totalRecords }) {
  if (totalPages <= 1) return null;

  return (
    <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
      <span className="text-xs font-bold text-gray-500">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalRecords)}
      </span>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-bold text-gray-700 px-2">Page {currentPage} of {totalPages}</span>
        <button 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}