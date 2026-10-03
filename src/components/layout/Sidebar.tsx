import React, { useState } from 'react';
import {
  Store,
  Compass,
  BarChart3,
  FileSpreadsheet,
  Settings,
  PlusCircle,
  Database,
} from 'lucide-react';
import { useCRM, SellerSubView } from '../../context/CRMContext';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    sellerSubView,
    setSellerSubView,
    setIsAddSellerOpen,
  } = useCRM();

  const [isSellersExpanded, setIsSellersExpanded] = useState(true);

  const handleSellersClick = () => {
    setCurrentView('sellers');
    setIsSellersExpanded(true);
  };

  const handleSellerSubClick = (subView: SellerSubView) => {
    setCurrentView('sellers');
    setSellerSubView(subView);
  };

  return (
    <aside className="w-64 h-screen bg-[#0d0f12] border-r border-[#222730] flex flex-col shrink-0 select-none font-sans">
      {/* Brand Logo Header with Vipto Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-[#222730] bg-[#0d0f12]">
        <img
          src="/vipto-logo.png"
          alt="Vipto Logo"
          className="w-9 h-9 object-contain rounded-xl shadow-md border border-[#2b3342] bg-[#090b0e]"
        />
        <div>
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 font-['Outfit']">
            Vipto <span className="text-blue-400 font-medium text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">CRM</span>
          </span>
          <p className="text-[10px] text-slate-400 -mt-0.5">Database & Operations</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* CRM Database (Sellers) */}
        <div>
          <button
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
              currentView === 'sellers'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
            onClick={handleSellersClick}
          >
            <div className="flex items-center gap-3">
              <Database className={`w-4 h-4 ${currentView === 'sellers' ? 'text-blue-400' : ''}`} />
              <span className="font-semibold">Crm Database</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
              Live
            </span>
          </button>

          {/* Sub-menu items */}
          {isSellersExpanded && (
            <div className="ml-6 mt-1 space-y-0.5 border-l border-slate-800/80 pl-2">
              <button
                onClick={() => handleSellerSubClick('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  currentView === 'sellers' && sellerSubView === 'all'
                    ? 'text-blue-400 font-semibold bg-slate-900'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>All Stores</span>
              </button>

              <button
                onClick={() => handleSellerSubClick('new')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  currentView === 'sellers' && sellerSubView === 'new'
                    ? 'text-blue-400 font-semibold bg-slate-900'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>New Stores</span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </button>

              <button
                onClick={() => handleSellerSubClick('followups')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  currentView === 'sellers' && sellerSubView === 'followups'
                    ? 'text-blue-400 font-semibold bg-slate-900'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Follow-ups</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </button>

              <button
                onClick={() => handleSellerSubClick('onboarding')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  currentView === 'sellers' && sellerSubView === 'onboarding'
                    ? 'text-blue-400 font-semibold bg-slate-900'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>Onboarding</span>
                <span className="w-2 h-2 rounded-full bg-teal-500" />
              </button>
            </div>
          )}
        </div>

        {/* Research & Discovery */}
        <button
          onClick={() => setCurrentView('research')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
            currentView === 'research'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Compass className={`w-4 h-4 ${currentView === 'research' ? 'text-blue-400' : ''}`} />
          <span>Research & Discovery</span>
        </button>

        {/* Analytics & Metrics */}
        <button
          onClick={() => setCurrentView('analytics')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
            currentView === 'analytics'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <BarChart3 className={`w-4 h-4 ${currentView === 'analytics' ? 'text-blue-400' : ''}`} />
          <span>Analytics</span>
        </button>

        {/* Import & Export */}
        <button
          onClick={() => setCurrentView('import')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
            currentView === 'import'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileSpreadsheet className={`w-4 h-4 ${currentView === 'import' ? 'text-blue-400' : ''}`} />
          <span>Import / Export</span>
        </button>

        {/* Settings & Config */}
        <button
          onClick={() => setCurrentView('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
            currentView === 'settings'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Settings className={`w-4 h-4 ${currentView === 'settings' ? 'text-blue-400' : ''}`} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Quick Add Seller Shortcut in Sidebar */}
      <div className="p-3 border-t border-[#222730] bg-[#0d0f12]">
        <button
          onClick={() => setIsAddSellerOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-900/40 transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Store</span>
        </button>
      </div>
    </aside>
  );
};
