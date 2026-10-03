import React from 'react';
import {
  MoreVertical,
  Phone,
  MessageSquare,
  Clock,
  User,
  ChevronRight,
  MapPin,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { Seller, SellerStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatCRMDate, getWhatsAppLink, getTelLink } from '../../lib/utils/formatters';
import { updateSeller } from '../../lib/db/sellers';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCRM } from '../../context/CRMContext';

interface SellerKanbanProps {
  sellers: Seller[];
  onSelectSeller: (id: string) => void;
}

const KANBAN_STAGES: { id: SellerStatus; title: string; color: string }[] = [
  { id: 'New', title: 'New Leads', color: 'border-blue-500/40 text-blue-400 bg-blue-500/5' },
  { id: 'Researching', title: 'Researching', color: 'border-purple-500/40 text-purple-400 bg-purple-500/5' },
  { id: 'Contacted', title: 'Contacted', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/5' },
  { id: 'Interested', title: 'Interested', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/5' },
  { id: 'Follow-up Required', title: 'Follow-up Due', color: 'border-amber-500/40 text-amber-400 bg-amber-500/5' },
  { id: 'Onboarding Started', title: 'In Onboarding', color: 'border-teal-500/40 text-teal-400 bg-teal-500/5' },
  { id: 'Onboarded', title: 'Onboarded Live', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5' },
];

export const SellerKanban: React.FC<SellerKanbanProps> = ({ sellers, onSelectSeller }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const { triggerRefresh } = useCRM();

  const handleMoveStage = async (seller: Seller, nextStage: SellerStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateSeller(seller.id, { sellerStatus: nextStage }, currentUser);
      success('Pipeline Stage Updated', `Moved "${seller.shopName || seller.name}" to ${nextStage}`);
      triggerRefresh();
    } catch (err: any) {
      error('Failed to move stage', err?.message);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 select-none min-h-[560px]">
      {KANBAN_STAGES.map((stage, stageIdx) => {
        const stageSellers = sellers.filter((s) => s.sellerStatus === stage.id);
        const nextStageObj = KANBAN_STAGES[stageIdx + 1];

        return (
          <div
            key={stage.id}
            className="w-72 shrink-0 flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-card"
          >
            {/* Column Header */}
            <div className={`p-3.5 border-b border-slate-800/80 rounded-t-2xl flex items-center justify-between ${stage.color}`}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-white">{stage.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {stageSellers.length}
                </span>
              </div>
            </div>

            {/* Cards Container */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3 max-h-[620px]">
              {stageSellers.length === 0 ? (
                <div className="py-8 text-center text-slate-600 text-xs italic">
                  No sellers in this stage
                </div>
              ) : (
                stageSellers.map((seller) => (
                  <div
                    key={seller.id}
                    onClick={() => onSelectSeller(seller.id)}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 transition-all duration-200 cursor-pointer shadow-sm group space-y-2.5"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs text-white group-hover:text-vipto-300 truncate">
                          {seller.shopName || seller.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">{seller.name}</p>
                      </div>
                      <StatusBadge status={seller.priority} type="priority" size="sm" />
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        <Tag className="w-2.5 h-2.5 text-slate-500" />
                        <span>{seller.category}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        <MapPin className="w-2.5 h-2.5 text-slate-500" />
                        <span>{seller.city}</span>
                      </span>
                    </div>

                    {/* Communication shortcuts */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-slate-400 text-[10px]">
                      <div className="flex items-center gap-2">
                        <a
                          href={getTelLink(seller.phone)}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded hover:bg-slate-800 hover:text-emerald-400 transition-colors"
                          title="Call Seller"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={getWhatsAppLink(seller.whatsapp || seller.phone)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded hover:bg-slate-800 hover:text-teal-400 transition-colors"
                          title="WhatsApp Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Quick Move Next Button */}
                      {nextStageObj && (
                        <button
                          onClick={(e) => handleMoveStage(seller, nextStageObj.id, e)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-vipto-600 hover:text-white text-[10px] text-slate-400 transition-colors border border-slate-800"
                          title={`Advance to ${nextStageObj.title}`}
                        >
                          <span>Next</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
