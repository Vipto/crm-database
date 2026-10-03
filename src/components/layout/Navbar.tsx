import React, { useState } from 'react';
import {
  Search,
  Plus,
  Database,
  UserCheck,
  Bell,
  RefreshCw,
  Compass,
  CheckSquare,
  Shield,
  Briefcase,
  User,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { seedViptoDatabase } from '../../lib/db/seed';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const {
    filters,
    setFilters,
    setCurrentView,
    setIsAddSellerOpen,
    triggerRefresh,
  } = useCRM();

  const { success, error, info } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [searchVal, setSearchVal] = useState(filters.searchQuery || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, searchQuery: searchVal }));
    setCurrentView('sellers');
  };

  const handleSeedDatabase = async () => {
    if (isSeeding) return;
    try {
      setIsSeeding(true);
      info('Loading Crm Database...', 'Importing real store records into Firestore');
      await seedViptoDatabase();
      success('Database Ready!', 'All real store records from Crm Database are now live.');
      triggerRefresh();
    } catch (err: any) {
      console.error(err);
      error('Failed to seed database', err?.message || 'Firestore write error');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <header className="h-16 bg-[#0d0f12]/90 backdrop-blur-xl border-b border-[#222730] px-6 flex items-center justify-between gap-4 sticky top-0 z-30 font-sans">
      {/* Global CRM Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stores by name, category, phone, link..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#14171d] border border-[#2b3342] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
          />
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Seed Real Data Button */}
        <button
          type="button"
          onClick={handleSeedDatabase}
          disabled={isSeeding}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-500/30 bg-blue-950/30 hover:bg-blue-900/50 text-blue-300 text-xs font-medium transition-all shadow-sm disabled:opacity-50 hover:border-blue-500/50"
          title="Import real store records from Crm Database into Firestore"
        >
          <Database className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : 'text-blue-400'}`} />
          <span>{isSeeding ? 'Importing Data...' : 'Import Real Data'}</span>
        </button>

        {/* Quick Add Store Button */}
        <button
          type="button"
          onClick={() => setIsAddSellerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Store</span>
        </button>

        {/* Refresh button */}
        <button
          type="button"
          onClick={triggerRefresh}
          title="Refresh CRM Data"
          className="p-2 rounded-xl border border-[#2b3342] bg-[#14171d] hover:bg-[#1c2230] text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
