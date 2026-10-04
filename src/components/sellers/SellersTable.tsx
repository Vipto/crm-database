import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Bookmark,
  Menu,
  ListFilter,
  Phone,
  Sun,
  Users,
  Plus,
  Edit2,
  ArrowUpDown,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { Seller, SellerStatus, CREATED_BY_OPTIONS } from '../../types';
import { getWhatsAppLink } from '../../lib/utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { createSeller, updateSeller } from '../../lib/db/sellers';
import { useToast } from '../../context/ToastContext';
import { useCRM } from '../../context/CRMContext';

interface SellersTableProps {
  sellers: Seller[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSelectSeller: (id: string) => void;
  onEditSeller: (seller: Seller) => void;
  onDeleteSeller?: (seller: Seller) => void;
  onSortChange: (field: any) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

const CATEGORY_OPTIONS = [
  'Fashion',
  'Footwear',
  'Electronics',
  'Mobile',
  'Sports',
  'Jewelry',
  'Home & Living',
  'Beauty & Personal Care',
  'Groceries',
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

export const SellersTable: React.FC<SellersTableProps> = ({
  sellers,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSelectSeller,
  onDeleteSeller,
  onSortChange,
  onLoadMore,
  hasMore,
  loadingMore,
}) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const { triggerRefresh } = useCRM();

  // Top 1st Row Quick Add State
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [newRow, setNewRow] = useState({
    storeName: '',
    link: '',
    category: 'Fashion',
    phone: '',
    status: 'Not started' as SellerStatus,
    createdBy: 'Vipto',
  });
  const [savingInline, setSavingInline] = useState(false);

  // Active In-Place Row Editing State for modifying existing rows
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingRowData, setEditingRowData] = useState<{
    storeName: string;
    link: string;
    category: string;
    phone: string;
    status: SellerStatus;
    createdBy: string;
  }>({
    storeName: '',
    link: '',
    category: 'Fashion',
    phone: '',
    status: 'Not started',
    createdBy: 'Vipto',
  });
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  // Infinite Scroll Trigger Ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loadingMore]);

  const isAllSelected = sellers.length > 0 && selectedIds.length === sellers.length;

  // Handle saving a brand new row from the 1st row quick-add
  const handleSaveInlineRow = async () => {
    if (!newRow.storeName.trim()) {
      setIsAddingInline(false);
      return;
    }

    try {
      setSavingInline(true);
      const isMap = newRow.link.includes('maps') || newRow.link.includes('goo.gl');
      const isInstagram = newRow.link.includes('instagram.com');
      const cleanPhone = newRow.phone.replace(/\D/g, '').slice(-10);

      const storePayload: any = {
        name: newRow.storeName.trim(),
        shopName: newRow.storeName.trim(),
        googleMapOrInstagramLink: newRow.link.trim(),
        websiteUrl: newRow.link.trim() || '',
        category: newRow.category || 'Fashion',
        phone: cleanPhone,
        whatsapp: cleanPhone,
        sellerStatus: newRow.status || 'Not started',
        contactStatus: 'Not Contacted',
        onboardingStatus: 'Not Started',
        priority: 'Medium',
        leadSource: isInstagram ? 'Instagram' : isMap ? 'Google Maps' : 'Field Research',
        createdByName: newRow.createdBy.trim() || 'Vipto',
        city: 'Pune',
      };

      if (isMap && newRow.link.trim()) {
        storePayload.location = { googleMapsUrl: newRow.link.trim() };
      }
      if (isInstagram && newRow.link.trim()) {
        storePayload.socialLinks = { instagram: newRow.link.trim() };
      }

      await createSeller(storePayload, currentUser);

      success('Store Added', `Added "${newRow.storeName.trim()}" with creator "${newRow.createdBy.trim()}".`);
      setNewRow({
        storeName: '',
        link: '',
        category: 'Fashion',
        phone: '',
        status: 'Not started',
        createdBy: 'Vipto',
      });
      setIsAddingInline(false);
      triggerRefresh();
    } catch (err: any) {
      error('Failed to save', err?.message);
    } finally {
      setSavingInline(false);
    }
  };

  // Start In-Place Row Edit with existing row data
  const handleStartRowEdit = (seller: Seller, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRowId(seller.id);
    setEditingRowData({
      storeName: seller.shopName || seller.name || '',
      link:
        seller.googleMapOrInstagramLink ||
        seller.websiteUrl ||
        seller.location?.googleMapsUrl ||
        (seller.socialLinks?.instagram ? `https://instagram.com/${seller.socialLinks.instagram}` : '') ||
        '',
      category: seller.category || 'Fashion',
      phone: (seller.whatsapp || seller.phone || '').replace(/\D/g, '').slice(-10),
      status: seller.sellerStatus || 'Not started',
      createdBy: seller.createdByName || 'Vipto',
    });
  };

  const handleCancelRowEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRowId(null);
  };

