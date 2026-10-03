import React, { useState } from 'react';
import {
  Settings,
  Database,
  Shield,
  Layers,
  Sparkles,
  Server,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { SecurityRulesViewer } from './SecurityRulesViewer';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { seedViptoDatabase } from '../../lib/db/seed';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const SettingsView: React.FC = () => {
  const { triggerRefresh } = useCRM();
  const { currentUser, isAdmin } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'general' | 'pipeline' | 'security'>('general');
  const [seeding, setSeeding] = useState(false);

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      info('Seeding Sample Database', 'Generating realistic sellers, employees, and activities...');
      await seedViptoDatabase();
      success('Database Seeded', 'Realistic seller records and team members are now active.');
      triggerRefresh();
    } catch (err: any) {
      error('Seed Failed', err?.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in text-xs text-slate-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Outfit']">
            CRM Settings & Database Operations
          </h1>
          <p className="text-xs text-slate-400">
            Firebase infrastructure, pipeline stage configurations, and role security.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'general'
              ? 'bg-vipto-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>General & Database</span>
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'pipeline'
              ? 'bg-vipto-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Pipeline & Stages</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'bg-vipto-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Security Rules & RBAC</span>
        </button>
      </div>

      {/* General & Database Tab */}
      {activeTab === 'general' && (
        <div className="space-y-5">
          {/* Firebase Connection Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-sm font-semibold text-white">Firebase Project Connection</h4>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
                ONLINE / CONNECTED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Project ID</span>
                <span className="font-mono text-white font-semibold">vipto-crm</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Auth Domain</span>
                <span className="font-mono text-white font-semibold">vipto-crm.firebaseapp.com</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Storage Bucket</span>
                <span className="font-mono text-white font-semibold">vipto-crm.firebasestorage.app</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Database Engine</span>
                <span className="font-semibold text-white">Cloud Firestore (Scalable Native Mode)</span>
              </div>
            </div>
          </div>

          {/* Seed Sample Data Action Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-vipto-400" />
              <h4 className="text-sm font-semibold text-white">Demo Data Seeder</h4>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Populate Cloud Firestore with realistic verified Indian sellers across Pune, Mumbai, Delhi, Bengaluru, Surat, Ahmedabad, and Jaipur, along with team employees, follow-up tasks, and activity logs.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSeedData}
                disabled={seeding}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-vipto-600 hover:bg-vipto-500 text-white font-semibold shadow-lg shadow-vipto-900/40 disabled:opacity-50 transition-all hover:scale-105"
              >
                <Sparkles className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
                <span>{seeding ? 'Seeding Database...' : 'Seed Sample Sellers & Employees'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Stages Tab */}
      {activeTab === 'pipeline' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Configured Seller Pipeline Stages</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                The structured status pipeline for Vipto merchant acquisition and onboarding.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { stage: '1. New', desc: 'Newly entered lead discovered through research or inbound channels.' },
                { stage: '2. Researching', desc: 'Market discovery team investigating store credentials, traffic, catalog.' },
                { stage: '3. Contacted', desc: 'First phone call or WhatsApp intro delivered to owner.' },
                { stage: '4. Interested', desc: 'Seller expressed positive intent to list products on Vipto.' },
                { stage: '5. Follow-up Required', desc: 'Active conversation with scheduled call or meeting.' },
                { stage: '6. Onboarding Started', desc: 'KYC collection, bank verification, and catalog ingestion in progress.' },
                { stage: '7. Onboarded', desc: 'Contract executed, catalog live, test order verified.' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-200">{item.stage}</span>
                  <span className="text-slate-400 text-xs">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && <SecurityRulesViewer />}
    </div>
  );
};
