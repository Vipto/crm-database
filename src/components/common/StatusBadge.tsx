import React from 'react';
import {
  SellerStatus,
  ContactStatus,
  OnboardingStatus,
  LeadPriority,
} from '../../types';

interface StatusBadgeProps {
  status: SellerStatus | ContactStatus | OnboardingStatus | LeadPriority | string;
  type?: 'seller' | 'contact' | 'onboarding' | 'priority' | 'role' | 'source';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'seller',
  size = 'md',
}) => {
  const getBadgeStyle = (): string => {
    switch (status) {
      // Seller Statuses
      case 'New':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Researching':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'Contacted':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'Interested':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'Follow-up Required':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Onboarding Started':
        return 'bg-teal-500/15 text-teal-400 border-teal-500/30';
      case 'Onboarded':
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Not Interested':
      case 'Lost':
      case 'Rejected':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'Invalid Lead':
      case 'Unresponsive':
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';

      // Contact Statuses
      case 'Call Connected':
      case 'WhatsApp Replied':
      case 'Visited In Person':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'WhatsApp Sent':
      case 'Meeting Scheduled':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'Call Not Answered':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Not Contacted':
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';

      // Onboarding Statuses
      case 'Documents Verified':
      case 'Agreement Signed':
      case 'Go Live Ready':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Documents Pending':
      case 'Catalog Creation':
      case 'Pricing & Margin Setup':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Not Started':
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';

      // Priorities
      case 'Urgent':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-semibold';
      case 'High':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-medium';
      case 'Medium':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Low':
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';

      // Roles
      case 'admin':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30 uppercase tracking-wider font-semibold';
      case 'manager':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 uppercase tracking-wider font-semibold';
      case 'employee':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 uppercase tracking-wider font-semibold';

      // Task Statuses
      case 'In Progress':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'Pending':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Overdue':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-semibold';

      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm font-medium'
      : 'px-2.5 py-1 text-xs font-medium';

  const dotColor = (): string => {
    switch (status) {
      case 'Onboarded':
      case 'Completed':
      case 'Call Connected':
      case 'WhatsApp Replied':
        return 'bg-emerald-400';
      case 'New':
      case 'Researching':
        return 'bg-blue-400';
      case 'Follow-up Required':
      case 'Pending':
      case 'High':
        return 'bg-amber-400';
      case 'Urgent':
      case 'Overdue':
      case 'Lost':
      case 'Not Interested':
        return 'bg-rose-400';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${sizeClasses} ${getBadgeStyle()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor()}`} />
      <span>{status}</span>
    </span>
  );
};
