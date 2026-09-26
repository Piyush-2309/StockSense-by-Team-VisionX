import React, { useState, useEffect } from 'react';
import {
  Package,
  ArrowLeft,
  ArrowDownToLine,
  ArrowLeftRight,
  Sliders,
  MapPin,
  Clock,
  TrendingUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { productService, stockService, ledgerService } from '../services/api';
import { ProductResponse, StockResponse, DocumentResponse } from '../types';
import { RouteId } from '../components/Sidebar';

interface ProductDetailViewProps {
  productId: string;
  onNavigate: (route: RouteId, targetId?: string) => void;
  onOpenReceiptForProduct: (productId: string) => void;
  onOpenTransferForProduct: (productId: string) => void;
  onOpenAdjustmentForProduct: (productId: string) => void;
  refreshKey?: number;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  onNavigate,
  onOpenReceiptForProduct,
  onOpenTransferForProduct,
  onOpenAdjustmentForProduct,
  refreshKey = 0,
}) => {
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [stocks, setStocks] = useState<StockResponse[]>([]);
  const [movements, setMovements] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductDetails = async () => {
    const id = Number(productId);
    if (!id || isNaN(id)) {
      setError('Invalid product ID provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [prodRes, stockRes, ledgerRes] = await Promise.all([
        productService.getById(id),
        stockService.byProduct(id).catch(() => [] as StockResponse[]),
        ledgerService.list({ productId: id, size: 20 }).catch(() => ({ content: [] })),
      ]);
      setProduct(prodRes);
      setStocks(stockRes || []);
      setMovements(ledgerRes.content || []);
    } catch (err: any) {
      console.error('Failed to load product details:', err);
      setError(err?.message || 'Could not load product details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId, refreshKey]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 14 }}>
        <Loader2 size={32} color="#6D28D9" className="animate-spin" />
        <span style={{ color: '#64748B', fontSize: 14 }}>Loading product telemetry…</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Package size={48} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
        <h2>Product Not Found</h2>
        <p style={{ color: '#64748B', marginTop: 6 }}>{error || 'The requested product does not exist in inventory.'}</p>
        <button onClick={() => onNavigate('products')} className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Products
        </button>
      </div>
    );
  }

  const totalOnHand = stocks.reduce((acc, s) => acc + s.quantityOnHand, 0);
  const totalReserved = stocks.reduce((acc, s) => acc + s.quantityReserved, 0);
  const totalFree = stocks.reduce((acc, s) => acc + s.quantityFree, 0);

  let badgeClass = 'badge-success';
  let statusText = 'Healthy Stock';
  if (product.stockStatus === 'OUT_OF_STOCK' || totalOnHand <= 0) {
    badgeClass = 'badge-danger';
    statusText = 'Out of Stock';
  } else if (product.stockStatus === 'LOW_STOCK' || totalOnHand <= product.reorderLevel) {
    badgeClass = 'badge-warning';
    statusText = 'Low Stock';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748B' }}>
        <button
          onClick={() => onNavigate('products')}
          style={{
            background: 'none',
            border: 'none',
            color: '#6D28D9',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          Products
        </button>
        <span>/</span>
        <span style={{ color: '#0F172A', fontWeight: 600 }}>{product.name}</span>
      </div>

      {/* Product Hero Header */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#F5F3FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={28} color="#6D28D9" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 24, color: '#0F172A' }}>{product.name}</h1>
              <span className={`badge ${badgeClass}`}>
                <span className="badge-dot" />
                {statusText}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
              SKU: <strong style={{ color: '#6D28D9' }}>{product.sku}</strong> • Category: {product.categoryName} • Unit: {product.unitOfMeasure} • Unit Cost: ${product.unitCost ?? 0}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onOpenReceiptForProduct(String(product.id))}
            className="btn btn-primary"
            style={{ background: '#6D28D9' }}
          >
            <ArrowDownToLine size={16} />
            <span>Receive Stock</span>
          </button>
          <button
            onClick={() => onOpenTransferForProduct(String(product.id))}
            className="btn btn-outline-purple"
          >
            <ArrowLeftRight size={16} />
            <span>Transfer</span>
          </button>
          <button
            onClick={() => onOpenAdjustmentForProduct(String(product.id))}
            className="btn btn-outline"
          >
            <Sliders size={16} />
            <span>Count & Adjust</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>Total On Hand</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {totalOnHand} <span style={{ fontSize: 14, fontWeight: 500, color: '#64748B' }}>{product.unitOfMeasure}</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#10B981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
            <TrendingUp size={12} /> Physical balance
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>Available to Promise</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#6D28D9', marginTop: 4 }}>
            {totalFree} <span style={{ fontSize: 14, fontWeight: 500, color: '#64748B' }}>{product.unitOfMeasure}</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>Unreserved quantity</div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>Reserved Stock</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#F59E0B', marginTop: 4 }}>
            {totalReserved} <span style={{ fontSize: 14, fontWeight: 500, color: '#64748B' }}>{product.unitOfMeasure}</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#F59E0B', marginTop: 4 }}>Allocated to orders</div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>Reorder Threshold</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {product.reorderLevel} <span style={{ fontSize: 14, fontWeight: 500, color: '#64748B' }}>{product.unitOfMeasure}</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>Minimum buffer point</div>
        </div>
      </div>

      {/* Grid: Stock by Location & Movement Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* Stock by Location */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <MapPin size={18} color="#6D28D9" />
            <h3 style={{ fontSize: 16 }}>Stock by Location</h3>
          </div>

          <div className="table-container" style={{ border: 'none' }}>
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Warehouse / Location</th>
                  <th>Quantity</th>
                  <th>Reserved</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {stocks.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px 12px', color: '#94A3B8' }}>
                      No physical inventory stored across any warehouse locations.
                    </td>
                  </tr>
                ) : (
                  stocks.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>
                          {q.warehouseName || 'Warehouse'}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>
                          Location: {q.locationName || q.locationCode}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>
                        {q.quantityOnHand} {product.unitOfMeasure}
                      </td>
                      <td style={{ color: '#F59E0B' }}>
                        {q.quantityReserved} {product.unitOfMeasure}
                      </td>
                      <td style={{ fontWeight: 600, color: '#10B981' }}>
                        {q.quantityFree} {product.unitOfMeasure}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Movement Timeline */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Clock size={18} color="#6D28D9" />
            <h3 style={{ fontSize: 16 }}>Movement Timeline</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {movements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: '#94A3B8' }}>
                No completed moves on ledger for this product.
              </div>
            ) : (
              movements.slice(0, 6).map((entry) => {
                const line = entry.lines.find((l) => l.productId === product.id);
                const qty = line?.quantity ?? 0;
                const isIncoming = entry.type === 'RECEIPT';

                return (
                  <div
                    key={entry.documentId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: '#F8FAFC',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: isIncoming ? '#ECFDF5' : '#FEF2F2',
                          color: isIncoming ? '#10B981' : '#EF4444',
                          fontWeight: 700,
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isIncoming ? `+${qty}` : `-${qty}`}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>
                          {entry.type} • {entry.reference}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>
                          Status: {entry.status} • {entry.partnerName || 'Internal Warehouse'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11.5, color: '#94A3B8' }}>
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
