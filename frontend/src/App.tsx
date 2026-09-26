import React, { useState, useEffect } from 'react';
import { inventoryEngine } from './services/inventoryEngine';
import { RouteId, Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ToastProvider, useToast } from './components/Toast';
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

const MainApplication: React.FC = () => {
  const { showToast } = useToast();
  const [, setTick] = useState(0);

  // Router & Entity State
  const [currentRoute, setCurrentRoute] = useState<RouteId>('dashboard');
  const [targetEntityId, setTargetEntityId] = useState<string | undefined>(undefined);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');

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

  // Subscribe to real-time inventory engine state
  useEffect(() => {
    const unsubscribe = inventoryEngine.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const handleNavigate = (route: RouteId, targetId?: string) => {
    setCurrentRoute(route);
    setTargetEntityId(targetId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetData = () => {
    inventoryEngine.resetToDefault();
    showToast('info', 'Database Reset', 'State reset to initial demo parameters.');
  };

  // Live Metrics
  const stats = inventoryEngine.getDashboardStats(selectedWarehouse);
  const user = inventoryEngine.getUser();
  const warehouses = inventoryEngine.getWarehouses();
  const notifications = inventoryEngine.getNotifications();
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  if (currentRoute === 'login') {
    return <AuthView onLoginSuccess={() => setCurrentRoute('dashboard')} />;
  }

  return (
    <div className="app-container">
      {/* 1. Dark Purple Enterprise Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        pendingReceipts={stats.pendingReceiptsCount}
        pendingTransfers={stats.pendingTransfersCount}
        pendingDeliveries={stats.pendingDeliveriesCount}
        risksCount={stats.lowStockCount + stats.outOfStockCount}
      />

      {/* 2. Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Topbar */}
        <Topbar
          warehouses={warehouses}
          selectedWarehouse={selectedWarehouse}
          onSelectWarehouse={setSelectedWarehouse}
          user={user}
          unreadNotificationsCount={unreadNotifications}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAi={() => setIsAiOpen(true)}
          onOpenGoldenDemo={() => setIsGoldenDemoOpen(true)}
          onResetData={handleResetData}
          onNavigate={handleNavigate}
        />

        {/* Dynamic Route View */}
        <main className="page-content">
          {currentRoute === 'dashboard' && (
            <DashboardView
              stats={stats}
              selectedWarehouse={selectedWarehouse}
              onNavigate={handleNavigate}
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
            />
          )}

          {currentRoute === 'deliveries' && (
            <DeliveriesView
              onNavigate={handleNavigate}
              openNewModalOnLoad={openNewDeliveryModal}
            />
          )}

          {currentRoute === 'transfers' && (
            <TransfersView
              onNavigate={handleNavigate}
              openNewModalOnLoad={openNewTransferModal}
              preselectedProductId={selectedProductForAction}
            />
          )}

          {currentRoute === 'adjustments' && (
            <AdjustmentsView
              onNavigate={handleNavigate}
              preselectedProductId={selectedProductForAction}
            />
          )}

          {currentRoute === 'stock' && <StockOverviewView onNavigate={handleNavigate} />}
          {currentRoute === 'stock-location' && (
            <StockByLocationView
              onNavigate={handleNavigate}
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
          {currentRoute === 'ledger' && <StockLedgerView onNavigate={handleNavigate} />}
          {currentRoute === 'cycle-counts' && <CycleCountsView onNavigate={handleNavigate} />}
          {currentRoute === 'risk' && (
            <RiskCenterView
              onNavigate={handleNavigate}
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
              onOpenReceiptForProduct={(prodId) => {
                setSelectedProductForAction(prodId);
                setOpenNewReceiptModal(true);
                setCurrentRoute('receipts');
              }}
            />
          )}
          {currentRoute === 'warehouses' && <WarehousesView onNavigate={handleNavigate} />}
          {currentRoute === 'locations' && <LocationsView onNavigate={handleNavigate} />}
          {currentRoute === 'categories' && <CategoriesView />}
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
        notifications={notifications}
        onMarkRead={(id) => inventoryEngine.markNotificationAsRead(id)}
        onMarkAllRead={() => inventoryEngine.markAllNotificationsAsRead()}
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

export function App() {
  return (
    <ToastProvider>
      <MainApplication />
    </ToastProvider>
  );
}

export default App;
