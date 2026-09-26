import React, { useEffect, useState } from 'react';
import {
  Package,
  AlertTriangle,
  AlertCircle,
  FileText,
  ArrowLeftRight,
  Plus,
  Truck,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  MapPin,
  Bot,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { dashboardService, stockService, locationService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { DashboardData, StockResponse, LocationResponse } from '../types';
import { RouteId } from '../components/Sidebar';

interface DashboardViewProps {
  selectedWarehouse?: string;
  onNavigate: (route: RouteId, targetId?: string) => void;
  onOpenNewReceipt: () => void;
  onOpenNewDelivery: () => void;
  onOpenNewTransfer: () => void;
  onOpenAi: () => void;
  refreshKey?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedWarehouse,
  onNavigate,
  onOpenNewReceipt,
  onOpenNewDelivery,
  onOpenNewTransfer,
  onOpenAi,
  refreshKey = 0,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [stocks, setStocks] = useState<StockResponse[]>([]);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, stockRes, locRes] = await Promise.all([
        dashboardService.getDashboard(),
        stockService.list().catch(() => [] as StockResponse[]),
        locationService.list().catch(() => [] as LocationResponse[]),
      ]);
      setData(dashRes);
      setStocks(stockRes || []);
      setLocations(locRes || []);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err?.message || 'Unable to load dashboard data. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <Loader2 size={36} color="#6D28D9" className="animate-spin" />
        <span style={{ color: '#64748B', fontWeight: 500, fontSize: 14 }}>Loading inventory dashboard…</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: 32, textAlign: 'center', background: '#FEF2F2', borderRadius: 12, border: '1px solid #FECACA', margin: '20px 0' }}>
        <AlertCircle size={40} color="#DC2626" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ color: '#991B1B', fontWeight: 700, fontSize: 18 }}>Failed to load dashboard data</h3>
        <p style={{ color: '#7F1D1D', fontSize: 14, margin: '8px 0 20px' }}>{error}</p>
        <button
          onClick={fetchDashboardData}
          className="btn btn-primary"
          style={{ background: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <RefreshCw size={16} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const lowStockItems = data?.lowStockItems || [];
  const recentMovements = data?.recentMovements || [];

  // Compute physical stock by location breakdown
  const locMap: Record<string, { id: number; name: string; quantity: number }> = {};
  let totalStockUnits = 0;
  stocks.forEach((s) => {
    totalStockUnits += s.quantityOnHand;
    const locId = String(s.locationId);
    if (!locMap[locId]) {
      locMap[locId] = { id: s.locationId, name: s.locationName || s.locationCode || 'Storage Rack', quantity: 0 };
    }
    locMap[locId].quantity += s.quantityOnHand;
  });

  const locationBreakdownList = Object.values(locMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 4);

  const colors = ['#6D28D9', '#3B82F6', '#10B981', '#F59E0B', '#94A3B8'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Dashboard Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            Good day, {user?.name ? user.name.split(' ')[0] : 'Manager'} 👋
          </h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            Here's a live overview of your enterprise inventory state.
          </p>
        </div>

        {/* Quick Actions Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onOpenNewReceipt}
            className="btn btn-primary"
            style={{
              background: '#6D28D9',
              padding: '9px 16px',
              boxShadow: '0 2px 6px rgba(109, 40, 217, 0.35)',
            }}
          >
            <Plus size={16} />
            <span>New Receipt</span>
          </button>
          <button
            onClick={onOpenNewDelivery}
            className="btn btn-outline"
            style={{
              padding: '9px 16px',
              borderColor: '#DDD6FE',
              color: '#6D28D9',
              background: '#FFFFFF',
            }}
          >
            <Plus size={16} />
            <span>New Delivery</span>
          </button>
          <button
            onClick={onOpenNewTransfer}
            className="btn btn-outline"
            style={{
              padding: '9px 16px',
              borderColor: '#E2E8F0',
              color: '#334155',
              background: '#FFFFFF',
            }}
          >
            <ArrowLeftRight size={15} />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Row (5 Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {/* KPI 1: Total Products */}
        <div
          className="card"
          onClick={() => onNavigate('products')}
          style={{ padding: '20px', cursor: 'pointer', position: 'relative' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#F5F3FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={22} color="#6D28D9" />
            </div>
            <span style={{ fontSize: 12, color: '#10B981', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
              <TrendingUp size={13} /> Active Catalog
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Total Products</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 2, letterSpacing: '-0.02em' }}>
              {data?.totalProducts ?? 0}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>SKUs managed</div>
          </div>
        </div>

        {/* KPI 2: Low Stock */}
        <div
          className="card"
          onClick={() => onNavigate('risk')}
          style={{ padding: '20px', cursor: 'pointer', borderLeft: '3px solid #F59E0B' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#FFFBEB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={22} color="#F59E0B" />
            </div>
            <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>★ Needs attention</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Low Stock</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 2, letterSpacing: '-0.02em' }}>
              {data?.lowStockCount ?? 0}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>products below threshold</div>
          </div>
        </div>

        {/* KPI 3: Out of Stock */}
        <div
          className="card"
          onClick={() => onNavigate('risk')}
          style={{ padding: '20px', cursor: 'pointer', borderLeft: '3px solid #EF4444' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#FEF2F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={22} color="#EF4444" />
            </div>
            <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>▲ Critical</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Out of Stock</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 2, letterSpacing: '-0.02em' }}>
              {data?.outOfStockCount ?? 0}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>products at zero stock</div>
          </div>
        </div>

        {/* KPI 4: Pending Receipts */}
        <div
          className="card"
          onClick={() => onNavigate('receipts')}
          style={{ padding: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={22} color="#3B82F6" />
            </div>
            <span style={{ fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>inbound queue</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Pending Receipts</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 2, letterSpacing: '-0.02em' }}>
              {data?.pendingReceipts ?? 0}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>incoming orders</div>
          </div>
        </div>

        {/* KPI 5: Pending Transfers / Deliveries */}
        <div
          className="card"
          onClick={() => onNavigate('transfers')}
          style={{ padding: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#F5F3FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeftRight size={22} color="#6D28D9" />
            </div>
            <span style={{ fontSize: 12, color: '#6D28D9', fontWeight: 600 }}>internal moves</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Pending Transfers</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 2, letterSpacing: '-0.02em' }}>
              {data?.pendingTransfers ?? 0}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>active internal moves</div>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid (Left: Risk + Operations | Right: Location + Movements) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card: Inventory Risk Center */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#FEF2F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertCircle size={18} color="#EF4444" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, color: '#0F172A' }}>Inventory Risk Center</h3>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Products needing immediate replenishment</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('risk')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6D28D9',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="table-container" style={{ border: 'none' }}>
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Min / Reorder</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: '#10B981', fontWeight: 500 }}>
                        <CheckCircle2 size={24} style={{ margin: '0 auto 6px', display: 'block' }} />
                        All inventory levels are healthy!
                      </td>
                    </tr>
                  ) : (
                    lowStockItems.slice(0, 5).map((p) => {
                      const isOutOfStock = p.quantityOnHand <= 0;
                      return (
                        <tr key={p.productId}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 8,
                                  background: '#F1F5F9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Package size={17} color="#64748B" />
                              </div>
                              <div>
                                <div
                                  style={{ fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
                                  onClick={() => onNavigate('products', String(p.productId))}
                                >
                                  {p.productName}
                                </div>
                                <div style={{ fontSize: 11.5, color: '#64748B' }}>{p.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: isOutOfStock ? '#EF4444' : '#F59E0B' }}>
                            {p.quantityOnHand} units
                          </td>
                          <td style={{ color: '#64748B', fontSize: 13 }}>
                            {p.reorderLevel} units
                          </td>
                          <td>
                            <span className={`badge ${isOutOfStock ? 'badge-danger' : 'badge-warning'}`}>
                              <span className="badge-dot" />
                              {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => onNavigate('reorder')}
                              className="btn btn-sm btn-outline-purple"
                            >
                              Reorder
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card: Operations Activity */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#F5F3FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={18} color="#6D28D9" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, color: '#0F172A' }}>Recent Operations</h3>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Real-time warehouse movement ledger</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('ledger')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6D28D9',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="table-container" style={{ border: 'none' }}>
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Destination / Partner</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                        No inventory movements recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentMovements.slice(0, 5).map((op) => {
                      const route =
                        op.type === 'RECEIPT'
                          ? 'receipts'
                          : op.type === 'DELIVERY'
                          ? 'deliveries'
                          : op.type === 'INTERNAL'
                          ? 'transfers'
                          : 'adjustments';

                      return (
                        <tr
                          key={op.documentId}
                          style={{ cursor: 'pointer' }}
                          onClick={() => onNavigate(route as RouteId, op.documentId)}
                        >
                          <td style={{ fontWeight: 600, color: '#6D28D9' }}>{op.reference}</td>
                          <td>
                            <span className="badge badge-purple" style={{ fontSize: 11 }}>
                              {op.type}
                            </span>
                          </td>
                          <td style={{ color: '#0F172A', fontWeight: 500 }}>
                            {op.partnerName || op.destinationLocationName || 'Warehouse'}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                op.status === 'DONE'
                                  ? 'badge-success'
                                  : op.status === 'READY'
                                  ? 'badge-info'
                                  : 'badge-warning'
                              }`}
                            >
                              <span className="badge-dot" />
                              {op.status}
                            </span>
                          </td>
                          <td style={{ color: '#64748B', fontSize: 12 }}>
                            {op.createdAt ? new Date(op.createdAt).toLocaleDateString() : 'Today'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card: Stock by Location */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#F5F3FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MapPin size={18} color="#6D28D9" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, color: '#0F172A' }}>Stock by Location</h3>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Physical distribution across facilities</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('stock-location')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6D28D9',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>Hierarchy</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Location List Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {locationBreakdownList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: 13 }}>
                  No stock quantities recorded yet.
                </div>
              ) : (
                locationBreakdownList.map((loc, idx) => {
                  const pct = totalStockUnits > 0 ? Math.round((loc.quantity / totalStockUnits) * 100) : 0;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => onNavigate('stock-location')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: '#F8FAFC',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: '#1E293B' }}>{loc.name}</span>
                        <span style={{ color: '#6D28D9', fontWeight: 700 }}>
                          {loc.quantity.toLocaleString()} units ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: 6, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: colors[idx % colors.length],
                            borderRadius: 4,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Ask StockSense AI Quick Banner */}
          <div
            onClick={onOpenAi}
            style={{
              padding: '18px 20px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
              border: '1px solid #DDD6FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#6D28D9',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(109, 40, 217, 0.3)',
                }}
              >
                <Bot size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#4C1D95' }}>Ask StockSense AI</div>
                <div style={{ fontSize: 12, color: '#6D28D9', marginTop: 2 }}>
                  Instant inventory diagnostics, consumption analysis, and reorder forecasts.
                </div>
              </div>
            </div>
            <ArrowRight size={20} color="#6D28D9" />
          </div>
        </div>
      </div>
    </div>
  );
};
