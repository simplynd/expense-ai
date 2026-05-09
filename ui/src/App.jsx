import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  DollarSign,
  PlusCircle,
  Database,
  LineChart,
  PiggyBank,
  PieChart,       // <-- New icon for Portfolio
  BrainCircuit    // <-- New icon for AI Research
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Statements from './pages/Statements';
import Categorization from './pages/Categorization';
import AdjunctOutlays from './pages/AdjunctOutlays';
import MasterLedger from './pages/MasterLedger';
import MultiYearDashboard from './pages/MultiYearDashboard';
import SavingsLedger from './pages/SavingsLedger';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      // GROUP 1
      case 'dashboard': return <Dashboard />;
      case 'multi-year': return <MultiYearDashboard />;
      
      // GROUP 2
      case 'statements': return <Statements />;
      case 'categorization': return <Categorization />;
      case 'adjunct': return <AdjunctOutlays />;
      
      // GROUP 3
      case 'all-expenses': return <MasterLedger />;
      case 'income-savings': return <SavingsLedger />;
      
      // GROUP 4 (Placeholders for our next sprint)
      case 'portfolio': 
        return <div className="flex justify-center py-20 text-gray-400 font-bold">Portfolio Tracker Building in Progress...</div>;
      case 'ai-research': 
        return <div className="flex justify-center py-20 text-gray-400 font-bold">Agentic AI Stock Screener Building in Progress...</div>;
        
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-brand-bg font-sans text-gray-900">

      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="font-bold text-white text-lg">E</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Financial Hub</span>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto pb-8">
          
          {/* GROUP 1: Dashboards */}
          <div className="px-3 pt-2 pb-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">Analytics</div>
          <button onClick={() => setActivePage('dashboard')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <LayoutDashboard size={18} /> <span className="font-medium text-sm">Single Year</span>
          </button>
          <button onClick={() => setActivePage('multi-year')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'multi-year' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <LineChart size={18} /> <span className="font-medium text-sm">Multi-Year</span>
          </button>

          <div className="my-3 border-t border-slate-800 mx-2"></div>

          {/* GROUP 2: Expense Processing */}
          <div className="px-3 pt-2 pb-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">Processing</div>
          <button onClick={() => setActivePage('statements')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'statements' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <FileText size={18} /> <span className="font-medium text-sm">Statements</span>
          </button>
          <button onClick={() => setActivePage('categorization')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'categorization' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Lightbulb size={18} /> <span className="font-medium text-sm">Categorization</span>
          </button>
          <button onClick={() => setActivePage('adjunct')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'adjunct' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <PlusCircle size={18} /> <span className="font-medium text-sm">Adjunct Outlays</span>
          </button>

          <div className="my-3 border-t border-slate-800 mx-2"></div>

          {/* GROUP 3: Ledgers & Income */}
          <div className="px-3 pt-2 pb-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ledgers</div>
          <button onClick={() => setActivePage('all-expenses')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'all-expenses' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Database size={18} /> <span className="font-medium text-sm">All Expenses</span>
          </button>
          <button onClick={() => setActivePage('income-savings')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'income-savings' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <PiggyBank size={18} /> <span className="font-medium text-sm">Income & Net Savings</span>
          </button>

          <div className="my-3 border-t border-slate-800 mx-2"></div>

          {/* GROUP 4: Investments & AI */}
          <div className="px-3 pt-2 pb-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">Wealth & AI</div>
          <button onClick={() => setActivePage('portfolio')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'portfolio' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <PieChart size={18} /> <span className="font-medium text-sm">Family Portfolio</span>
          </button>
          <button onClick={() => setActivePage('ai-research')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${activePage === 'ai-research' ? 'bg-fuchsia-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <BrainCircuit size={18} /> <span className="font-medium text-sm">Agentic Screener</span>
          </button>

        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="pt-6 px-8 mb-2">
          <header className="bg-white h-20 rounded-2xl shadow-sm border border-gray-100 flex items-center px-8">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-teal-400 flex items-center justify-center shadow-md shadow-blue-100">
                <DollarSign className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-800 leading-none">
                  {activePage === 'adjunct' ? 'Adjunct Outlays' : 
                   activePage === 'all-expenses' ? 'All Expenses' : 
                   activePage === 'multi-year' ? 'Multi-Year Dashboard' :
                   activePage === 'income-savings' ? 'Family Income & Savings' :
                   activePage === 'portfolio' ? 'Investment Portfolio' :
                   activePage === 'ai-research' ? 'AI Stock Researcher' :
                   activePage.charAt(0).toUpperCase() + activePage.slice(1)}
                </h1>
                <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.15em] mt-1">
                  {activePage === 'adjunct' ? 'Manual Ledger' : 
                   activePage === 'all-expenses' ? 'Historical Records' : 
                   activePage === 'multi-year' ? 'YoY Trends & Analytics' :
                   activePage === 'income-savings' ? 'NOA & Net Savings Tracker' :
                   activePage === 'portfolio' ? 'Cross-Border Wealth Tracking' :
                   activePage === 'ai-research' ? '7-Gate Agentic Analysis' :
                   'Analytics Dashboard'}
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