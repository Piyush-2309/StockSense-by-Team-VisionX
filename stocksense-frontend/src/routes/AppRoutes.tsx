import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';

// Pages
import Dashboard from '../pages/dashboard/Dashboard';
import Login from '../pages/auth/Login';

import ProductsList from '../pages/catalog/ProductsList';
import ReceiptsList from '../pages/operations/ReceiptsList';
import DeliveriesList from '../pages/operations/DeliveriesList';
import TransfersList from '../pages/operations/TransfersList';
import AdjustmentsList from '../pages/operations/AdjustmentsList';
import LedgerList from '../pages/operations/LedgerList';
import StockOverview from '../pages/inventory/StockOverview';
import StockByLocation from '../pages/inventory/StockByLocation';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          
          <Route path="/products" element={<ProductsList />} />
          
          <Route path="/receipts" element={<ReceiptsList />} />
          <Route path="/deliveries" element={<DeliveriesList />} />
          <Route path="/transfers" element={<TransfersList />} />
          <Route path="/adjustments" element={<AdjustmentsList />} />
          <Route path="/ledger" element={<LedgerList />} />
          
          <Route path="/stock" element={<StockOverview />} />
          <Route path="/stock/by-location" element={<StockByLocation />} />
          
          {/* Manager only routes */}
          <Route element={<ProtectedRoute requiredRole="MANAGER" />}>
            <Route path="/warehouses" element={<div>Warehouses Config</div>} />
            <Route path="/locations" element={<div>Locations Config</div>} />
            <Route path="/categories" element={<div>Categories Config</div>} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
