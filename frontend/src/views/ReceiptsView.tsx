import React, { useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  Plus,
  Search,
  CheckCircle2,
  Package,
  X,
  Loader2,
  RefreshCw,
  Building,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { receiptService, productService, warehouseService, locationService } from '../services/api';
import { DocumentResponse, ProductResponse, WarehouseResponse, LocationResponse } from '../types';
import { useToast } from '../components/Toast';
import { RouteId } from '../components/Sidebar';

interface ReceiptsViewProps {
  onNavigate: (route: RouteId, targetId?: string) => void;
  openNewModalOnLoad?: boolean;
  refreshKey?: number;
  onMutationSuccess?: () => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({
  onNavigate,
  openNewModalOnLoad,
  refreshKey = 0,
  onMutationSuccess,
}) => {
  const { showToast } = useToast();
  const [receipts, setReceipts] = useState<DocumentResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(openNewModalOnLoad || false);
  const [selectedReceipt, setSelectedReceipt] = useState<DocumentResponse | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    supplier: '',
    warehouseId: 0,
    locationId: 0,
    productId: 0,
    quantity: 50,
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, prodRes, whRes, locRes] = await Promise.all([
        receiptService.list({ size: 100 }),
        productService.list({ size: 100 }),
        warehouseService.list(),
        locationService.list(),
      ]);
      setReceipts(recRes.content || []);
      setProducts(prodRes.content || []);
      setWarehouses(whRes || []);
      setLocations(locRes || []);

      if (formData.productId === 0 && prodRes.content?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          productId: prodRes.content[0].id,
          warehouseId: whRes[0]?.id || 0,
          locationId: locRes[0]?.id || 0,
        }));
      }
    } catch (err: any) {
      console.error('Failed to load receipts:', err);
      showToast('error', 'Load Error', err?.message || 'Failed to load receipts.');
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

  const filteredReceipts = receipts.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      const refMatch = r.reference?.toLowerCase().includes(q);
      const supplierMatch = r.partnerName?.toLowerCase().includes(q);
      if (!refMatch && !supplierMatch) return false;
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'Done' && r.status !== 'DONE') return false;
      if (statusFilter === 'Ready' && r.status !== 'READY') return false;
      if (statusFilter === 'Draft' && r.status !== 'DRAFT') return false;
    }
    return true;
  });

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier.trim()) {
      showToast('error', 'Supplier Required', 'Please enter a vendor or supplier name.');
      return;
    }

    const locId = formData.locationId || locations[0]?.id;
    if (!locId) {
      showToast('error', 'Location Required', 'Please specify a destination storage location.');
      return;
    }

    const prodId = formData.productId || products[0]?.id;
    if (!prodId) {
      showToast('error', 'Product Required', 'Please select a catalog product.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await receiptService.create({
        supplier: formData.supplier.trim(),
        destinationLocationId: locId,
        items: [
          {
            productId: prodId,
            quantity: Number(formData.quantity) || 1,
          },
        ],
        notes: formData.notes.trim() || undefined,
      });

      showToast('success', 'Receipt Draft Created', `Receipt ${created.reference} created. Click Validate to receive stock.`);
      setIsModalOpen(false);
      setSelectedReceipt(created);
      fetchData();
      if (onMutationSuccess) onMutationSuccess();
    } catch (err: any) {
      showToast('error', 'Receipt Creation Failed', err?.message || 'Could not create receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateReceipt = async (documentId: string) => {
    setValidatingId(documentId);
    try {
      const updated = await receiptService.validate(documentId);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      showToast('success', 'Receipt Validated', `Receipt ${updated.reference} validated. Physical stock balances increased.`);
      setSelectedReceipt(null);
      fetchData();
      if (onMutationSuccess) onMutationSuccess();
    } catch (err: any) {
      showToast('error', 'Validation Failed', err?.message || 'Could not validate receipt');
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, color: '#0F172A' }}>Receipts (Inbound Logistics)</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            Receive purchase orders, raw materials, and inbound deliveries into warehouse locations.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ background: '#6D28D9', padding: '10px 18px' }}
        >
          <Plus size={16} />
          <span>New Receipt</span>
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
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            type="text"
            placeholder="Search by reference # or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 36 }}
          />
        </div>

        <div style={{ minWidth: 160 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Statuses</option>
            <option value="Done">Validated (Done)</option>
            <option value="Ready">Ready</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="table-container">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
            <Loader2 size={28} color="#6D28D9" className="animate-spin" />
            <span style={{ color: '#64748B', fontSize: 14 }}>Loading inbound receipts…</span>
          </div>
        )}

        {!loading && (
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Supplier / Vendor</th>
                <th>Destination Location</th>
                <th>Items & Quantities</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                    <Package size={40} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 600, fontSize: 14 }}>No receipts found</div>
                    <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 4 }}>
                      Create a new receipt to record incoming goods from suppliers.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => {
                  const isDone = r.status === 'DONE';
                  const firstLine = r.lines[0];
                  const lineSummary = firstLine
                    ? `${firstLine.quantity} ${firstLine.unitOfMeasure} ${firstLine.productName}`
                    : '1 item';

                  return (
                    <tr key={r.documentId}>
                      <td style={{ fontWeight: 600, color: '#6D28D9' }}>{r.reference}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{r.partnerName || 'Vendor'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155' }}>
                          <Building size={14} color="#64748B" />
                          <span>{r.destinationWarehouseName || 'Warehouse'} / {r.destinationLocationName || 'Rack'}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>
                        {lineSummary}
                        {r.lines.length > 1 && (
                          <span style={{ color: '#64748B', fontWeight: 400, fontSize: 12 }}>
                            {' '}(+{r.lines.length - 1} more)
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${isDone ? 'badge-success' : r.status === 'READY' ? 'badge-info' : 'badge-warning'}`}>
                          <span className="badge-dot" />
                          {r.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748B', fontSize: 13 }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Today'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!isDone && r.status !== 'CANCELED' ? (
                          <button
                            onClick={() => handleValidateReceipt(r.documentId)}
                            className="btn btn-sm btn-primary"
                            style={{ background: '#10B981' }}
                            disabled={validatingId === r.documentId}
                          >
                            {validatingId === r.documentId ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            Validate
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedReceipt(r)}
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

      {/* New Receipt Modal */}
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
                    background: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowDownToLine size={18} color="#10B981" />
                </div>
                <h3 style={{ fontSize: 17 }}>Create Incoming Stock Receipt</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">
                  Supplier / Vendor Name <span className="input-required">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Industrial Supplies, Titan Steel Corp"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
                <div>
                  <label className="input-label">Product to Receive</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: Number(e.target.value) })}
                    className="input-field"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — {p.totalStock} {p.unitOfMeasure} on hand
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">
                    Quantity to Receive <span className="input-required">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="input-label">Destination Warehouse</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => {
                      const whId = Number(e.target.value);
                      const firstLoc = locations.find((l) => l.warehouseId === whId);
                      setFormData({ ...formData, warehouseId: whId, locationId: firstLoc?.id || 0 });
                    }}
                    className="input-field"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Destination Rack / Location</label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: Number(e.target.value) })}
                    className="input-field"
                  >
                    {locations
                      .filter((l) => !formData.warehouseId || l.warehouseId === formData.warehouseId)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Notes / Purchase Order Ref</label>
                <input
                  type="text"
                  placeholder="PO-2026-904, Batch tracking #..."
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
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Receipt Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Detail & Validation Dialog */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
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
                  RECEIPT #{selectedReceipt.reference}
                </div>
                <h3 style={{ fontSize: 18, marginTop: 2 }}>{selectedReceipt.partnerName || 'Supplier'}</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>
                  <div style={{ color: '#64748B' }}>Destination</div>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>
                    {selectedReceipt.destinationWarehouseName || 'Warehouse'} / {selectedReceipt.destinationLocationName || 'Location'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B' }}>Status</div>
                  <div style={{ marginTop: 2 }}>
                    <span className={`badge ${selectedReceipt.status === 'DONE' ? 'badge-success' : 'badge-warning'}`}>
                      {selectedReceipt.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                  Material Items
                </div>
                {selectedReceipt.lines.map((i) => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{i.productName}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>SKU: {i.sku}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#10B981', fontSize: 15 }}>
                      +{i.quantity} {i.unitOfMeasure}
                    </div>
                  </div>
                ))}
              </div>

              {selectedReceipt.notes && (
                <div style={{ fontSize: 12.5, color: '#64748B' }}>
                  <strong>Notes:</strong> {selectedReceipt.notes}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button onClick={() => setSelectedReceipt(null)} className="btn btn-outline">
                  Close
                </button>
                {selectedReceipt.status !== 'DONE' && selectedReceipt.status !== 'CANCELED' && (
                  <button
                    onClick={() => handleValidateReceipt(selectedReceipt.documentId)}
                    className="btn btn-primary"
                    style={{ background: '#10B981' }}
                    disabled={validatingId === selectedReceipt.documentId}
                  >
                    {validatingId === selectedReceipt.documentId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Validate Receipt & Increase Stock
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
