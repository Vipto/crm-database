import React, { useState, useEffect } from 'react';
import { Bookmark, Link2, Tag, Phone, Activity, User, Check, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { DuplicateWarningModal } from './DuplicateWarningModal';
import { Employee, Seller, SellerStatus, CREATED_BY_OPTIONS } from '../../types';
import { checkSellerDuplicates, createSeller, updateSeller } from '../../lib/db/sellers';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCRM } from '../../context/CRMContext';
import { cleanPhoneNumber, isValidIndianPhone } from '../../lib/utils/validation';

interface AddSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: Employee[];
  sellerToEdit?: Seller | null;
}

const CATEGORIES = [
  'Fashion',
  'Footwear',
  'Electronics',
  'Jewelry',
  'Home & Living',
  'Beauty & Personal Care',
  'Groceries',
  'Kitchen & Dining',
  'Books & Stationery',
  'Handicrafts',
];

const STATUS_OPTIONS: SellerStatus[] = [
  'Not started',
  'New',
  'Contacted',
  'Interested',
  'Follow-up Required',
  'Onboarding Started',
  'Onboarded',
  'Not Interested',
];

export const AddSellerModal: React.FC<AddSellerModalProps> = ({
  isOpen,
  onClose,
  employees = [],
  sellerToEdit,
}) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const { triggerRefresh, setSelectedSellerId } = useCRM();

  const [formData, setFormData] = useState({
    storeName: '',
    link: '',
    category: 'Fashion',
    whatsapp: '',
    status: 'Not started' as SellerStatus,
    createdBy: 'Vipto',
  });

  const [loading, setLoading] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<{
    isOpen: boolean;
    existingSeller?: Seller;
    matchedFields: string[];
  }>({ isOpen: false, matchedFields: [] });

  useEffect(() => {
    if (sellerToEdit) {
      setFormData({
        storeName: sellerToEdit.shopName || sellerToEdit.name || '',
        link: sellerToEdit.googleMapOrInstagramLink || sellerToEdit.websiteUrl || sellerToEdit.location?.googleMapsUrl || '',
        category: sellerToEdit.category || 'Fashion',
        whatsapp: sellerToEdit.whatsapp || sellerToEdit.phone || '',
        status: sellerToEdit.sellerStatus || 'Not started',
        createdBy: sellerToEdit.createdByName || currentUser?.displayName || 'Vipto',
      });
    } else {
      setFormData({
        storeName: '',
        link: '',
        category: 'Fashion',
        whatsapp: '',
        status: 'Not started',
        createdBy: currentUser?.displayName || 'Vipto',
      });
    }
  }, [sellerToEdit, isOpen, currentUser]);

  const handleSubmit = async (e: React.FormEvent, forceSave: boolean = false) => {
    e.preventDefault();
    if (!formData.storeName.trim()) {
      error('Required', 'Please enter the Store Name.');
      return;
    }
    if (!formData.whatsapp || !isValidIndianPhone(formData.whatsapp)) {
      error('Invalid WhatsApp Number', 'Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    try {
      setLoading(true);

      const cleanWa = cleanPhoneNumber(formData.whatsapp);

      // Pre-check duplicates if not force saved
      if (!sellerToEdit && !forceSave) {
        const dupCheck = await checkSellerDuplicates({
          phone: cleanWa,
          whatsapp: cleanWa,
          shopName: formData.storeName.trim(),
        });

        if (dupCheck.isDuplicate && dupCheck.existingSeller) {
          setDuplicateResult({
            isOpen: true,
            existingSeller: dupCheck.existingSeller,
            matchedFields: dupCheck.matchedFields,
          });
          setLoading(false);
          return;
        }
      }

      // Check if link is google maps or instagram
      const isMap = formData.link.includes('maps') || formData.link.includes('goo.gl');
      const isInstagram = formData.link.includes('instagram.com');

      const payload: any = {
        name: formData.storeName.trim(),
        shopName: formData.storeName.trim(),
        phone: cleanWa,
        whatsapp: cleanWa,
        googleMapOrInstagramLink: formData.link.trim(),
        websiteUrl: formData.link.trim() || '',
        category: formData.category,
        city: 'Pune',
        sellerStatus: formData.status,
        contactStatus: (formData.status === 'Not started' ? 'Not Contacted' : 'Call Connected') as any,
        onboardingStatus: (formData.status === 'Onboarded' ? 'Completed' : 'Not Started') as any,
        priority: 'Medium' as const,
        leadSource: (isInstagram ? 'Instagram' : isMap ? 'Google Maps' : 'Field Research') as any,
        createdByName: formData.createdBy || currentUser?.displayName || 'Vipto',
      };

      if (isMap && formData.link.trim()) {
        payload.location = { googleMapsUrl: formData.link.trim() };
      }
      if (isInstagram && formData.link.trim()) {
        payload.socialLinks = { instagram: formData.link.trim() };
      }

      if (sellerToEdit) {
        await updateSeller(sellerToEdit.id, payload as any, currentUser);
        success('Seller Updated', `Updated "${payload.shopName}".`);
      } else {
        const newId = await createSeller(payload as any, currentUser);
        success('Seller Added', `Added "${payload.shopName}" to CRM database.`);
        setSelectedSellerId(newId);
      }

      triggerRefresh();
      onClose();
    } catch (err: any) {
      console.error(err);
      error('Failed to save', err?.message || 'Firestore write error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={sellerToEdit ? 'Edit Seller Record' : 'New Seller Record'}
        subtitle="Add a new store to the CRM database"
        maxWidth="lg"
      >
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4 text-xs">
          {/* 1. Store Name */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-vipto-400" />
              <span>Store Name</span>
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Classic Shoes, Kaya Collection"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-vipto-500 text-sm font-medium"
            />
          </div>

          {/* 2. Google Map Link / Instagram Account Link */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Map Link / Instagram Account Link</span>
            </label>
            <input
              type="text"
              placeholder="https://maps.app.goo.gl/... or https://www.instagram.com/..."
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-vipto-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 3. Category */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Category</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-vipto-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. WhatsApp Number */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Whatsapp Number</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit WhatsApp number (e.g. 9764586002)"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-vipto-500"
              />
            </div>

            {/* 5. Status */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>Status</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as SellerStatus })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-vipto-500 cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Created By */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>Created by</span>
              </label>
              <select
                value={formData.createdBy}
                onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-vipto-500 cursor-pointer"
              >
                {CREATED_BY_OPTIONS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-900/40 disabled:opacity-50 transition-all hover:scale-105"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : sellerToEdit ? 'Save Changes' : 'Create Record'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Duplicate Alert Modal */}
      {duplicateResult.isOpen && duplicateResult.existingSeller && (
        <DuplicateWarningModal
          isOpen={duplicateResult.isOpen}
          onClose={() => setDuplicateResult({ isOpen: false, matchedFields: [] })}
          existingSeller={duplicateResult.existingSeller}
          matchedFields={duplicateResult.matchedFields}
          onViewExisting={(id) => {
            setDuplicateResult({ isOpen: false, matchedFields: [] });
            onClose();
            setSelectedSellerId(id);
          }}
          onCreateAnyway={() => {
            setDuplicateResult({ isOpen: false, matchedFields: [] });
            const syntheticEvent = { preventDefault: () => {} } as any;
            handleSubmit(syntheticEvent, true);
          }}
        />
      )}
    </>
  );
};
