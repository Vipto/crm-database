import React from 'react';
import { Filter, X, RotateCcw, Check } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Employee, FilterOptions, LeadPriority, LeadSource, OnboardingStatus, SellerStatus } from '../../types';

interface SellersFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CITIES = ['All Cities', 'Pune', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'Ahmedabad', 'Surat', 'Jaipur', 'Hyderabad', 'Chennai', 'Kolkata'];
const CATEGORIES = ['All Categories', 'Fashion', 'Footwear', 'Electronics', 'Mobile', 'Sports', 'Jewelry', 'Home & Living', 'Beauty & Personal Care', 'Groceries', 'Handicrafts'];
const SELLER_STATUSES: (SellerStatus | 'All Statuses')[] = [
  'All Statuses',
  'Not started',
  'New',
  'Contacted',
  'Interested',
  'Follow-up Required',
  'Onboarding Started',
  'Onboarded',
  'Not Interested',
];
const PRIORITIES: (LeadPriority | 'All Priorities')[] = ['All Priorities', 'Urgent', 'High', 'Medium', 'Low'];
const LEAD_SOURCES: (LeadSource | 'All Sources')[] = [
  'All Sources',
  'Field Research',
  'Google Maps',
  'Instagram',
  'Indiamart',
  'Justdial',
  'Referral',
  'Inbound',
  'Trade Show',
  'CSV Import',
];

export const SellersFilterDrawer: React.FC<SellersFilterDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { filters, setFilters, resetFilters } = useCRM();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-vipto-400" />
              <h3 className="text-sm font-semibold text-white">Advanced Seller Filters</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Controls Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* City */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">City / Location</label>
              <select
                value={filters.city || 'All Cities'}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    city: e.target.value === 'All Cities' ? '' : e.target.value,
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-vipto-500"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Category</label>
              <select
                value={filters.category || 'All Categories'}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    category: e.target.value === 'All Categories' ? '' : e.target.value,
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-vipto-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Seller Status */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Store Status</label>
              <select
                value={filters.sellerStatus || 'All Statuses'}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sellerStatus: e.target.value === 'All Statuses' ? '' : (e.target.value as SellerStatus),
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-vipto-500"
              >
                {SELLER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Lead Priority</label>
              <select
                value={filters.priority || 'All Priorities'}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priority: e.target.value === 'All Priorities' ? '' : (e.target.value as LeadPriority),
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-vipto-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Lead Source */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Lead Source</label>
              <select
                value={filters.leadSource || 'All Sources'}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    leadSource: e.target.value === 'All Sources' ? '' : (e.target.value as LeadSource),
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-vipto-500"
              >
                {LEAD_SOURCES.map((ls) => (
                  <option key={ls} value={ls}>
                    {ls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-vipto-600 hover:bg-vipto-500 rounded-xl shadow-lg shadow-vipto-900/30 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
