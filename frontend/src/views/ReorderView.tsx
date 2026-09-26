import React, { useState, useEffect } from 'react';
import { Plus, Package, Loader2 } from 'lucide-react';
import { productService, locationService, receiptService } from '../services/api';
import { ProductResponse, LocationResponse } from '../types';
import { RouteId } from '../components/Sidebar';
import { useToast } from '../components/Toast';

interface ReorderViewProps {
  onNavigate: (route: RouteId, targetId?: string) => void;
  onOpenReceiptForProduct?: (productId: string) => void;
  refreshKey?: number;
}

export const ReorderView: React.FC<ReorderViewProps> = ({ onNavigate, refreshKey = 0 }) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, locRes] = await Promise.all([
        productService.list({ size: 100 }),
        locationService.list(),
      ]);
      setProducts(prodRes.content || []);
      setLocations(locRes || []);
    } catch (err) {
      console.error('Failed to load reorder recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const recommendations = products
    .filter((p) => p.totalStock <= p.reorderLevel)
    .map((p) => {
      const target = Math.max(p.reorderLevel * 2, 50);
      const recommendedQty = Math.max(10, target - p.totalStock);
      return {
        product: p,
        currentStock: p.totalStock,
        minStock: p.reorderLevel,
        targetStock: target,
        recommendedQty,
      };
    });

  const handle1ClickDraftReceipt = async (prod: ProductResponse, qty: number) => {
    const loc = locations[0];
    if (!loc) {
      showToast('error', 'No Storage Location', 'Please configure at least one storage location.');
      return;
    }

    setGeneratingId(prod.id);
    try {
      const res = await receiptService.create({
        supplier: 'Preferred Vendor',
        destinationLocationId: loc.id,
        items: [{ productId: prod.id, quantity: qty }],
        notes: `Auto-generated replenishment for ${prod.name} (suggested qty: ${qty} ${prod.unitOfMeasure})`,
      });

      showToast(
        'success',
        'Replenishment Draft Created',
        `Draft receipt ${res.reference} created for ${qty} ${prod.unitOfMeasure} of ${prod.name}.`
      );
      onNavigate('receipts', res.documentId);
    } catch (err: any) {
      showToast('error', 'Replenishment Error', err?.message || 'Could not generate receipt draft');
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, color: '#0F172A' }}>Reorder Recommendations</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            Automated suggested replenishment orders calculated from stock levels and minimum safety rules.
          </p>
        </div>
      </div>

      {/* Recommendations Table */}
      <div className="table-container">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
            <Loader2 size={28} color="#6D28D9" className="animate-spin" />
            <span style={{ color: '#64748B', fontSize: 14 }}>Calculating recommended purchase orders…</span>
          </div>
        )}

        {!loading && (
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Minimum Threshold</th>
                <th>Suggested Target</th>
                <th>Recommended Order Qty</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>1-Click Action</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#10B981' }}>
                    <Package size={40} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 700, fontSize: 15 }}>No reorder orders needed.</div>
                    <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                      All products are comfortably above minimum stock replenishment levels.
                    </div>
                  </td>
                </tr>
              ) : (
                recommendations.map(({ product, currentStock, minStock, targetStock, recommendedQty }) => (
                  <tr key={product.id}>
                    <td>
                      <div
                        style={{ fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
                        onClick={() => onNavigate('products', String(product.id))}
                      >
                        {product.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>{product.categoryName}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#6D28D9' }}>{product.sku}</td>
                    <td style={{ fontWeight: 800, color: currentStock === 0 ? '#EF4444' : '#F59E0B' }}>
                      {currentStock} {product.unitOfMeasure}
                    </td>
                    <td style={{ color: '#475569' }}>{minStock} {product.unitOfMeasure}</td>
                    <td style={{ color: '#64748B' }}>{targetStock} {product.unitOfMeasure}</td>
                    <td style={{ fontWeight: 800, color: '#10B981', fontSize: 14 }}>
                      +{recommendedQty} {product.unitOfMeasure}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          product.stockStatus === 'OUT_OF_STOCK' || currentStock === 0 ? 'badge-danger' : 'badge-warning'
                        }`}
                      >
                        <span className="badge-dot" />
                        {product.stockStatus === 'OUT_OF_STOCK' || currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handle1ClickDraftReceipt(product, recommendedQty)}
                        className="btn btn-sm btn-primary"
                        style={{ background: '#6D28D9' }}
                        disabled={generatingId === product.id}
                      >
                        {generatingId === product.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Plus size={13} />
                        )}
                        Generate Receipt Draft
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
