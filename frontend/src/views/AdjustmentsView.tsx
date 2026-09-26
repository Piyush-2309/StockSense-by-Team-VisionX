import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Search,
  CheckCircle2,
  Package,
  X,
  Scale,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { adjustmentService, productService, warehouseService, locationService, stockService } from '../services/api';
import { DocumentResponse, ProductResponse, WarehouseResponse, LocationResponse, StockResponse } from '../types';
import { useToast } from '../components/Toast';
import { RouteId } from '../components/Sidebar';

interface AdjustmentsViewProps {
  onNavigate: (route: RouteId, targetId?: string) => void;
  openNewModalOnLoad?: boolean;
  preselectedProductId?: string;
  refreshKey?: number;
  onMutationSuccess?: () => void;
}

export const AdjustmentsView: React.FC<AdjustmentsViewProps> = ({
  onNavigate,
  openNewModalOnLoad,
  preselectedProductId,
  refreshKey = 0,
  onMutationSuccess,
}) => {
  const { showToast } = useToast();
  const [adjustments, setAdjustments] = useState<DocumentResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [stocks, setStocks] = useState<StockResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(openNewModalOnLoad || false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<DocumentResponse | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    productId: preselectedProductId ? Number(preselectedProductId) : 0,
    warehouseId: 0,
    locationId: 0,
    physicalCount: 0,
    reason: 'Counting Error',
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adjRes, prodRes, whRes, locRes, stockRes] = await Promise.all([
        adjustmentService.list({ size: 100 }),
        productService.list({ size: 100 }),
        warehouseService.list(),
        locationService.list(),
        stockService.list().catch(() => [] as StockResponse[]),
      ]);
      setAdjustments(adjRes.content || []);
      setProducts(prodRes.content || []);
      setWarehouses(whRes || []);
      setLocations(locRes || []);
      setStocks(stockRes || []);

      const defProdId = preselectedProductId ? Number(preselectedProductId) : prodRes.content?.[0]?.id || 0;
      const defWhId = whRes[0]?.id || 0;
      const whLocs = locRes.filter((l) => l.warehouseId === defWhId);
      const defLocId = whLocs[0]?.id || 0;

      const initialQuant = stockRes.find(
        (s) => s.productId === defProdId && s.locationId === defLocId
      )?.quantityOnHand ?? 0;

      setFormData((prev) => ({
        ...prev,
        productId: prev.productId || defProdId,
        warehouseId: prev.warehouseId || defWhId,
        locationId: prev.locationId || defLocId,
        physicalCount: prev.physicalCount || initialQuant,
      }));
    } catch (err: any) {
      console.error('Failed to load adjustments:', err);
      showToast('error', 'Load Error', err?.message || 'Failed to load adjustments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  useEffect(() => {
    if (openNewModalOnLoad) {
      setIsModalOpen(true);
    }
  }, [openNewModalOnLoad]);

  const selectedProduct = products.find((p) => p.id === formData.productId);
  const currentStock = stocks.find(
    (s) => s.productId === formData.productId && s.locationId === formData.locationId
  );
  const systemQuantity = currentStock ? currentStock.quantityOnHand : 0;
  const variance = Number(formData.physicalCount) - systemQuantity;

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.physicalCount < 0) {
      showToast('error', 'Invalid Count', 'Physical count cannot be negative.');
      return;
    }

    const locId = formData.locationId || locations[0]?.id;
    if (!locId) {
      showToast('error', 'Location Required', 'Please select a storage location.');
      return;
    }

    const prodId = formData.productId || products[0]?.id;
    if (!prodId) {
      showToast('error', 'Product Required', 'Please select a product.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create adjustment draft
      const created = await adjustmentService.create({
        locationId: locId,
        reason: formData.reason,
        notes: formData.notes.trim() || undefined,
        items: [
          {
            productId: prodId,
            physicalQuantity: Number(formData.physicalCount),
          },
        ],
      });

      // 2. Validate adjustment to immediately synchronize stock in DB
      const validated = await adjustmentService.validate(created.documentId);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      showToast(
        'success',
        'Adjustment Applied',
        `Adjusted stock for ${selectedProduct?.name || 'item'} to ${formData.physicalCount} units (variance: ${variance > 0 ? '+' : ''}${variance}).`
      );
      setIsModalOpen(false);
      setSelectedAdjustment(validated);
      fetchData();
      if (onMutationSuccess) onMutationSuccess();
    } catch (err: any) {
      showToast('error', 'Adjustment Error', err?.message || 'Could not apply adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateAdjustment = async (documentId: string) => {
    setValidatingId(documentId);
    try {
      const validated = await adjustmentService.validate(documentId);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      showToast('success', 'Adjustment Validated', `Adjustment ${validated.reference} validated.`);
      setSelectedAdjustment(null);
      fetchData();
      if (onMutationSuccess) onMutationSuccess();
    } catch (err: any) {
      showToast('error', 'Validation Failed', err?.message || 'Could not validate adjustment');
    } finally {
      setValidatingId(null);
    }
  };

  const filteredAdjustments = adjustments.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      const refMatch = a.reference?.toLowerCase().includes(q);
      const reasonMatch = a.reason?.toLowerCase().includes(q);
      if (!refMatch && !reasonMatch) return false;
    }
    return true;
  });

  const reasons = ['Damaged', 'Missing', 'Misplaced', 'Counting Error', 'Initial Stock', 'Other'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, color: '#0F172A' }}>Stock Adjustments</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            Reconcile physical inventory counts, write-offs, shrinkages, and audit balances.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ background: '#6D28D9', padding: '10px 18px' }}
        >
          <Plus size={16} />
          <span>New Adjustment</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            type="text"
            placeholder="Search by reference # or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="table-container">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
            <Loader2 size={28} color="#6D28D9" className="animate-spin" />
            <span style={{ color: '#64748B', fontSize: 14 }}>Loading inventory adjustments…</span>
          </div>
        )}

        {!loading && (
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Location</th>
                <th>Product</th>
                <th>Physical Balance / Line</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                    <Scale size={40} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 600, fontSize: 14 }}>No adjustments recorded</div>
                    <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 4 }}>
                      Create an adjustment when actual counts differ from system records.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((a) => {
                  const isDone = a.status === 'DONE';
                  const item = a.lines[0];

                  return (
                    <tr key={a.documentId}>
                      <td style={{ fontWeight: 600, color: '#6D28D9' }}>{a.reference}</td>
                      <td>
                        <div style={{ fontWeight: 500, color: '#0F172A' }}>
                          {a.sourceWarehouseName || a.destinationWarehouseName || 'Warehouse'} / {a.sourceLocationName || a.destinationLocationName || 'Rack'}
                        </div>
                      </td>
                      <td>
                        {item ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Package size={14} color="#64748B" />
                            <span style={{ fontWeight: 600 }}>{item.productName}</span>
                            <span style={{ color: '#64748B', fontSize: 12 }}>({item.sku})</span>
                          </div>
                        ) : (
                          '1 item'
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>
                        {item ? `${item.quantity} ${item.unitOfMeasure}` : 'Reconciled'}
                      </td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: 12 }}>
                          {a.reason || 'Audit Adjustment'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isDone ? 'badge-success' : 'badge-warning'}`}>
                          <span className="badge-dot" />
                          {a.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748B' }}>
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'Today'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!isDone && a.status !== 'CANCELED' ? (
                          <button
                            onClick={() => handleValidateAdjustment(a.documentId)}
                            className="btn btn-sm btn-primary"
                            style={{ background: '#10B981' }}
                            disabled={validatingId === a.documentId}
                          >
                            {validatingId === a.documentId ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            Validate
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedAdjustment(a)}
                            className="btn btn-sm btn-outline"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* New Adjustment Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: '#FFFBEB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sliders size={18} color="#F59E0B" />
                </div>
                <h3 style={{ fontSize: 17 }}>Physical Inventory Adjustment</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Product and Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
                <div>
                  <label className="input-label">Product to Reconcile</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => {
                      const pId = Number(e.target.value);
                      const q = stocks.find((s) => s.productId === pId && s.locationId === formData.locationId)?.quantityOnHand ?? 0;
                      setFormData({ ...formData, productId: pId, physicalCount: q });
                    }}
                    className="input-field"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Warehouse</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => {
                      const whId = Number(e.target.value);
                      const firstLoc = locations.find((l) => l.warehouseId === whId);
                      const locId = firstLoc?.id || 0;
                      const q = stocks.find((s) => s.productId === formData.productId && s.locationId === locId)?.quantityOnHand ?? 0;
                      setFormData({ ...formData, warehouseId: whId, locationId: locId, physicalCount: q });
                    }}
                    className="input-field"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Storage Rack / Location</label>
                <select
                  value={formData.locationId}
                  onChange={(e) => {
                    const locId = Number(e.target.value);
                    const q = stocks.find((s) => s.productId === formData.productId && s.locationId === locId)?.quantityOnHand ?? 0;
                    setFormData({ ...formData, locationId: locId, physicalCount: q });
                  }}
                  className="input-field"
                >
                  {locations
                    .filter((l) => !formData.warehouseId || l.warehouseId === formData.warehouseId)
                    .map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                </select>
              </div>

              {/* System vs Physical Floor Count Box */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 12,
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>SYSTEM RECORD</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                    {systemQuantity} {selectedProduct?.unitOfMeasure}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11.5, color: '#6D28D9', fontWeight: 600 }}>ACTUAL COUNT</div>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.physicalCount}
                    onChange={(e) => setFormData({ ...formData, physicalCount: Number(e.target.value) })}
                    className="input-field"
                    style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, marginTop: 4 }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>VARIANCE</div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: variance === 0 ? '#64748B' : variance < 0 ? '#EF4444' : '#10B981',
                      marginTop: 4,
                    }}
                  >
                    {variance > 0 ? `+${variance}` : variance} {selectedProduct?.unitOfMeasure}
                  </div>
                </div>
              </div>

              {/* Adjustment Reason Radio Pills */}
              <div>
                <label className="input-label">Adjustment Reason</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {reasons.map((r) => {
                    const isSelected = formData.reason === r;
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setFormData({ ...formData, reason: r })}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: `1.5px solid ${isSelected ? '#6D28D9' : '#E2E8F0'}`,
                          background: isSelected ? '#F5F3FF' : '#FFFFFF',
                          color: isSelected ? '#6D28D9' : '#475569',
                          fontSize: 12.5,
                          fontWeight: isSelected ? 600 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="input-label">Notes & Justification</label>
                <input
                  type="text"
                  placeholder="Discovered damaged batch, count reconciliation..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#6D28D9' }} disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Apply Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment Detail Dialog */}
      {selectedAdjustment && (
        <div className="modal-overlay" onClick={() => setSelectedAdjustment(null)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: '#6D28D9', fontWeight: 700 }}>
                  ADJUSTMENT #{selectedAdjustment.reference}
                </div>
                <h3 style={{ fontSize: 18, marginTop: 2 }}>Physical Count Adjustment</h3>
              </div>
              <button
                onClick={() => setSelectedAdjustment(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>
                  <div style={{ color: '#64748B' }}>Storage Location</div>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>
                    {selectedAdjustment.sourceWarehouseName || selectedAdjustment.destinationWarehouseName || 'Warehouse'} / {selectedAdjustment.sourceLocationName || selectedAdjustment.destinationLocationName || 'Location'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B' }}>Reason</div>
                  <div style={{ fontWeight: 600, color: '#6D28D9', marginTop: 2 }}>
                    {selectedAdjustment.reason || 'Inventory Count'}
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                  Adjusted Quantities
                </div>
                {selectedAdjustment.lines.map((i) => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{i.productName}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>SKU: {i.sku}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 15 }}>
                      Count: {i.quantity} {i.unitOfMeasure}
                    </div>
                  </div>
                ))}
              </div>

              {selectedAdjustment.notes && (
                <div style={{ fontSize: 12.5, color: '#64748B' }}>
                  <strong>Notes:</strong> {selectedAdjustment.notes}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button onClick={() => setSelectedAdjustment(null)} className="btn btn-outline">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
