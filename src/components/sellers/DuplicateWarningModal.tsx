import React from 'react';
import { AlertTriangle, ExternalLink, ShieldAlert, Store, Phone, MapPin } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Seller } from '../../types';
import { formatPhoneNumber } from '../../lib/utils/formatters';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSeller: Seller;
  matchedFields: string[];
  onViewExisting: (sellerId: string) => void;
  onCreateAnyway: () => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  onClose,
  existingSeller,
  matchedFields,
  onViewExisting,
  onCreateAnyway,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Possible Duplicate Seller Found"
      subtitle="The system found an existing seller in the database matching this record."
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Matched on: {matchedFields.join(', ').toUpperCase()}</span>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 space-y-2 text-slate-200">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-vipto-400 shrink-0" />
              <span className="font-bold text-sm text-white">{existingSeller.shopName || existingSeller.name}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{existingSeller.city} ({existingSeller.area || existingSeller.state || 'India'})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-mono text-slate-300">{formatPhoneNumber(existingSeller.phone)}</span>
            </div>
          </div>

          <p className="text-[11px] text-amber-300/80 leading-relaxed">
            Existing record already managed by{' '}
            <strong className="text-white">{existingSeller.assignedEmployeeName || 'Unassigned'}</strong> with status:{' '}
            <strong className="text-white">{existingSeller.sellerStatus}</strong>.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCreateAnyway}
              className="px-3.5 py-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-colors font-medium"
            >
              Create Anyway
            </button>

            <button
              type="button"
              onClick={() => onViewExisting(existingSeller.id)}
              className="flex items-center gap-1.5 px-4 py-2 bg-vipto-600 hover:bg-vipto-500 text-white font-semibold rounded-xl shadow-lg shadow-vipto-900/30 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Existing</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
