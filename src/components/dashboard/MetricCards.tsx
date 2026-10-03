import React from 'react';
import {
  Users,
  UserPlus,
  PhoneCall,
  Clock,
  HeartHandshake,
  Rocket,
  CheckCircle2,
  XCircle,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { DashboardMetrics } from '../../types';
import { useCRM } from '../../context/CRMContext';

interface MetricCardsProps {
  metrics: DashboardMetrics;
  loading: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, loading }) => {
  const { applyQuickFilter, setCurrentView } = useCRM();

  const cards = [
    {
      label: 'Total Sellers',
      value: metrics.totalSellers,
      icon: Users,
      color: 'text-vipto-400 bg-vipto-500/10 border-vipto-500/20',
      badge: 'All database',
      onClick: () => applyQuickFilter({}, 'sellers', 'all'),
    },
    {
      label: 'New Sellers',
      value: metrics.newSellers,
      icon: UserPlus,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      badge: 'Uncontacted',
      onClick: () => applyQuickFilter({ sellerStatus: 'New' }, 'sellers', 'new'),
    },
    {
      label: 'Contacted',
      value: metrics.contactedSellers,
      icon: PhoneCall,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      badge: 'In touch',
      onClick: () => applyQuickFilter({ sellerStatus: 'Contacted' }, 'sellers', 'all'),
    },
    {
      label: 'Follow-up Required',
      value: metrics.followUpRequired,
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badge: 'Action needed',
      onClick: () => applyQuickFilter({ sellerStatus: 'Follow-up Required' }, 'sellers', 'followups'),
    },
    {
      label: 'Interested',
      value: metrics.interestedSellers,
      icon: HeartHandshake,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      badge: 'High intent',
      onClick: () => applyQuickFilter({ sellerStatus: 'Interested' }, 'sellers', 'all'),
    },
    {
      label: 'Onboarding in Progress',
      value: metrics.onboardingInProgress,
      icon: Rocket,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      badge: 'In pipeline',
      onClick: () => applyQuickFilter({ sellerStatus: 'Onboarding Started' }, 'sellers', 'onboarding'),
    },
    {
      label: 'Onboarded',
      value: metrics.onboardedSellers,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: 'Live sellers',
      onClick: () => applyQuickFilter({ sellerStatus: 'Onboarded' }, 'sellers', 'all'),
    },
    {
      label: 'Not Interested',
      value: metrics.notInterestedSellers,
      icon: XCircle,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      badge: 'Archived/Lost',
      onClick: () => applyQuickFilter({ sellerStatus: 'Not Interested' }, 'sellers', 'all'),
    },
    {
      label: 'Employees',
      value: metrics.totalEmployees,
      icon: Briefcase,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      badge: 'Active team',
      onClick: () => setCurrentView('employees'),
    },
    {
      label: 'Tasks Due Today',
      value: metrics.tasksDueToday,
      icon: AlertCircle,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badge: "Today's priority",
      onClick: () => setCurrentView('tasks'),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={card.onClick}
            className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900 transition-all duration-200 cursor-pointer group shadow-card hover:shadow-card-hover flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 truncate">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl border ${card.color} shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-white font-['Outfit'] tracking-tight">
                {loading ? '—' : card.value}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