  // Save In-Place Row Edit
  const handleSaveRowEdit = async (sellerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!editingRowData.storeName.trim()) {
      error('Store Name Required', 'Please enter a valid store name.');
      return;
    }

    try {
      setSavingRowId(sellerId);
      const isMap = editingRowData.link.includes('maps') || editingRowData.link.includes('goo.gl');
      const isInstagram = editingRowData.link.includes('instagram.com');
      const cleanPhone = editingRowData.phone.replace(/\D/g, '').slice(-10);

      const updates: any = {
        name: editingRowData.storeName.trim(),
        shopName: editingRowData.storeName.trim(),
        googleMapOrInstagramLink: editingRowData.link.trim(),
        websiteUrl: editingRowData.link.trim() || '',
        category: editingRowData.category,
        phone: cleanPhone,
        whatsapp: cleanPhone,
        sellerStatus: editingRowData.status,
        createdByName: editingRowData.createdBy.trim() || 'Vipto',
      };

      if (isMap && editingRowData.link.trim()) {
        updates.location = { googleMapsUrl: editingRowData.link.trim() };
      }
      if (isInstagram && editingRowData.link.trim()) {
        updates.socialLinks = { instagram: editingRowData.link.trim() };
      }

      await updateSeller(sellerId, updates, currentUser);
      success('Store Updated', `Updated "${editingRowData.storeName.trim()}".`);
      setEditingRowId(null);
      triggerRefresh();
    } catch (err: any) {
      error('Failed to update store', err?.message);
    } finally {
      setSavingRowId(null);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'fashion':
        return 'bg-[#3e2e28] text-[#e0a899] border border-[#553b32]';
      case 'footwear':
        return 'bg-[#29363d] text-[#93c5fd] border border-[#3b4b57]';
      case 'electronics':
        return 'bg-[#24333b] text-[#67e8f9] border border-[#334b57]';
      case 'mobile':
        return 'bg-[#2b3a32] text-[#86efac] border border-[#3b5244]';
      case 'sports':
        return 'bg-[#3d2a38] text-[#f472b6] border border-[#593b51]';
      case 'jewelry':
        return 'bg-[#3d3324] text-[#fde047] border border-[#594931]';
      default:
        return 'bg-[#33313b] text-[#cbd5e1] border border-[#484454]';
    }
  };

  const getStatusBadge = (status: SellerStatus | string) => {
    switch (status) {
      case 'Not started':
      case 'New':
        return {
          pill: 'bg-[#2a2a2a] text-[#b4b4b4] border border-[#383838]',
          dot: 'bg-[#737373]',
          label: 'Not started',
        };
      case 'Contacted':
        return {
          pill: 'bg-[#1e2f3d] text-[#7dd3fc] border border-[#2b4458]',
          dot: 'bg-[#38bdf8]',
          label: 'Contacted',
        };
      case 'Interested':
        return {
          pill: 'bg-[#262140] text-[#c4b5fd] border border-[#3d3363]',
          dot: 'bg-[#a78bfa]',
          label: 'Interested',
        };
      case 'Follow-up Required':
        return {
          pill: 'bg-[#3d311e] text-[#fcd34d] border border-[#5a482b]',
          dot: 'bg-[#fbbf24]',
          label: 'Follow-up Required',
        };
      case 'Onboarding Started':
        return {
          pill: 'bg-[#1b3834] text-[#5eead4] border border-[#25524b]',
          dot: 'bg-[#2dd4bf]',
          label: 'Onboarding',
        };
      case 'Onboarded':
      case 'Completed':
        return {
          pill: 'bg-[#1b3d2b] text-[#86efac] border border-[#27593c]',
          dot: 'bg-[#4ade80]',
          label: 'Onboarded',
        };
      default:
        return {
          pill: 'bg-[#2a2a2a] text-[#b4b4b4] border border-[#383838]',
          dot: 'bg-[#737373]',
          label: status || 'Not started',
        };
    }
  };

  return (
    <div className="rounded-xl bg-[#141414] border border-[#262626] overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-sans">
          {/* Table Headers */}
          <thead className="bg-[#191919] text-[#999] border-b border-[#2b2b2b] font-medium select-none">
            <tr className="h-9">
              {/* Checkbox */}
              <th className="w-7 px-2 text-center border-r border-[#262626]">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-[#404040] bg-[#1a1a1a] text-blue-500 focus:ring-0 cursor-pointer"
                />
              </th>

              {/* 1. Store Name */}
              <th
                onClick={() => onSortChange('shopName')}
                className="px-2.5 py-2 font-medium text-[#a3a3a3] hover:text-white cursor-pointer transition-colors border-r border-[#262626] min-w-[130px] max-w-[170px]"
              >
                <div className="flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span className="truncate">Store Name</span>
                  <ArrowUpDown className="w-3 h-3 text-[#525252] ml-auto shrink-0" />
                </div>
              </th>

              {/* 2. Google Map Link / Instagram Account */}
              <th className="px-2.5 py-2 font-medium text-[#a3a3a3] border-r border-[#262626] min-w-[160px] max-w-[220px]">
                <div className="flex items-center gap-1.5">
                  <Menu className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span className="truncate">Google Map / Instagram Link</span>
                </div>
              </th>

              {/* 3. Category */}
              <th
                onClick={() => onSortChange('category')}
                className="px-2 py-2 font-medium text-[#a3a3a3] hover:text-white cursor-pointer transition-colors border-r border-[#262626] min-w-[85px] max-w-[110px]"
              >
                <div className="flex items-center gap-1.5">
                  <ListFilter className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span>Category</span>
                </div>
              </th>

              {/* 4. Whatsapp Number */}
              <th className="px-2 py-2 font-medium text-[#a3a3a3] border-r border-[#262626] min-w-[100px] max-w-[120px]">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span>Whatsapp</span>
                </div>
              </th>

              {/* 5. Status */}
              <th
                onClick={() => onSortChange('sellerStatus')}
                className="px-2 py-2 font-medium text-[#a3a3a3] hover:text-white cursor-pointer transition-colors border-r border-[#262626] min-w-[95px] max-w-[120px]"
              >
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span>Status</span>
                </div>
              </th>

              {/* 6. Created by */}
              <th className="px-2 py-2 font-medium text-[#a3a3a3] border-r border-[#262626] min-w-[85px] max-w-[115px]">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span>Created by</span>
                </div>
              </th>

              {/* + Action */}
              <th className="w-12 px-1 py-2 text-center text-[#737373]">
                <button
                  type="button"
                  onClick={() => setIsAddingInline(true)}
                  title="Add new store row"
                  className="hover:text-white transition-colors p-0.5"
                >
                  <Plus className="w-3.5 h-3.5 mx-auto" />
                </button>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#212121]">
            {/* 🌟 1ST ROW: Prominent Click-to-Add Interactive Row */}
            {!isAddingInline ? (
              <tr
                onClick={() => setIsAddingInline(true)}
                className="h-10 bg-[#181818]/80 hover:bg-[#202020] transition-colors cursor-pointer border-b border-[#2b2b2b] text-[#888] hover:text-white group select-none"
              >
                <td className="px-2 text-center border-r border-[#262626]">
                  <Plus className="w-3.5 h-3.5 mx-auto text-blue-400 group-hover:scale-125 transition-transform" />
                </td>
                <td colSpan={7} className="px-3 py-2">
                  <div className="flex items-center gap-2 font-medium text-xs text-slate-300 group-hover:text-blue-400">
                    <span className="font-semibold">+ Click 1st row to add a new store</span>
                    <span className="text-[11px] text-[#666] font-normal hidden md:inline">
                      (Type store name, map/insta link, category, whatsapp, status, created by)
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              /* 🌟 Active 1st Row Inline Input Editor */
              <tr className="h-11 bg-[#1c2230] border-b-2 border-blue-500/80 animate-slide-down">
                {/* Checkbox placeholder */}
                <td className="px-2 text-center border-r border-[#262626]">
                  <Plus className="w-3.5 h-3.5 mx-auto text-blue-400" />
                </td>

                {/* 1. Store Name Input */}
                <td className="px-1.5 py-1 border-r border-[#262626]">
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="Store Name..."
                      value={newRow.storeName}
                      onChange={(e) => setNewRow({ ...newRow, storeName: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveInlineRow();
                        if (e.key === 'Escape') setIsAddingInline(false);
                      }}
                      className="w-full bg-[#121620] border border-[#2b3a55] rounded px-1.5 py-0.5 text-xs text-white placeholder-[#556] focus:outline-none focus:border-blue-400 font-medium"
                    />
                  </div>
                </td>

                {/* 2. Google Map / Instagram Link Input */}
                <td className="px-1.5 py-1 border-r border-[#262626]">
                  <input
                    type="text"
                    placeholder="https://maps... or instagram"
                    value={newRow.link}
                    onChange={(e) => setNewRow({ ...newRow, link: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveInlineRow();
                      if (e.key === 'Escape') setIsAddingInline(false);
                    }}
                    className="w-full bg-[#121620] border border-[#2b3a55] rounded px-1.5 py-0.5 text-xs text-white placeholder-[#556] focus:outline-none focus:border-blue-400 font-mono text-[11px]"
                  />
                </td>

                {/* 3. Category Select */}
                <td className="px-1.5 py-1 border-r border-[#262626]">
                  <select
                    value={newRow.category}
                    onChange={(e) => setNewRow({ ...newRow, category: e.target.value })}
                    className="w-full bg-[#121620] border border-[#2b3a55] rounded px-1 py-0.5 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </td>

                {/* 4. WhatsApp Number Input */}
                <td className="px-1.5 py-1 border-r border-[#262626]">
                  <input
                    type="tel"
                    placeholder="10 digits"
                    value={newRow.phone}
                    onChange={(e) => setNewRow({ ...newRow, phone: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveInlineRow();
                      if (e.key === 'Escape') setIsAddingInline(false);
                    }}
                    className="w-full bg-[#121620] border border-[#2b3a55] rounded px-1.5 py-0.5 text-xs text-white placeholder-[#556] focus:outline-none focus:border-blue-400 font-mono"
                  />
                </td>

                {/* 5. Status Select */}
                <td className="px-1.5 py-1 border-r border-[#262626]">
                  <select
                    value={newRow.status}
                    onChange={(e) => setNewRow({ ...newRow, status: e.target.value as SellerStatus })}
                    className="w-full bg-[#121620] border border-[#2b3a55] rounded px-1 py-0.5 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </td>

                {/* 6. Created By Select */}
                <td className="px-1.5 py-1 border-r border-[#262626]">
                  <select
                    value={newRow.createdBy}
                    onChange={(e) => setNewRow({ ...newRow, createdBy: e.target.value })}
                    className="w-full bg-[#121620] border border-[#2b3a55] rounded px-1 py-0.5 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
                  >
                    {CREATED_BY_OPTIONS.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Action Save/Cancel */}
                <td className="px-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={handleSaveInlineRow}
                      disabled={savingInline}
                      className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
                      title="Save (Enter)"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsAddingInline(false)}
                      className="p-1 rounded text-[#777] hover:text-white"
                      title="Cancel (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Existing Rows from Firestore */}
            {sellers.map((seller) => {
              const isEditing = editingRowId === seller.id;
              const isSelected = selectedIds.includes(seller.id);
              const storeName = seller.shopName || seller.name;
              const link =
                seller.googleMapOrInstagramLink ||
                seller.websiteUrl ||
                seller.location?.googleMapsUrl ||
                (seller.socialLinks?.instagram ? `https://instagram.com/${seller.socialLinks.instagram}` : '');
              const rawPhone = seller.whatsapp || seller.phone || '';
              const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
              const statusInfo = getStatusBadge(seller.sellerStatus);
              const creatorName = seller.createdByName || 'Vipto';

              if (isEditing) {
                return (
                  /* 🌟 In-Place Interactive Row Editor */
                  <tr
                    key={seller.id}
                    className="h-11 bg-[#1a2233] border-y-2 border-blue-500/90 shadow-md"
                  >
                    {/* Checkbox / Edit indicator */}
                    <td className="px-2 text-center border-r border-[#2b3a55]">
                      <Edit2 className="w-3.5 h-3.5 mx-auto text-blue-400 animate-pulse" />
                    </td>

                    {/* 1. Store Name Input */}
                    <td className="px-1.5 py-1 border-r border-[#2b3a55] max-w-[170px]">
                      <input
                        type="text"
                        autoFocus
                        value={editingRowData.storeName}
                        onChange={(e) => setEditingRowData({ ...editingRowData, storeName: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRowEdit(seller.id);
                          if (e.key === 'Escape') handleCancelRowEdit();
                        }}
                        className="w-full bg-[#121620] border border-[#3b4d70] rounded px-1.5 py-1 text-xs text-white placeholder-[#667] focus:outline-none focus:border-blue-400 font-medium"
                      />
                    </td>

                    {/* 2. Google Map / Instagram Link */}
                    <td className="px-1.5 py-1 border-r border-[#2b3a55] max-w-[220px]">
                      <input
                        type="text"
                        value={editingRowData.link}
                        onChange={(e) => setEditingRowData({ ...editingRowData, link: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRowEdit(seller.id);
                          if (e.key === 'Escape') handleCancelRowEdit();
                        }}
                        placeholder="https://..."
                        className="w-full bg-[#121620] border border-[#3b4d70] rounded px-1.5 py-1 text-xs text-white font-mono text-[11px] focus:outline-none focus:border-blue-400"
                      />
                    </td>

                    {/* 3. Category */}
                    <td className="px-1.5 py-1 border-r border-[#2b3a55] min-w-[85px] max-w-[110px]">
                      <select
                        value={editingRowData.category}
                        onChange={(e) => setEditingRowData({ ...editingRowData, category: e.target.value })}
                        className="w-full bg-[#121620] border border-[#3b4d70] rounded px-1 py-1 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 4. WhatsApp Number */}
                    <td className="px-1.5 py-1 border-r border-[#2b3a55] min-w-[100px] max-w-[120px]">
                      <input
                        type="tel"
                        value={editingRowData.phone}
                        onChange={(e) => setEditingRowData({ ...editingRowData, phone: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRowEdit(seller.id);
                          if (e.key === 'Escape') handleCancelRowEdit();
                        }}
                        placeholder="10 digits"
                        className="w-full bg-[#121620] border border-[#3b4d70] rounded px-1.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-400"
                      />
                    </td>

                    {/* 5. Status */}
                    <td className="px-1.5 py-1 border-r border-[#2b3a55] min-w-[95px] max-w-[120px]">
                      <select
                        value={editingRowData.status}
                        onChange={(e) => setEditingRowData({ ...editingRowData, status: e.target.value as SellerStatus })}
                        className="w-full bg-[#121620] border border-[#3b4d70] rounded px-1 py-1 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 6. Created By */}
                    <td className="px-1.5 py-1 border-r border-[#2b3a55] min-w-[85px] max-w-[115px]">
                      <select
                        value={editingRowData.createdBy}
                        onChange={(e) => setEditingRowData({ ...editingRowData, createdBy: e.target.value })}
                        className="w-full bg-[#121620] border border-[#3b4d70] rounded px-1 py-1 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
                      >
                        {CREATED_BY_OPTIONS.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Action Save/Cancel */}
                    <td className="px-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => handleSaveRowEdit(seller.id, e)}
                          disabled={savingRowId === seller.id}
                          className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white shadow transition-all"
                          title="Save changes (Enter)"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancelRowEdit}
                          className="p-1 rounded text-[#888] hover:text-white transition-colors"
                          title="Cancel (Esc)"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={seller.id}
                  onClick={() => onSelectSeller(seller.id)}
                  className={`h-10 hover:bg-[#1a1a1a] transition-colors cursor-pointer group ${
                    isSelected ? 'bg-[#1c2230]' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td
                    className="px-2 text-center border-r border-[#212121]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(seller.id)}
                      className="rounded border-[#404040] bg-[#1a1a1a] text-blue-500 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  {/* 1. Store Name */}
                  <td
                    className="px-2.5 py-1.5 border-r border-[#212121] max-w-[170px]"
                    onDoubleClick={(e) => handleStartRowEdit(seller, e)}
                  >
                    <div
                      className="flex items-center gap-1.5 font-medium text-white group-hover:text-blue-400 transition-colors"
                      title={`${storeName} (Double click to edit)`}
                    >
                      <FileText className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                      <span className="truncate">{storeName}</span>
                    </div>
                  </td>

                  {/* 2. Google Map / Instagram Link */}
                  <td
                    className="px-2.5 py-1.5 border-r border-[#212121] max-w-[220px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {link ? (
                      <a
                        href={link.startsWith('http') ? link : `https://${link}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#9e9e9e] hover:text-white underline underline-offset-2 truncate block font-mono text-[11px]"
                        title={link}
                      >
                        {link}
                      </a>
                    ) : (
                      <span className="text-[#555] italic">—</span>
                    )}
                  </td>

                  {/* 3. Category */}
                  <td
                    className="px-2 py-1.5 border-r border-[#212121]"
                    onDoubleClick={(e) => handleStartRowEdit(seller, e)}
                  >
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium tracking-wide ${getCategoryColor(
                        seller.category
                      )}`}
                    >
                      {seller.category || 'Fashion'}
                    </span>
                  </td>

                  {/* 4. WhatsApp Number */}
                  <td
                    className="px-2 py-1.5 border-r border-[#212121]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {cleanPhone ? (
                      <a
                        href={getWhatsAppLink(cleanPhone, `Hello from Vipto!`)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[#cccccc] hover:text-emerald-400 underline underline-offset-2 text-xs"
                      >
                        {cleanPhone}
                      </a>
                    ) : (
                      <span className="text-[#555]">—</span>
                    )}
                  </td>

                  {/* 5. Status */}
                  <td
                    className="px-2 py-1.5 border-r border-[#212121]"
                    onDoubleClick={(e) => handleStartRowEdit(seller, e)}
                  >
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                      <span className="truncate">{statusInfo.label}</span>
                    </span>
                  </td>

                  {/* 6. Created By */}
                  <td
                    className="px-2 py-1.5 border-r border-[#212121] max-w-[115px]"
                    onDoubleClick={(e) => handleStartRowEdit(seller, e)}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[9px] font-bold text-blue-300 shrink-0">
                        {creatorName[0]}
                      </div>
                      <span className="text-[#d4d4d4] font-medium truncate text-[11px]" title={creatorName}>
                        {creatorName}
                      </span>
                    </div>
                  </td>

                  {/* Row Action: Edit Row */}
                  <td className="px-1 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => handleStartRowEdit(seller, e)}
                        className="p-1 rounded text-[#737373] hover:text-blue-400 hover:bg-[#222] transition-colors"
                        title="Edit store row"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 🚀 Infinite Scroll Auto-Loader Trigger Sentinel */}
      <div ref={loadMoreRef} className="py-4 text-center text-xs text-[#737373] bg-[#141414]">
        {loadingMore ? (
          <div className="flex items-center justify-center gap-2 text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading next 40 rows...</span>
          </div>
        ) : hasMore ? (
          <span className="text-[#555]">Scroll to load more entries...</span>
        ) : sellers.length > 0 ? (
          <span className="text-[#555] font-medium">All {sellers.length} records loaded</span>
        ) : null}
      </div>
    </div>
  );
};
