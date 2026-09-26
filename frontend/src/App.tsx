import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { StockSenseAiDrawer } from './components/StockSenseAiDrawer';
import { GoldenDemoWidget } from './components/GoldenDemoWidget';

// Views
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { ProductDetailView } from './views/ProductDetailView';
import { ReceiptsView } from './views/ReceiptsView';
import { DeliveriesView } from './views/DeliveriesView';
import { TransfersView } from './views/TransfersView';
import { AdjustmentsView } from './views/AdjustmentsView';
import { StockLedgerView } from './views/StockLedgerView';
import { StockOverviewView } from './views/StockOverviewView';
import { StockByLocationView } from './views/StockByLocationView';
import { CycleCountsView } from './views/CycleCountsView';
import { RiskCenterView } from './views/RiskCenterView';
import { ReorderView } from './views/ReorderView';
import { WarehousesView } from './views/WarehousesView';
import { LocationsView } from './views/LocationsView';
import { CategoriesView } from './views/CategoriesView';
import { ReorderingRulesView } from './views/ReorderingRulesView';
import { ProfileView } from './views/ProfileView';
import { AuthView } from './views/AuthView';
import { Sparkles, Bot } from 'lucide-react';
import { dashboardService, warehouseService } from './services/api';

import type { RouteId } from './components/Sidebar';
import type { WarehouseResponse, UserRole } from './types';

// ========================
// Loading spinner shown while restoring session
// ========================
const AuthLoadingScreen: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: '#F8F9FC',
      flexDirection: 'column',
      gap: 16,
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 14px rgba(109, 40, 217, 0.4)',
        animation: 'pulse 1.5s infinite',
      }}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <polygon points="12,3 20,7.5 12,12 4,7.5" fill="#DDD6FE" />
        <polygon points="4,7.5 12,12 12,21 4,16.5" fill="#A78BFA" />
        <polygon points="12,12 20,7.5 20,16.5 12,21" fill="#8B5CF6" />
      </svg>
    </div>
    <span style={{ color: '#6D28D9', fontWeight: 600, fontSize: 14 }}>Loading StockSense…</span>
  </div>
);

