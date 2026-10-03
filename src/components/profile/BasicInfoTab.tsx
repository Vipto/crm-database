import React from 'react';
import {
  User,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Compass,
  Briefcase,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { Seller } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatCRMDate, formatPhoneNumber, getWhatsAppLink, getTelLink, formatRelativeTime } from '../../lib/utils/formatters';

interface BasicInfoTabProps {
  seller: Seller;
  onEdit: () => void;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ seller, onEdit }) => {
  return (
    <div className="space-y-6 text-xs text-slate-300">
      {/* Quick Communication Actions Bar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-vipto-600/20 border border-vipto-500/30 flex items-center justify-center text-vipto-300 font-bold">
            {seller.shopName?.[0] || 'S'}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{seller.shopName || seller.name}</div>
            <div className="text-[11px] text-slate-400">{seller.category} • {seller.city}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getTelLink(seller.phone)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-semibold transition-all hover:scale-105"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call</span>
          </a>

          <a
            href={getWhatsAppLink(seller.whatsapp || seller.phone, `Hello ${seller.name}, reaching out from Vipto.`)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-950/50 hover:bg-teal-900/60 border border-teal-500/30 text-teal-300 font-semibold transition-all hover:scale-105"
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
            <span>WhatsApp</span>
          </a>

          {seller.email && (
            <a
              href={`mailto:${seller.email}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </a>
          )}
        </div>
      </div>

      {/* CRM & Lifecycle Details Card */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <h4 className="text-xs font-bold text-vipto-400 uppercase tracking-wider flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5" />
          <span>CRM & Pipeline Overview</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block mb-1">Seller Status</span>
            <StatusBadge status={seller.sellerStatus} type="seller" size="sm" />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block mb-1">Contact Status</span>
            <StatusBadge status={seller.contactStatus} type="contact" size="sm" />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block mb-1">Onboarding Stage</span>
            <StatusBadge status={seller.onboardingStatus} type="onboarding" size="sm" />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block mb-1">Assigned Employee</span>
            <div className="font-semibold text-slate-200">
              {seller.assignedEmployeeName || 'Unassigned'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block mb-1">Priority</span>
            <StatusBadge status={seller.priority} type="priority" size="sm" />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block mb-1">Lead Source</span>
            <div className="font-medium text-slate-300">{seller.leadSource}</div>
          </div>
        </div>
      </div>

      {/* Contact & Location Information */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <h4 className="text-xs font-bold text-vipto-400 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span>Contact & Store Location</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-500 text-[11px] block">Primary Phone:</span>
            <span className="font-mono text-slate-200 font-medium">{formatPhoneNumber(seller.phone)}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">WhatsApp:</span>
            <span className="font-mono text-slate-200 font-medium">
              {formatPhoneNumber(seller.whatsapp || seller.phone)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Email:</span>
            <span className="text-slate-200">{seller.email || 'None registered'}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">City & State:</span>
            <span className="text-slate-200 font-medium">
              {seller.city}, {seller.state || 'India'}
            </span>
          </div>

          <div className="sm:col-span-2">
            <span className="text-slate-500 text-[11px] block">Full Address:</span>
            <span className="text-slate-200 leading-relaxed">
              {seller.address || `${seller.area || ''}, ${seller.city}`}
            </span>
          </div>

          {seller.location?.googleMapsUrl && (
            <div className="sm:col-span-2">
              <a
                href={seller.location.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-vipto-400 hover:text-vipto-300 font-semibold"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Open in Google Maps ({seller.location.latitude}, {seller.location.longitude})</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Added: {formatCRMDate(seller.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Last Contacted: {formatRelativeTime(seller.lastContactedAt)}</span>
        </div>
      </div>
    </div>
  );
};
