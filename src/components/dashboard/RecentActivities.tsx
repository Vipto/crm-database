import React, { useEffect, useState } from 'react';
import {
  PhoneCall,
  MessageSquare,
  FileText,
  UserPlus,
  RefreshCw,
  CheckCircle,
  Activity as ActivityIcon,
  ChevronRight,
} from 'lucide-react';
import { Activity } from '../../types';
import { getRecentActivities } from '../../lib/db/activities';
import { formatRelativeTime } from '../../lib/utils/formatters';
import { useCRM } from '../../context/CRMContext';

export const RecentActivities: React.FC = () => {
  const { setSelectedSellerId, refreshKey } = useCRM();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function loadActivities() {
      setLoading(true);
      const res = await getRecentActivities(12);
      if (mounted) {
        setActivities(res);
        setLoading(false);
      }
    }
    loadActivities();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />;
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-teal-400" />;
      case 'note':
        return <FileText className="w-3.5 h-3.5 text-indigo-400" />;
      case 'assignment':
        return <UserPlus className="w-3.5 h-3.5 text-purple-400" />;
      case 'onboarding':
        return <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <ActivityIcon className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-vipto-500/10 text-vipto-400 border border-vipto-500/20">
            <ActivityIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Live CRM Activity Feed</h3>
            <p className="text-xs text-slate-400">Real-time team audit trail and seller interactions</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto pr-1">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
            Loading recent team activity...
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No activity logged yet. Click "Seed Sample Data" or create a seller to start!
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              onClick={() => act.sellerId && setSelectedSellerId(act.sellerId)}
              className={`py-3 flex items-start gap-3 transition-colors rounded-lg px-2 -mx-2 ${
                act.sellerId ? 'hover:bg-slate-800/40 cursor-pointer group' : ''
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0 mt-0.5">
                {getActivityIcon(act.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-vipto-300">
                    {act.action}
                  </p>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {formatRelativeTime(act.timestamp)}
                  </span>
                </div>

                {act.details && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {act.details}
                  </p>
                )}

                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                  <span>By <strong className="text-slate-400">{act.performedByName || 'System'}</strong></span>
                  {act.sellerName && (
                    <>
                      <span>•</span>
                      <span className="text-vipto-400/90 font-medium truncate">{act.sellerName}</span>
                    </>
                  )}
                </div>
              </div>

              {act.sellerId && (
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
