import React, { useState, useEffect } from 'react';
import {
  Store,
  Info,
  Building2,
  Clock,
  CheckSquare,
  Rocket,
  Edit,
  Trash2,
  X,
  Phone,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { Drawer } from '../common/Drawer';
import { BasicInfoTab } from './BasicInfoTab';
import { BusinessInfoTab } from './BusinessInfoTab';
import { ActivityTimelineTab } from './ActivityTimelineTab';
import { TasksTab } from './TasksTab';
import { OnboardingTab } from './OnboardingTab';
import { StatusBadge } from '../common/StatusBadge';
import { Seller } from '../../types';
import { getSellerById } from '../../lib/db/sellers';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';

interface SellerProfileDrawerProps {
  onEditSeller: (seller: Seller) => void;
}

type TabKey = 'basic' | 'business' | 'activity' | 'tasks' | 'onboarding';

export const SellerProfileDrawer: React.FC<SellerProfileDrawerProps> = ({ onEditSeller }) => {
  const { selectedSellerId, setSelectedSellerId, refreshKey } = useCRM();
  const { canDeleteSellers } = useAuth();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!selectedSellerId) {
        setSeller(null);
        return;
      }
      setLoading(true);
      const res = await getSellerById(selectedSellerId);
      if (mounted) {
        setSeller(res);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [selectedSellerId, refreshKey]);

  if (!selectedSellerId) return null;

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'basic', label: 'Basic Info', icon: Info },
    { key: 'business', label: 'Business & Media', icon: Building2 },
    { key: 'activity', label: 'Activity Timeline', icon: Clock },
    { key: 'tasks', label: 'Tasks & Follow-ups', icon: CheckSquare },
    { key: 'onboarding', label: 'Onboarding Checklist', icon: Rocket },
  ];

  return (
    <Drawer
      isOpen={Boolean(selectedSellerId)}
      onClose={() => setSelectedSellerId(null)}
      width="2xl"
      title={
        seller ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-vipto-600/20 border border-vipto-500/30 flex items-center justify-center text-vipto-300 font-bold text-sm shrink-0">
              {seller.shopName?.[0] || 'S'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white truncate">
                  {seller.shopName || seller.name}
                </span>
                <StatusBadge status={seller.sellerStatus} type="seller" size="sm" />
              </div>
              <p className="text-xs text-slate-400 font-normal">
                {seller.name} • {seller.category} ({seller.city})
              </p>
            </div>
          </div>
        ) : (
          'Loading Seller Profile...'
        )
      }
    >
      {loading || !seller ? (
        <div className="p-8 text-center text-slate-500 animate-pulse text-xs">
          Loading seller details from Firestore...
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-950/60 px-6 pt-2 overflow-x-auto select-none">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-vipto-500 text-vipto-400 font-semibold bg-slate-900/50'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="p-6 flex-1 overflow-y-auto">
            {activeTab === 'basic' && (
              <BasicInfoTab
                seller={seller}
                onEdit={() => onEditSeller(seller)}
              />
            )}

            {activeTab === 'business' && (
              <BusinessInfoTab
                seller={seller}
                onUpdate={(up) => setSeller(up)}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityTimelineTab
                seller={seller}
                onUpdate={(up) => setSeller(up)}
              />
            )}

            {activeTab === 'tasks' && <TasksTab seller={seller} />}

            {activeTab === 'onboarding' && (
              <OnboardingTab
                seller={seller}
                onUpdate={(up) => setSeller(up)}
              />
            )}
          </div>

          {/* Bottom Drawer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              Assigned to: <strong className="text-slate-300">{seller.assignedEmployeeName || 'Unassigned'}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onEditSeller(seller);
                  setSelectedSellerId(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Info</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};
