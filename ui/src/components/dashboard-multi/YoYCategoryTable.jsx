import React from 'react';

export default function YoYCategoryTable({ years, catTotals }) {
  if (years.length === 0) return null;

  // Get all unique categories and sort them alphabetically
  const categories = Object.keys(catTotals).sort((a, b) => a.localeCompare(b));

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Category Breakdown (Year over Year)</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="bg-white border-b border-gray-200">
            <tr className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4 w-1/4">Category</th>
              
              <th className="px-6 py-4 text-right">
                All-Time Total
              </th>
              
              {/* Added subtle column striping to the headers to match the body */}
              {years.map((year, colIndex) => (
                <th key={year} className={`px-6 py-4 text-right ${colIndex % 2 !== 0 ? 'bg-black/[0.03]' : ''}`}>
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, rowIndex) => {
              const allTimeTotal = years.reduce((sum, year) => sum + (catTotals[cat][year] || 0), 0);
              
              // Find the highest spending amount in this specific category across all years
              const amounts = years.map(y => catTotals[cat][y] || 0);
              const maxAmount = Math.max(...amounts);

              // 1. Darker, more visible row zebra-striping
              const rowBg = rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100';

              return (
                <tr key={cat} className={`border-b border-gray-200 hover:bg-blue-50/50 transition-colors ${rowBg}`}>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-300/50 text-gray-700 tracking-wider shadow-sm">
                      {cat}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                    ${allTimeTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {years.map((year, colIndex) => {
                    const amount = catTotals[cat][year] || 0;
                    
                    // 2. Add column striping using a transparent dark layer so it stacks over the row colors
                    const colBg = colIndex % 2 !== 0 ? 'bg-black/[0.03]' : '';
                    
                    // Check if this cell is the highest for this category (and isn't just $0)
                    const isHighest = amount === maxAmount && amount > 0;

                    return (
                      <td 
                        key={year} 
                        className={`px-6 py-4 text-right text-sm transition-all ${colBg} ${
                          isHighest 
                            // 3. Subtle highlight: ONLY text color changes to blue, no background changes
                            ? 'font-black text-blue-600' 
                            : 'font-medium text-gray-600'
                        }`}
                      >
                        ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}