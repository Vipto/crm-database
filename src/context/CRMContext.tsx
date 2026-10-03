import React, { createContext, useContext, useState, useCallback } from 'react';
import { FilterOptions, SellerStatus, OnboardingStatus } from '../types';

export type CRMView =
  | 'dashboard'
  | 'sellers'
  | 'research'
  | 'tasks'
  | 'employees'
  | 'analytics'
  | 'import'
  | 'settings';

export type SellerSubView = 'all' | 'new' | 'followups' | 'onboarding';

interface CRMContextType {
  currentView: CRMView;
  setCurrentView: (view: CRMView) => void;
  sellerSubView: SellerSubView;
  setSellerSubView: (subView: SellerSubView) => void;
  selectedSellerId: string | null;
  setSelectedSellerId: (id: string | null) => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  resetFilters: () => void;
  applyQuickFilter: (newFilters: Partial<FilterOptions>, targetView?: CRMView, subView?: SellerSubView) => void;
  
  // Modals state
  isAddSellerOpen: boolean;
  setIsAddSellerOpen: (open: boolean) => void;
  isAddTaskOpen: boolean;
  setIsAddTaskOpen: (open: boolean) => void;
  isAddDiscoveredOpen: boolean;
  setIsAddDiscoveredOpen: (open: boolean) => void;
  isImportOpen: boolean;
  setIsImportOpen: (open: boolean) => void;
  
  // Refresh trigger
  refreshKey: number;
  triggerRefresh: () => void;
}

const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: '',
  city: '',
  category: '',
  assignedEmployeeId: '',
  sellerStatus: '',
  contactStatus: '',
  onboardingStatus: '',
  leadSource: '',
  priority: '',
  sortBy: 'createdAt',
  sortDirection: 'desc',
};

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<CRMView>('sellers');
  const [sellerSubView, setSellerSubView] = useState<SellerSubView>('all');
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  // Modals
  const [isAddSellerOpen, setIsAddSellerOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddDiscoveredOpen, setIsAddDiscoveredOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const applyQuickFilter = useCallback(
    (newFilters: Partial<FilterOptions>, targetView: CRMView = 'sellers', subView: SellerSubView = 'all') => {
      setFilters((prev) => ({
        ...DEFAULT_FILTERS,
        ...newFilters,
      }));
      setSellerSubView(subView);
      setCurrentView(targetView);
    },
    []
  );

  return (
    <CRMContext.Provider
      value={{
        currentView,
        setCurrentView,
        sellerSubView,
        setSellerSubView,
        selectedSellerId,
        setSelectedSellerId,
        filters,
        setFilters,
        resetFilters,
        applyQuickFilter,
        isAddSellerOpen,
        setIsAddSellerOpen,
        isAddTaskOpen,
        setIsAddTaskOpen,
        isAddDiscoveredOpen,
        setIsAddDiscoveredOpen,
        isImportOpen,
        setIsImportOpen,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error('useCRM must be used within CRMProvider');
  return context;
};