// ========================
// Main Application (authenticated)
// ========================
const MainApplication: React.FC = () => {
  const { showToast } = useToast();
  const { user, logout } = useAuth();

  // Router & Entity State
  const [currentRoute, setCurrentRoute] = useState<RouteId>('dashboard');
  const [targetEntityId, setTargetEntityId] = useState<string | undefined>(undefined);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');

  // Global refresh counter — incremented after mutations to trigger re-fetches
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isGoldenDemoOpen, setIsGoldenDemoOpen] = useState(false);

  // Quick Action Modal Triggers
  const [openNewReceiptModal, setOpenNewReceiptModal] = useState(false);
  const [openNewDeliveryModal, setOpenNewDeliveryModal] = useState(false);
  const [openNewTransferModal, setOpenNewTransferModal] = useState(false);
  const [selectedProductForAction, setSelectedProductForAction] = useState<string | undefined>(undefined);

  const handleNavigate = (route: RouteId, targetId?: string) => {
    setCurrentRoute(route);
    setTargetEntityId(targetId);
    // Reset modal flags so they don't re-trigger on navigation
    setOpenNewReceiptModal(false);
    setOpenNewDeliveryModal(false);
    setOpenNewTransferModal(false);
    setSelectedProductForAction(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    pendingReceipts: 0,
    pendingTransfers: 0,
    pendingDeliveries: 0,
    risksCount: 0,
  });

  React.useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await warehouseService.list();
        setWarehouses(data);
      } catch (err) {
        console.error('Failed to fetch warehouses', err);
      }
    };
    fetchWarehouses();
  }, []);

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await dashboardService.getDashboard();
        setDashboardStats({
          pendingReceipts: data.pendingReceipts || 0,
          pendingTransfers: data.pendingTransfers || 0,
          pendingDeliveries: data.pendingDeliveries || 0,
          risksCount: (data.lowStockCount || 0) + (data.outOfStockCount || 0),
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      }
    };
    fetchDashboard();
  }, [refreshKey]);

  const handleLogout = () => {
    logout();
    showToast('info', 'Signed Out', 'You have been signed out successfully.');
  };

  // Build user object for topbar
  const topbarUser = user
    ? user
    : { id: 0, name: '', email: '', role: 'MANAGER' as UserRole };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        pendingReceipts={dashboardStats.pendingReceipts}
        pendingTransfers={dashboardStats.pendingTransfers}
        pendingDeliveries={dashboardStats.pendingDeliveries}
        risksCount={dashboardStats.risksCount}
      />

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Topbar */}
        <Topbar
          warehouses={warehouses}
          selectedWarehouse={selectedWarehouse}
          onSelectWarehouse={setSelectedWarehouse}
          user={topbarUser}
          unreadNotificationsCount={0}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAi={() => setIsAiOpen(true)}
          onOpenGoldenDemo={() => setIsGoldenDemoOpen(true)}
          onResetData={() => {}}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />

        {/* Dynamic Route View */}
        <main className="page-content">
          {currentRoute === 'dashboard' && (
            <DashboardView
              selectedWarehouse={selectedWarehouse}
              onNavigate={handleNavigate}
              refreshKey={refreshKey}
              onOpenNewReceipt={() => {
                setOpenNewReceiptModal(true);
                setCurrentRoute('receipts');
              }}
              onOpenNewDelivery={() => {
                setOpenNewDeliveryModal(true);
                setCurrentRoute('deliveries');
              }}
              onOpenNewTransfer={() => {
                setOpenNewTransferModal(true);
                setCurrentRoute('transfers');
              }}
              onOpenAi={() => setIsAiOpen(true)}
            />
          )}

          {currentRoute === 'products' && !targetEntityId && (
            <ProductsView
              onNavigate={handleNavigate}
              refreshKey={refreshKey}
              onOpenTransferForProduct={(prodId) => {
                setSelectedProductForAction(prodId);
                setOpenNewTransferModal(true);
                setCurrentRoute('transfers');
              }}
              onOpenAdjustmentForProduct={(prodId) => {
                setSelectedProductForAction(prodId);
                setCurrentRoute('adjustments');
              }}
            />
          )}

          {currentRoute === 'products' && targetEntityId && (
            <ProductDetailView
              productId={targetEntityId}
              onNavigate={handleNavigate}
              refreshKey={refreshKey}
              onOpenReceiptForProduct={(prodId) => {
                setSelectedProductForAction(prodId);
                setOpenNewReceiptModal(true);
                setCurrentRoute('receipts');
              }}
              onOpenTransferForProduct={(prodId) => {
                setSelectedProductForAction(prodId);
                setOpenNewTransferModal(true);
                setCurrentRoute('transfers');
              }}
              onOpenAdjustmentForProduct={(prodId) => {
                setSelectedProductForAction(prodId);
                setCurrentRoute('adjustments');
              }}
            />
          )}

          {currentRoute === 'receipts' && (
            <ReceiptsView
              onNavigate={handleNavigate}
              openNewModalOnLoad={openNewReceiptModal}
              refreshKey={refreshKey}
              onMutationSuccess={triggerRefresh}
            />
          )}

          {currentRoute === 'deliveries' && (
            <DeliveriesView
              onNavigate={handleNavigate}
              openNewModalOnLoad={openNewDeliveryModal}
              refreshKey={refreshKey}
              onMutationSuccess={triggerRefresh}
            />
          )}

          {currentRoute === 'transfers' && (
            <TransfersView
              onNavigate={handleNavigate}
              openNewModalOnLoad={openNewTransferModal}
              preselectedProductId={selectedProductForAction}
              refreshKey={refreshKey}
              onMutationSuccess={triggerRefresh}
            />
          )}

          {currentRoute === 'adjustments' && (
            <AdjustmentsView
              onNavigate={handleNavigate}
              preselectedProductId={selectedProductForAction}
              refreshKey={refreshKey}
              onMutationSuccess={triggerRefresh}
            />
          )}

          {currentRoute === 'stock' && <StockOverviewView onNavigate={handleNavigate} refreshKey={refreshKey} />}
          {currentRoute === 'stock-location' && (
            <StockByLocationView
              onNavigate={handleNavigate}
              refreshKey={refreshKey}
              onOpenTransferForProduct={(prodId) => {
                setSelectedProductForAction(prodId);
                setOpenNewTransferModal(true);
                setCurrentRoute('transfers');
              }}
              onOpenAdjustmentForProduct={(prodId) => {
                setSelectedProductForAction(prodId);
                setCurrentRoute('adjustments');
              }}
            />
          )}
          {currentRoute === 'ledger' && <StockLedgerView onNavigate={handleNavigate} refreshKey={refreshKey} />}
          {currentRoute === 'cycle-counts' && <CycleCountsView onNavigate={handleNavigate} />}
          {currentRoute === 'risk' && (
            <RiskCenterView
              onNavigate={handleNavigate}
              refreshKey={refreshKey}
              onOpenReceiptForProduct={(prodId) => {
                setSelectedProductForAction(prodId);
                setOpenNewReceiptModal(true);
                setCurrentRoute('receipts');
              }}
            />
          )}
          {currentRoute === 'reorder' && (
            <ReorderView
              onNavigate={handleNavigate}
              refreshKey={refreshKey}
              onOpenReceiptForProduct={(prodId) => {
                setSelectedProductForAction(prodId);
                setOpenNewReceiptModal(true);
                setCurrentRoute('receipts');
              }}
            />
          )}
          {currentRoute === 'warehouses' && <WarehousesView onNavigate={handleNavigate} refreshKey={refreshKey} />}
          {currentRoute === 'locations' && <LocationsView onNavigate={handleNavigate} refreshKey={refreshKey} />}
          {currentRoute === 'categories' && <CategoriesView refreshKey={refreshKey} />}
          {currentRoute === 'reordering-rules' && <ReorderingRulesView />}
          {currentRoute === 'profile' && <ProfileView onNavigate={handleNavigate} />}
        </main>
      </div>

      {/* Floating Quick Demo Scenario Helper Button */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 90,
          display: 'flex',
          gap: 10,
        }}
      >
        <button
          onClick={() => setIsAiOpen(true)}
          style={{
            height: 46,
            padding: '0 16px',
            borderRadius: 24,
            background: '#FFFFFF',
            color: '#6D28D9',
            border: '1.5px solid #DDD6FE',
            boxShadow: '0 4px 14px rgba(109, 40, 217, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <Bot size={18} />
          <span>Ask AI</span>
        </button>

        <button
          onClick={() => setIsGoldenDemoOpen(true)}
          style={{
            height: 46,
            padding: '0 20px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 4px 16px rgba(109, 40, 217, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 13.5,
          }}
        >
          <Sparkles size={17} />
          <span>Golden Demo Guide</span>
        </button>
      </div>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={[]}
        onMarkRead={() => {}}
        onMarkAllRead={() => {}}
        onNavigate={handleNavigate}
      />

      <StockSenseAiDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onNavigate={handleNavigate}
      />

      <GoldenDemoWidget
        isOpen={isGoldenDemoOpen}
        onClose={() => setIsGoldenDemoOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

// ========================
// Root — auth gate
// ========================
const AppRouter: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return <AuthView />;
  return <MainApplication />;
};

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
