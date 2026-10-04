import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { CRMProvider, useCRM } from './context/CRMContext';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardView } from './components/dashboard/DashboardView';
import { SellersView } from './components/sellers/SellersView';
import { ResearchView } from './components/research/ResearchView';
import { ImportExportView } from './components/import-export/ImportExportView';
import { SettingsView } from './components/settings/SettingsView';
import { SellerProfileDrawer } from './components/profile/SellerProfileDrawer';
import { AddSellerModal } from './components/sellers/AddSellerModal';
import { AddDiscoveredModal } from './components/research/AddDiscoveredModal';
import { checkDatabaseEmpty, seedViptoDatabase } from './lib/db/seed';
import { Seller } from './types';

const CRMAppContent: React.FC = () => {
  const {
    currentView,
    isAddSellerOpen,
    setIsAddSellerOpen,
    isAddDiscoveredOpen,
    setIsAddDiscoveredOpen,
    triggerRefresh,
  } = useCRM();

  const { info, success } = useToast();
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);

  // Safe initial seed: Only populate sample stores if the database is completely empty (0 documents)
  useEffect(() => {
    checkDatabaseEmpty().then((isEmpty) => {
      if (isEmpty) {
        info('Initializing Database', 'Loading initial store records into database...');
        seedViptoDatabase().then(() => {
          success('Vipto CRM Live', 'Database ready with store records!');
          triggerRefresh();
        }).catch(console.error);
      }
    }).catch(console.error);
  }, []);

  return (
    <MainLayout>
      {/* Route Views */}
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'sellers' && <SellersView />}
      {currentView === 'research' && <ResearchView />}
      {currentView === 'analytics' && <DashboardView />}
      {currentView === 'import' && <ImportExportView />}
      {currentView === 'settings' && <SettingsView />}

      {/* Slide-over Seller Profile Drawer */}
      <SellerProfileDrawer
        onEditSeller={(seller) => {
          setEditingSeller(seller);
          setIsAddSellerOpen(true);
        }}
      />

      {/* Global Add / Edit Seller Modal */}
      <AddSellerModal
        isOpen={isAddSellerOpen}
        onClose={() => {
          setIsAddSellerOpen(false);
          setEditingSeller(null);
        }}
        sellerToEdit={editingSeller}
      />

      {/* Global Add Discovered Modal */}
      <AddDiscoveredModal
        isOpen={isAddDiscoveredOpen}
        onClose={() => setIsAddDiscoveredOpen(false)}
      />
    </MainLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CRMProvider>
          <CRMAppContent />
        </CRMProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
