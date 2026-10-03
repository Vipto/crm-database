import React, { useState } from 'react';
import { Compass, Store, MapPin, Phone, Globe, Tag, Sparkles, Check, ShieldAlert } from 'lucide-react';
import { Modal } from '../common/Modal';
import { DuplicateWarningModal } from '../sellers/DuplicateWarningModal';
import { LeadSource, Seller } from '../../types';
import { checkSellerDuplicates, createSeller } from '../../lib/db/sellers';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCRM } from '../../context/CRMContext';
import { cleanPhoneNumber, isValidIndianPhone } from '../../lib/utils/validation';

interface AddDiscoveredModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const SOURCES: LeadSource[] = [
  'Field Research',
  'Google Maps',
  'Instagram',
  'Indiamart',
  'Justdial',
  'Referral',
  'Trade Show',
];

export const AddDiscoveredModal: React.FC<AddDiscoveredModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const { triggerRefresh, setSelectedSellerId } = useCRM();

  const [formData, setFormData] = useState({
    shopName: '',
    name: '',
    phone: '',
    whatsapp: '',
    category: 'Fashion',
    city: 'Pune',
    area: '',
    address: '',
    websiteUrl: '',
    instagramUrl: '',
    leadSource: 'Field Research' as LeadSource,
    researchNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<{
    isOpen: boolean;
    existingSeller?: Seller;
    matchedFields: string[];
  }>({ isOpen: false, matchedFields: [] });

  const handleSubmit = async (e: React.FormEvent, forceSave: boolean = false) => {
    e.preventDefault();
    if (!formData.shopName && !formData.name) {
      error('Required', 'Please specify a Business / Shop Name.');
      return;
    }
    if (!formData.phone || !isValidIndianPhone(formData.phone)) {
      error('Invalid Phone', 'Please provide a valid 10-digit Indian phone number.');
      return;
    }

    try {
      setLoading(true);

      // Pre-check duplicates
      if (!forceSave) {
        const dupCheck = await checkSellerDuplicates({
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          shopName: formData.shopName,
          city: formData.city,
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

      const cleanPh = cleanPhoneNumber(formData.phone);
      const cleanWa = formData.whatsapp ? cleanPhoneNumber(formData.whatsapp) : cleanPh;

      const newId = await createSeller(
        {
          name: formData.name || formData.shopName,
          shopName: formData.shopName || formData.name,
          phone: cleanPh,
          whatsapp: cleanWa,
          category: formData.category,
          city: formData.city,
          area: formData.area,
          address: formData.address,
          websiteUrl: formData.websiteUrl || undefined,
          socialLinks: {
            instagram: formData.instagramUrl || undefined,
          },
          leadSource: formData.leadSource,
          sellerStatus: 'Researching',
          contactStatus: 'Not Contacted',
          onboardingStatus: 'Not Started',
          priority: 'Medium',
          researcherId: currentUser?.uid,
          researcherName: currentUser?.displayName,
          researchNotes: formData.researchNotes,
        } as any,
        currentUser
      );

      success('Lead Recorded', `Added "${formData.shopName || formData.name}" to Research Pipeline.`);
      triggerRefresh();
      onClose();
      setSelectedSellerId(newId);
    } catch (err: any) {
      error('Failed to save lead', err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Add Discovered Seller (Market Research)"
        subtitle="Log sellers discovered via field visits, Google Maps, Instagram, or trade directories."
        maxWidth="2xl"
      >
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Shop / Brand Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pune Antique Jewellers"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Owner / Contact Name</label>
              <input
                type="text"
                placeholder="e.g. Anand Joshi"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Contact Phone <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Primary Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                City <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pune"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Area / Market Location</label>
              <input
                type="text"
                placeholder="e.g. MG Road, Camp"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Discovery Source</label>
              <select
                value={formData.leadSource}
                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value as LeadSource })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Instagram / Website Link</label>
              <input
                type="text"
                placeholder="https://instagram.com/shop or URL"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">
              Field Researcher Notes & Observations
            </label>
            <textarea
              rows={2}
              placeholder="Products observed, estimated store traffic, key strengths, competitor presence..."
              value={formData.researchNotes}
              onChange={(e) => setFormData({ ...formData, researchNotes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              Discovered by: <strong className="text-white">{currentUser?.displayName || 'Active User'}</strong>
            </span>
            <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-vipto-600 hover:from-cyan-500 hover:to-vipto-500 text-white font-semibold shadow-lg shadow-cyan-950/50 disabled:opacity-50 transition-all hover:scale-105"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Submitting...' : 'Save Discovered Lead'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Duplicate Warning Dialog */}
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
