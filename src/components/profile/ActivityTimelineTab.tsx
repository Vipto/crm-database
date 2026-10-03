import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  MessageSquare,
  FileText,
  RefreshCw,
  Plus,
  Send,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Activity, ActivityType, Seller, SellerStatus, ContactStatus } from '../../types';
import { getSellerActivities, logActivity } from '../../lib/db/activities';
import { updateSeller } from '../../lib/db/sellers';
import { formatCRMDate, formatRelativeTime } from '../../lib/utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCRM } from '../../context/CRMContext';
import { serverTimestamp } from 'firebase/firestore';

interface ActivityTimelineTabProps {
  seller: Seller;
  onUpdate: (updated: Seller) => void;
}

export const ActivityTimelineTab: React.FC<ActivityTimelineTabProps> = ({ seller, onUpdate }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const { triggerRefresh } = useCRM();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Log form state
  const [logType, setLogType] = useState<ActivityType>('call');
  const [logNote, setLogNote] = useState('');
  const [callOutcome, setCallOutcome] = useState<ContactStatus>('Call Connected');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadLogs() {
      setLoading(true);
      const res = await getSellerActivities(seller.id, 50);
      if (mounted) {
        setActivities(res);
        setLoading(false);
      }
    }
    loadLogs();
    return () => {
      mounted = false;
    };
  }, [seller.id]);

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logNote.trim() && logType === 'note') return;

    try {
      setSubmitting(true);

      let actionTitle = '';
      let details = logNote.trim();
      let contactStatusUpdate = seller.contactStatus;

      if (logType === 'call') {
        actionTitle = `${currentUser?.displayName || 'Agent'} made a call (${callOutcome})`;
        contactStatusUpdate = callOutcome;
      } else if (logType === 'whatsapp') {
        actionTitle = `${currentUser?.displayName || 'Agent'} sent WhatsApp communication`;
        contactStatusUpdate = 'WhatsApp Sent';
      } else if (logType === 'note') {
        actionTitle = `${currentUser?.displayName || 'Agent'} added a note`;
      }

      await logActivity({
        sellerId: seller.id,
        sellerName: seller.shopName || seller.name,
        performedBy: currentUser?.uid || 'user',
        performedByName: currentUser?.displayName || 'CRM User',
        performedByRole: currentUser?.role || 'employee',
        action: actionTitle,
        details: details,
        type: logType,
      });

      // Update seller's lastContactedAt and contactStatus
      await updateSeller(
        seller.id,
        {
          contactStatus: contactStatusUpdate,
          lastContactedAt: serverTimestamp(),
        },
        currentUser
      );

      const refreshedLogs = await getSellerActivities(seller.id, 50);
      setActivities(refreshedLogs);
      onUpdate({ ...seller, contactStatus: contactStatusUpdate });
      setLogNote('');
      success('Activity Logged', 'Timeline updated with your interaction.');
      triggerRefresh();
    } catch (err: any) {
      error('Failed to log activity', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />;
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-teal-400" />;
      case 'note':
        return <FileText className="w-3.5 h-3.5 text-indigo-400" />;
      case 'status_change':
        return <RefreshCw className="w-3.5 h-3.5 text-blue-400" />;
      case 'onboarding':
        return <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-300">
      {/* Quick Action Logger Box */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <button
            type="button"
            onClick={() => setLogType('call')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              logType === 'call'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Log Call</span>
          </button>

          <button
            type="button"
            onClick={() => setLogType('whatsapp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              logType === 'whatsapp'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Log WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setLogType('note')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              logType === 'note'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
        </div>

        <form onSubmit={handleLogActivity} className="space-y-3">
          {logType === 'call' && (
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Call Result:</label>
              <select
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value as ContactStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-vipto-500"
              >
                <option value="Call Connected">Call Connected (Spoke with Owner)</option>
                <option value="Call Not Answered">Call Not Answered / Switched Off</option>
                <option value="Meeting Scheduled">Meeting Scheduled</option>
                <option value="Visited In Person">Visited Store In Person</option>
              </select>
            </div>
          )}

          <div>
            <textarea
              rows={2}
              required={logType === 'note'}
              placeholder={
                logType === 'call'
                  ? 'Key discussion points, objections, or commitments...'
                  : logType === 'whatsapp'
                  ? 'Content of message or catalog shared...'
                  : 'Write internal team notes or observations...'
              }
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-vipto-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-vipto-600 hover:bg-vipto-500 text-white font-semibold shadow-md shadow-vipto-900/30 disabled:opacity-50 transition-all hover:scale-105"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : 'Post Activity'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Chronological Timeline Stream */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Interaction History & Audit Log</span>
          <span className="text-[10px] font-normal text-slate-500">{activities.length} total events</span>
        </h4>

        {loading ? (
          <div className="py-8 text-center text-slate-500 animate-pulse">Loading timeline events...</div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 text-slate-500">
            No activities recorded yet. Log your first call or note above!
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-6 top-1 p-1 rounded-full bg-slate-900 border border-slate-700 shadow-sm">
                  {getActivityIcon(act.type)}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-200">{act.action}</p>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>

                  {act.details && (
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                      {act.details}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                    <span>
                      Logged by <strong className="text-slate-400">{act.performedByName || 'Staff'}</strong>
                    </span>
                    <span>{formatCRMDate(act.timestamp, 'dd MMM yyyy, hh:mm a')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
