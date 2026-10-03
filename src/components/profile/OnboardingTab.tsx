import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  FileCheck,
  Building,
  UploadCloud,
  DollarSign,
  FileSignature,
  Rocket,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Seller, OnboardingStatus, SellerStatus } from '../../types';
import { updateSeller } from '../../lib/db/sellers';
import { logActivity } from '../../lib/db/activities';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCRM } from '../../context/CRMContext';

interface OnboardingTabProps {
  seller: Seller;
  onUpdate: (updated: Seller) => void;
}

interface ChecklistItem {
  key: keyof NonNullable<Seller['onboardingChecklist']>;
  label: string;
  description: string;
  icon: React.ElementType;
  associatedStatus: OnboardingStatus;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    key: 'kycVerified',
    label: '1. KYC & Business Verification',
    description: 'GST certificate, Business PAN card, and proprietor ID verification.',
    icon: ShieldCheck,
    associatedStatus: 'Documents Verified',
  },
  {
    key: 'bankDetailsVerified',
    label: '2. Bank Details & Settlement Setup',
    description: 'Cancelled bank cheque or bank statement verified for payout routing.',
    icon: Building,
    associatedStatus: 'Documents Verified',
  },
  {
    key: 'catalogUploaded',
    label: '3. Product Catalog & SKU Ingestion',
    description: 'High resolution product images, variant sizes, descriptions & barcodes.',
    icon: UploadCloud,
    associatedStatus: 'Catalog Creation',
  },
  {
    key: 'pricingAgreed',
    label: '4. Pricing, Margins & Logistics Policy',
    description: 'Wholesale / retail pricing matrix, commission discount agreed.',
    icon: DollarSign,
    associatedStatus: 'Pricing & Margin Setup',
  },
  {
    key: 'contractSigned',
    label: '5. Vipto Seller Agreement / MoU Signed',
    description: 'Executed digital or physical seller merchant terms agreement.',
    icon: FileSignature,
    associatedStatus: 'Agreement Signed',
  },
  {
    key: 'firstOrderPlaced',
    label: '6. Account Activated & Go Live Ready',
    description: 'Seller store published to marketplace with test order dispatch verification.',
    icon: Rocket,
    associatedStatus: 'Completed',
  },
];

export const OnboardingTab: React.FC<OnboardingTabProps> = ({ seller, onUpdate }) => {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();
  const { triggerRefresh } = useCRM();

  const checklist = seller.onboardingChecklist || {
    kycVerified: false,
    bankDetailsVerified: false,
    catalogUploaded: false,
    pricingAgreed: false,
    contractSigned: false,
    firstOrderPlaced: false,
  };

  const [localChecklist, setLocalChecklist] = useState(checklist);
  const [updating, setUpdating] = useState(false);

  const completedCount = Object.values(localChecklist).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  const toggleChecklistItem = async (item: ChecklistItem) => {
    try {
      setUpdating(true);
      const newStatus = !localChecklist[item.key];
      const updatedChecklist = {
        ...localChecklist,
        [item.key]: newStatus,
      };

      setLocalChecklist(updatedChecklist);

      // Determine updated onboarding status and seller status
      const allCompleted = Object.values(updatedChecklist).filter(Boolean).length === CHECKLIST_ITEMS.length;
      let newOnboardingStatus: OnboardingStatus = seller.onboardingStatus;
      let newSellerStatus: SellerStatus = seller.sellerStatus;

      if (allCompleted) {
        newOnboardingStatus = 'Completed';
        newSellerStatus = 'Onboarded';
        // Trigger celebratory confetti!
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Ignore
        }
      } else if (newStatus) {
        newOnboardingStatus = item.associatedStatus;
        if (seller.sellerStatus === 'New' || seller.sellerStatus === 'Contacted' || seller.sellerStatus === 'Interested') {
          newSellerStatus = 'Onboarding Started';
        }
      }

      await updateSeller(
        seller.id,
        {
          onboardingChecklist: updatedChecklist,
          onboardingStatus: newOnboardingStatus,
          sellerStatus: newSellerStatus,
        },
        currentUser
      );

      await logActivity({
        sellerId: seller.id,
        sellerName: seller.shopName || seller.name,
        performedBy: currentUser?.uid || 'user',
        performedByName: currentUser?.displayName || 'CRM Staff',
        action: `${newStatus ? 'Completed' : 'Unchecked'} onboarding step: "${item.label}"`,
        type: 'onboarding',
        details: allCompleted ? 'All 6 onboarding milestones fulfilled! Seller marked as ONBOARDED.' : undefined,
      });

      onUpdate({
        ...seller,
        onboardingChecklist: updatedChecklist,
        onboardingStatus: newOnboardingStatus,
        sellerStatus: newSellerStatus,
      });

      if (allCompleted) {
        success('Seller Fully Onboarded!', `${seller.shopName || seller.name} is now active and live.`);
      } else {
        success('Checklist Updated', `${item.label} updated.`);
      }
      triggerRefresh();
    } catch (err: any) {
      error('Update failed', err?.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-300">
      {/* Onboarding Progress Meter */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Onboarding Completion</span>
              {progressPercent === 100 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>100% Verified</span>
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              {completedCount} of {CHECKLIST_ITEMS.length} verification milestones completed
            </p>
          </div>
          <span className="text-xl font-bold font-['Outfit'] text-vipto-400">
            {progressPercent}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              progressPercent === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-vipto-600 to-cyan-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Interactive Step-by-step Checklist */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Standard Onboarding Verification Steps
        </h4>

        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = Boolean(localChecklist[item.key]);
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                onClick={() => !updating && toggleChecklistItem(item)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                  isChecked
                    ? 'bg-emerald-950/20 border-emerald-500/30 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400 transition-colors" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-semibold text-xs ${
                        isChecked ? 'text-emerald-200' : 'text-slate-200'
                      }`}
                    >
                      {item.label}
                    </span>
                    <div
                      className={`p-1.5 rounded-lg border ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
