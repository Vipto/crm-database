import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Download,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SellerStatus } from '../../types';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onOpenAssignModal: () => void;
  onBulkStatusChange: (status: SellerStatus) => void;
  onExportSelected: () => void;
  onBulkDelete?: () => void;
}

const BULK_STATUS_OPTIONS: SellerStatus[] = [
  'Contacted',
  'Interested',
  'Follow-up Required',
  'Onboarding Started',
  'Onboarded',
  'Not Interested',
];

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
  onOpenAssignModal,
  onBulkStatusChange,
  onExportSelected,
}) => {
  const { canBulkAssign } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-vipto-500/40 rounded-2xl shadow-2xl p-2.5 px-5 flex items-center gap-4 animate-slide-up text-xs">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
        <span className="w-6 h-6 rounded-full bg-vipto-600 text-white font-bold flex items-center justify-center text-[11px]">
          {selectedCount}
        </span>
        <span className="font-semibold text-white">Sellers Selected</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Assign Employee */}
        {canBulkAssign && (
          <button
            onClick={onOpenAssignModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700 font-medium"
          >
            <Users className="w-3.5 h-3.5 text-vipto-400" />
            <span>Assign Employee</span>
          </button>
        )}

        {/* Change Status */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            if (e.target.value) {
              onBulkStatusChange(e.target.value as SellerStatus);
              setSelectedStatus('');
            }
          }}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-vipto-500 cursor-pointer"
        >
          <option value="">Update Status...</option>
          {BULK_STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              Mark as {st}
            </option>
          ))}
        </select>

        {/* Export Selected */}
        <button
          onClick={onExportSelected}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700 font-medium"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export CSV</span>
        </button>
      </div>

      <button
        onClick={onClearSelection}
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-2"
        title="Deselect all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
