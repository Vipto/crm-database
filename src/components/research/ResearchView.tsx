import React, { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  Search,
  MapPin,
  Tag,
  Phone,
  ArrowRight,
  UserCheck,
  Building2,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { AddDiscoveredModal } from './AddDiscoveredModal';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { TableSkeleton } from '../common/SkeletonLoader';
import { Seller } from '../../types';
import { getSellersPaginated, updateSeller } from '../../lib/db/sellers';
import { formatCRMDate, formatPhoneNumber, getWhatsAppLink, getTelLink } from '../../lib/utils/formatters';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const ResearchView: React.FC = () => {
  const {
    isAddDiscoveredOpen,
    setIsAddDiscoveredOpen,
    setSelectedSellerId,
    refreshKey,
    triggerRefresh,
  } = useCRM();

  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [discoveredLeads, setDiscoveredLeads] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadResearchLeads() {
      setLoading(true);
      try {
        const res = await getSellersPaginated({
          filters: {
            sellerStatus: 'Researching',
            city: cityFilter || undefined,
            searchQuery: searchQuery || undefined,
          },
          pageSize: 50,
          currentUser,
        });
        if (mounted) {
          setDiscoveredLeads(res.sellers);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    loadResearchLeads();
    return () => {
      mounted = false;
    };
  }, [refreshKey, cityFilter, searchQuery]);

  const handlePromoteToActive = async (seller: Seller, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateSeller(seller.id, { sellerStatus: 'Contacted' }, currentUser);
      success('Lead Promoted', `"${seller.shopName || seller.name}" moved to Active Contacted Pipeline.`);
      triggerRefresh();
    } catch (err: any) {
      error('Failed to promote lead', err?.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-slate-800/80 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Market Discovery Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-['Outfit']">
            Seller Research & Intelligence
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Track potential merchants discovered across local wholesale markets, Google Maps, indiamart, and field scouting visits.
          </p>
        </div>

        <button
          onClick={() => setIsAddDiscoveredOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-vipto-600 hover:from-cyan-500 hover:to-vipto-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 transition-all hover:scale-105 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Scout New Seller</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search research leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Cities</option>
            <option value="Pune">Pune</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi NCR">Delhi NCR</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Ahmedabad">Ahmedabad</option>
            <option value="Surat">Surat</option>
            <option value="Jaipur">Jaipur</option>
          </select>
        </div>
      </div>

      {/* Leads Grid / Cards */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : discoveredLeads.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No Research Leads in Queue"
          description="There are currently no sellers under active discovery. Click 'Scout New Seller' to record your field research!"
          actionText="Scout New Seller"
          onAction={() => setIsAddDiscoveredOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discoveredLeads.map((seller) => (
            <div
              key={seller.id}
              onClick={() => setSelectedSellerId(seller.id)}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900 transition-all duration-200 cursor-pointer shadow-card space-y-3 group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors truncate">
                      {seller.shopName || seller.name}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{seller.name}</p>
                  </div>
                  <StatusBadge status={seller.leadSource} type="source" size="sm" />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-500" />
                    <span>{seller.category}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{seller.city}</span>
                    {seller.area && <span>({seller.area})</span>}
                  </span>
                </div>

                {seller.researchNotes && (
                  <p className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                    {seller.researchNotes}
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <a
                    href={getTelLink(seller.phone)}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {formatPhoneNumber(seller.phone)}
                  </span>
                </div>

                <button
                  onClick={(e) => handlePromoteToActive(seller, e)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-semibold text-xs transition-all hover:scale-105"
                  title="Promote to Active Lead"
                >
                  <span>Promote</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Discovered Modal */}
      <AddDiscoveredModal
        isOpen={isAddDiscoveredOpen}
        onClose={() => setIsAddDiscoveredOpen(false)}
      />
    </div>
  );
};
