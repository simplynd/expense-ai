import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  MessageSquare,
  DollarSign,
  PlusCircle 
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Statements from './pages/Statements';
import Categorization from './pages/Categorization';
import AdjunctOutlays from './pages/AdjunctOutlays'; 
import Insights from './pages/Insights';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'statements':
        return <Statements />;
      case 'categorization':
        return <Categorization />;
      case 'adjunct': // 2. ADD THE NEW CASE
        return <AdjunctOutlays />;
      case 'insights':
        return <Insights />
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-brand-bg font-sans text-gray-900">

      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 bg-linear-to-b from-sidebar-start to-sidebar-end text-white flex flex-col shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="font-bold text-white text-lg">E</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Expense Tracker</span>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2">
          <button
            onClick={() => setActivePage('dashboard')}
            className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'dashboard'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setActivePage('statements')}
            className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'statements'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <FileText size={20} />
            <span className="font-medium">Statements</span>
          </button>

          {/* 3. NEW ADJUNCT OUTLAYS BUTTON */}
          <button
            onClick={() => setActivePage('adjunct')}
            className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'adjunct'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <PlusCircle size={20} />
            <span className="font-medium">Adjunct Outlays</span>
          </button>

          <button
            onClick={() => setActivePage('categorization')}
            className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'categorization'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Lightbulb size={20} />
            <span className="font-medium">Categorization</span>
          </button>

          <button 
            onClick={() => setActivePage('insights')}
            className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'insights'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <MessageSquare size={20} />
            <span className="font-medium">Insights / Chat</span>
          </button>
        </nav>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="pt-6 px-8 mb-2">
          <header className="bg-white h-20 rounded-2xl shadow-sm border border-gray-100 flex items-center px-8">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-linear-to-br from-blue-600 to-teal-400 flex items-center justify-center shadow-md shadow-blue-100">
                <DollarSign className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-800 leading-none">
                  {activePage === 'adjunct' ? 'Adjunct Outlays' : activePage.charAt(0).toUpperCase() + activePage.slice(1)}
                </h1>
                <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.15em] mt-1">
                   {activePage === 'adjunct' ? 'Manual Ledger' : 'Analytics Dashboard'}
                </p>
              </div>
            </div>
          </header>
        </div>

        <section className="p-8 overflow-y-auto flex-1">
          <div className="max-w-[1400px] mx-auto">
            {renderPage()}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;