import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  Upload,
  UserPlus,
  Compass,
  CheckSquare,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Database,
} from 'lucide-react';
import { MetricCards } from './MetricCards';
import { AnalyticsCharts } from './AnalyticsCharts';
import { RecentActivities } from './RecentActivities';
import { getDashboardMetrics } from '../../lib/db/analytics';
import { DashboardMetrics } from '../../types';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../context/ToastContext';
import { seedViptoDatabase } from '../../lib/db/seed';

export const DashboardView: React.FC = () => {
  const {
    refreshKey,
    setIsAddSellerOpen,
    setIsAddTaskOpen,
    setIsAddDiscoveredOpen,
    setCurrentView,
    triggerRefresh,
  } = useCRM();

  const { success, error, info } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSellers: 0,
    newSellers: 0,
    contactedSellers: 0,
    followUpRequired: 0,
    interestedSellers: 0,
    onboardingInProgress: 0,
    onboardedSellers: 0,
    notInterestedSellers: 0,
    totalEmployees: 0,
    tasksDueToday: 0,
    acquisitionOverTime: [],
    sellersByCity: [],
    sellersByCategory: [],
    onboardingFunnel: [],
    sellersByEmployee: [],
    weeklyAdditions: [],
  });

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchMetrics() {
      setLoading(true);
      const res = await getDashboardMetrics();
      if (active) {
        setMetrics(res);
        setLoading(false);
      }
    }
    fetchMetrics();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const handleSeed = async () => {
    if (seeding) return;
    try {
      setSeeding(true);
      info('Seeding Sample Database', 'Writing realistic sellers and employees to Cloud Firestore');
      await seedViptoDatabase();
      success('Database Seed Complete', 'All metrics have been refreshed with realistic records.');
      triggerRefresh();
    } catch (err: any) {
      error('Failed to seed', err?.message || 'Error writing to Firestore');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vipto-500/10 border border-vipto-500/20 text-vipto-300 text-xs font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 text-vipto-400" />
            <span>Vipto Seller Growth Engine</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight font-['Outfit']">
            Operations & Seller Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Manage your high-volume seller discovery, onboarding progress, follow-up cadence, and team productivity in real-time.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            onClick={() => setIsAddSellerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-vipto-600 hover:bg-vipto-500 text-white text-xs font-semibold shadow-lg shadow-vipto-900/40 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Seller</span>
          </button>

          <button
            onClick={() => setCurrentView('import')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-medium transition-all"
          >
            <Upload className="w-4 h-4 text-vipto-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-all disabled:opacity-50"
          >
            <Database className={`w-4 h-4 text-indigo-400 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Seeding...' : 'Seed Data'}</span>
          </button>
        </div>

        {/* Decorative backdrop glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-vipto-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <MetricCards metrics={metrics} loading={loading} />

      {/* Analytics Visualizations */}
      <AnalyticsCharts metrics={metrics} />

      {/* Recent Team Activity Feed */}
      <RecentActivities />
    </div>
  );
};
