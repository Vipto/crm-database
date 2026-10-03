import React, { useState } from 'react';
import {
  Store,
  Package,
  Globe,
  Share2,
  Video,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { Seller } from '../../types';
import { uploadSellerDocument } from '../../lib/db/storage';
import { updateSeller } from '../../lib/db/sellers';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCRM } from '../../context/CRMContext';

interface BusinessInfoTabProps {
  seller: Seller;
  onUpdate: (updated: Seller) => void;
}

export const BusinessInfoTab: React.FC<BusinessInfoTabProps> = ({ seller, onUpdate }) => {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();
  const { triggerRefresh } = useCRM();
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadPercent(10);
      info('Uploading image...', 'Uploading shop photo to Firebase Storage');

      const downloadUrl = await uploadSellerDocument(
        seller.id,
        file,
        'images',
        (pct) => setUploadPercent(pct)
      );

      const existingImages = seller.storeImages || [];
      const updatedImages = [...existingImages, downloadUrl];

      await updateSeller(seller.id, { storeImages: updatedImages }, currentUser);
      onUpdate({ ...seller, storeImages: updatedImages });
      success('Image Uploaded', 'Shop photo has been saved to Firebase Storage.');
      triggerRefresh();
    } catch (err: any) {
      error('Upload Failed', err?.message || 'Error uploading to storage');
    } finally {
      setUploading(false);
      setUploadPercent(0);
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-300">
      {/* Business Model & Products */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <h4 className="text-xs font-bold text-vipto-400 uppercase tracking-wider flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5" />
          <span>Business Model & Catalog</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-0.5">Shop Type</span>
            <span className="font-semibold text-white">{seller.shopType || 'Retailer'}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-0.5">Estimated SKUs</span>
            <span className="font-semibold text-white">
              {seller.productCountEstimated || 0} products
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-0.5">Subcategory</span>
            <span className="font-semibold text-white">{seller.subcategory || 'General'}</span>
          </div>
        </div>

        {/* Products Sold Tags */}
        <div className="space-y-1.5 pt-2">
          <span className="text-slate-400 font-medium block">Key Products & Collections:</span>
          <div className="flex flex-wrap gap-1.5">
            {(seller.productsSold && seller.productsSold.length > 0
              ? seller.productsSold
              : ['Standard Category Catalog']
            ).map((p, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-slate-200 font-medium text-xs flex items-center gap-1"
              >
                <Package className="w-3 h-3 text-vipto-400" />
                <span>{p}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Store Description */}
        <div className="space-y-1 pt-2">
          <span className="text-slate-400 font-medium block">Store Overview / Notes:</span>
          <p className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 leading-relaxed text-xs">
            {seller.storeDescription || 'No detailed store description provided yet.'}
          </p>
        </div>
      </div>

      {/* Online Presence & Social Links */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <h4 className="text-xs font-bold text-vipto-400 uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span>Online Footprint & Social Links</span>
        </h4>

        <div className="space-y-2">
          {seller.websiteUrl ? (
            <a
              href={seller.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-vipto-400" />
                <span className="font-medium">{seller.websiteUrl}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          ) : (
            <p className="text-slate-500 text-xs italic">No official website listed.</p>
          )}

          {seller.socialLinks?.instagram && (
            <a
              href={seller.socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-pink-500/40 text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-pink-400" />
                <span>Instagram Profile</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          )}
        </div>
      </div>

      {/* Store Photos & Document Attachments (Firebase Storage) */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-vipto-400 uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Store Photos & Verification Documents</span>
          </h4>

          {/* Upload Button */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-vipto-600/20 hover:bg-vipto-600/30 border border-vipto-500/40 text-vipto-300 font-semibold cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-vipto-400" />
            <span>{uploading ? `${uploadPercent}%` : 'Upload Photo'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {seller.storeImages && seller.storeImages.length > 0 ? (
            seller.storeImages.map((imgUrl, i) => (
              <a
                key={i}
                href={imgUrl}
                target="_blank"
                rel="noreferrer"
                className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group relative block"
              >
                <img
                  src={imgUrl}
                  alt={`Store attachment ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
              </a>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <ImageIcon className="w-6 h-6 mx-auto mb-1.5 text-slate-600" />
              <p>No store photos uploaded yet.</p>
              <p className="text-[11px] text-slate-600">Upload storefront or product display photos above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
