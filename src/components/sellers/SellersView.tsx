import React, { useState, useEffect, useCallback } from 'react';
import {
  Table as TableIcon,
  Filter,
  ArrowUpDown,
  Zap,
  Sparkles,
  Search,
  SlidersHorizontal,
  Plus,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { SellersTable } from './SellersTable';
import { SellersFilterDrawer } from './SellersFilterDrawer';
import { BulkActionsBar } from './BulkActionsBar';
import { AddSellerModal } from './AddSellerModal';
import { TableSkeleton } from '../common/SkeletonLoader';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getSellersPaginated,
  bulkUpdateSellerStatus,
} from '../../lib/db/sellers';
import { exportSellersToCSV } from '../../lib/utils/csv';
import { Seller, SellerStatus } from '../../types';
import { DocumentSnapshot } from 'firebase/firestore';

const BATCH_SIZE = 40;

export const SellersView: React.FC = () => {
  const {
    filters,
    setFilters,
    resetFilters,
    selectedSellerId,
    setSelectedSellerId,
    isAddSellerOpen,
    setIsAddSellerOpen,
    refreshKey,
    triggerRefresh,
  } = useCRM();

  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Data & Infinite Scroll State
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  // Selection & Modals
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);

  // Initial fetch of 40 records
  const fetchInitialSellers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSellersPaginated({
        filters,
        pageSize: BATCH_SIZE,
        direction: 'next',
        currentUser,
      });

      setSellers(res.sellers);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: any) {
      console.error('Error loading stores:', err);
      error('Failed to load stores', err?.message);
    } finally {
      setLoading(false);
    }
  }, [filters, currentUser, error]);

  // Load next 40 records when scrolling to bottom sentinel
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    try {
      setLoadingMore(true);
      const res = await getSellersPaginated({
        filters,
        pageSize: BATCH_SIZE,
        lastDoc,
        direction: 'next',
        currentUser,
      });

      setSellers((prev) => [...prev, ...res.sellers]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: any) {
      console.error('Error loading more stores:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc, filters, currentUser]);

  useEffect(() => {
    fetchInitialSellers();
    setSelectedIds([]);
  }, [filters, refreshKey, fetchInitialSellers]);

  // Bulk Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === sellers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sellers.map((s) => s.id));
    }
  };

  const handleBulkStatusUpdate = async (status: SellerStatus) => {
    try {
      const count = await bulkUpdateSellerStatus(selectedIds, status, currentUser);
      success('Status Updated', `Updated status of ${count} stores to "${status}".`);
      setSelectedIds([]);
      triggerRefresh();
    } catch (err: any) {
      error('Status Update Failed', err?.message);
    }
  };

  const handleExportSelected = () => {
    const selectedSellers = sellers.filter((s) => selectedIds.includes(s.id));
    exportSellersToCSV(selectedSellers, `vipto-crm-database-${Date.now()}.csv`);
    success('Export Initiated', `Exported ${selectedSellers.length} records to CSV.`);
  };

  const hasActiveFilters = Boolean(
    filters.city ||
      filters.category ||
      filters.sellerStatus ||
      filters.onboardingStatus ||
      filters.priority ||
      filters.leadSource ||
      filters.searchQuery
  );

  return (
    <div className="space-y-3.5 w-full max-w-full mx-auto pb-16 animate-fade-in font-sans">
      {/* 1. Header Title matching screenshot: Crm Database */}
      <div className="pt-1 pb-1">
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
          Crm Database
        </h1>
      </div>

      {/* 2. Notion-style View Bar & Action Buttons matching screenshot */}
      <div className="flex items-center justify-between gap-3 border-b border-[#262626] pb-2">
        {/* Active View Tab: Table */}
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f1f1f] text-white font-medium text-xs border border-[#333333] shadow-sm">
            <TableIcon className="w-3.5 h-3.5 text-[#9e9e9e]" />
            <span>Table</span>
          </button>
        </div>

        {/* Right toolbar controls matching screenshot: Filter, Sort, Zap, Sparkles, Search, Sliders, + New */}
        <div className="flex items-center gap-1.5 text-xs text-[#999]">
          {/* Search Toggle */}
          {isSearchOpen ? (
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Search database..."
                value={filters.searchQuery || ''}
                onChange={(e) => setFilters((p) => ({ ...p, searchQuery: e.target.value }))}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-2.5 py-1 text-xs text-white placeholder-[#666] focus:outline-none w-48"
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setFilters((p) => ({ ...p, searchQuery: '' }));
                }}
                className="text-[#666] hover:text-white text-[10px] absolute right-2 top-1.5"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 hover:text-white rounded hover:bg-[#1f1f1f] transition-colors"
              title="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Filter */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`p-1.5 rounded hover:bg-[#1f1f1f] transition-colors ${
              hasActiveFilters ? 'text-blue-400' : 'hover:text-white'
            }`}
            title="Filter database"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>

          {/* Sort */}
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
              }))
            }
            className="p-1.5 hover:text-white rounded hover:bg-[#1f1f1f] transition-colors"
            title="Sort"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          {/* Automations / Lightning */}
          <button
            onClick={() => success('Automations Active', 'Real-time database triggers connected.')}
            className="p-1.5 hover:text-white rounded hover:bg-[#1f1f1f] transition-colors"
            title="Automations"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>

          {/* AI / Ask */}
          <button
            onClick={() => success('Vipto AI', 'Database analytics & insights ready.')}
            className="p-1.5 hover:text-white rounded hover:bg-[#1f1f1f] transition-colors"
            title="AI Insights"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Options / Properties */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="p-1.5 hover:text-white rounded hover:bg-[#1f1f1f] transition-colors"
            title="Properties"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Blue + New button matching screenshot */}
          <button
            onClick={() => {
              setEditingSeller(null);
              setIsAddSellerOpen(true);
            }}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#2383e2] hover:bg-[#1d6fc2] text-white font-semibold text-xs shadow-md transition-all ml-1"
          >
            <span>New</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* Active Filter Notice */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#1f1f1f] border border-[#333] text-xs text-[#aaa]">
          <span>Filters active on database.</span>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        </div>
      )}

      {/* Main Table with Quick Add 1st Row and Infinite Scroll */}
      {loading && sellers.length === 0 ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="space-y-0">
          <SellersTable
            sellers={sellers}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onSelectSeller={(id) => setSelectedSellerId(id)}
            onEditSeller={(seller) => {
              setEditingSeller(seller);
              setIsAddSellerOpen(true);
            }}
            onSortChange={(field) =>
              setFilters((prev) => ({
                ...prev,
                sortBy: field,
                sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
              }))
            }
            sortField={filters.sortBy || 'createdAt'}
            sortDirection={filters.sortDirection || 'desc'}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
          />
        </div>
      )}

      {/* Filter Drawer */}
      <SellersFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
      />

      {/* Bulk Actions Floating Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onOpenAssignModal={() => {}}
        onBulkStatusChange={handleBulkStatusUpdate}
        onExportSelected={handleExportSelected}
      />

      {/* Add / Edit Seller Modal (Clean with only requested options) */}
      <AddSellerModal
        isOpen={isAddSellerOpen}
        onClose={() => {
          setIsAddSellerOpen(false);
          setEditingSeller(null);
        }}
        sellerToEdit={editingSeller}
      />
    </div>
  );
};
