import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Package,
  X,
  Loader2,
  Building,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { deliveryService, productService, warehouseService, locationService, stockService } from '../services/api';
import { DocumentResponse, ProductResponse, WarehouseResponse, LocationResponse, StockResponse } from '../types';
import { useToast } from '../components/Toast';
import { RouteId } from '../components/Sidebar';

interface DeliveriesViewProps {
  onNavigate: (route: RouteId, targetId?: string) => void;
  openNewModalOnLoad?: boolean;
  refreshKey?: number;
  onMutationSuccess?: () => void;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = ({
  onNavigate,
  openNewModalOnLoad,
  refreshKey = 0,
  onMutationSuccess,
}) => {
  const { showToast } = useToast();
  const [deliveries, setDeliveries] = useState<DocumentResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [stocks, setStocks] = useState<StockResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(openNewModalOnLoad || false);
  const [selectedDelivery, setSelectedDelivery] = useState<DocumentResponse | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customer: '',
    warehouseId: 0,
    locationId: 0,
    productId: 0,
    quantity: 10,
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [delRes, prodRes, whRes, locRes, stockRes] = await Promise.all([
        deliveryService.list({ size: 100 }),
        productService.list({ size: 100 }),
        warehouseService.list(),
        locationService.list(),
        stockService.list().catch(() => [] as StockResponse[]),
      ]);
      setDeliveries(delRes.content || []);
      setProducts(prodRes.content || []);
      setWarehouses(whRes || []);
      setLocations(locRes || []);
      setStocks(stockRes || []);

      if (formData.productId === 0 && prodRes.content?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          productId: prodRes.content[0].id,
          warehouseId: whRes[0]?.id || 0,
          locationId: locRes[0]?.id || 0,
        }));
      }
    } catch (err: any) {
      console.error('Failed to load deliveries:', err);
      showToast('error', 'Load Error', err?.message || 'Failed to load deliveries.');
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

  // Find stock in chosen source location
  const matchingStock = stocks.find(
    (s) => s.productId === formData.productId && s.locationId === formData.locationId
  );
  const availableAtSource = matchingStock ? matchingStock.quantityFree : 0;
  const currentProduct = products.find((p) => p.id === formData.productId);

  const filteredDeliveries = deliveries.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      const refMatch = d.reference?.toLowerCase().includes(q);
      const custMatch = d.partnerName?.toLowerCase().includes(q);
      if (!refMatch && !custMatch) return false;
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'Done' && d.status !== 'DONE') return false;
      if (statusFilter === 'Ready' && d.status !== 'READY') return false;
      if (statusFilter === 'Waiting' && d.status !== 'WAITING') return false;
      if (statusFilter === 'Draft' && d.status !== 'DRAFT') return false;
    }
    return true;
  });

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer.trim()) {
      showToast('error', 'Customer Required', 'Please enter customer name or client account.');
      return;
    }

    const locId = formData.locationId || locations[0]?.id;
    if (!locId) {
      showToast('error', 'Location Required', 'Please select a source storage location.');
      return;
    }

    const prodId = formData.productId || products[0]?.id;
    if (!prodId) {
      showToast('error', 'Product Required', 'Please select a product.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await deliveryService.create({
        customer: formData.customer.trim(),
        sourceLocationId: locId,
        items: [
          {
            productId: prodId,
            quantity: Number(formData.quantity) || 1,
          },
        ],
        notes: formData.notes.trim() || undefined,
      });

      showToast('success', 'Delivery Order Created', `Order ${created.reference} created and staged for dispatch.`);
      setIsModalOpen(false);
      setSelectedDelivery(created);
      fetchData();
      if (onMutationSuccess) onMutationSuccess();
    } catch (err: any) {
      showToast('error', 'Delivery Creation Failed', err?.message || 'Could not create delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateDelivery = async (documentId: string) => {
    setValidatingId(documentId);
    try {
      const updated = await deliveryService.validate(documentId);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      showToast('success', 'Delivery Dispatched', `Delivery ${updated.reference} validated. Stock deducted from source location.`);
      setSelectedDelivery(null);
      fetchData();
      if (onMutationSuccess) onMutationSuccess();
    } catch (err: any) {
      showToast('error', 'Validation Failed', err?.message || 'Could not validate delivery');
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, color: '#0F172A' }}>Deliveries (Outbound Logistics)</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            Customer orders, fulfillment picking, dispatch verification, and stock staging.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ background: '#3B82F6', padding: '10px 18px' }}
        >
          <Plus size={16} />
          <span>New Delivery</span>
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
            placeholder="Search by order ref or customer..."
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
            <option value="Done">Dispatched (Done)</option>
            <option value="Ready">Ready</option>
            <option value="Waiting">Waiting</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="table-container">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
            <Loader2 size={28} color="#3B82F6" className="animate-spin" />
            <span style={{ color: '#64748B', fontSize: 14 }}>Loading outbound deliveries…</span>
          </div>
        )}

        {!loading && (
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Customer / Client</th>
                <th>Source Location</th>
                <th>Items & Quantities</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                    <Package size={40} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 600, fontSize: 14 }}>No deliveries found</div>
                    <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 4 }}>
                      Create a new delivery order to fulfill customer orders.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((d) => {
                  const isDone = d.status === 'DONE';
                  const firstLine = d.lines[0];
                  const lineSummary = firstLine
                    ? `${firstLine.quantity} ${firstLine.unitOfMeasure} ${firstLine.productName}`
                    : '1 item';

                  return (
                    <tr key={d.documentId}>
                      <td style={{ fontWeight: 600, color: '#3B82F6' }}>{d.reference}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{d.partnerName || 'Customer'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155' }}>
                          <Building size={14} color="#64748B" />
                          <span>{d.sourceWarehouseName || 'Warehouse'} / {d.sourceLocationName || 'Location'}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>
                        {lineSummary}
                        {d.lines.length > 1 && (
                          <span style={{ color: '#64748B', fontWeight: 400, fontSize: 12 }}>
                            {' '}(+{d.lines.length - 1} more)
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isDone ? 'badge-success' : d.status === 'READY' ? 'badge-info' : 'badge-warning'
                          }`}
                        >
                          <span className="badge-dot" />
                          {d.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748B', fontSize: 13 }}>
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Today'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!isDone && d.status !== 'CANCELED' ? (
                          <button
                            onClick={() => handleValidateDelivery(d.documentId)}
                            className="btn btn-sm btn-primary"
                            style={{ background: '#3B82F6' }}
                            disabled={validatingId === d.documentId}
                          >
                            {validatingId === d.documentId ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            Validate Delivery
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedDelivery(d)}
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

      {/* New Delivery Modal */}
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
                    background: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Truck size={18} color="#3B82F6" />
                </div>
                <h3 style={{ fontSize: 17 }}>Create Delivery Order (Outgoing)</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">
                  Customer / Destination Account <span className="input-required">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Electronics Corp, Apex Retail"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="input-label">Source Warehouse</label>
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
                  <label className="input-label">Source Rack / Location</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
                <div>
                  <label className="input-label">Product to Deliver</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: Number(e.target.value) })}
                    className="input-field"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — {p.totalStock} {p.unitOfMeasure} total
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">
                    Requested Qty <span className="input-required">*</span>
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

              {matchingStock && (
                <div style={{ fontSize: 12.5, color: availableAtSource >= formData.quantity ? '#10B981' : '#F59E0B', fontWeight: 500 }}>
                  Available in selected rack: {availableAtSource} {currentProduct?.unitOfMeasure}
                </div>
              )}

              <div>
                <label className="input-label">Delivery Notes / Shipping Ref</label>
                <input
                  type="text"
                  placeholder="Express shipping tracking #, delivery instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#3B82F6' }} disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Delivery Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Detail & Validation Dialog */}
      {selectedDelivery && (
        <div className="modal-overlay" onClick={() => setSelectedDelivery(null)}>
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
                <div style={{ fontSize: 13, color: '#3B82F6', fontWeight: 700 }}>
                  DELIVERY #{selectedDelivery.reference}
                </div>
                <h3 style={{ fontSize: 18, marginTop: 2 }}>{selectedDelivery.partnerName || 'Customer'}</h3>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>
                  <div style={{ color: '#64748B' }}>Source Location</div>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>
                    {selectedDelivery.sourceWarehouseName || 'Warehouse'} / {selectedDelivery.sourceLocationName || 'Location'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B' }}>Status</div>
                  <div style={{ marginTop: 2 }}>
                    <span className={`badge ${selectedDelivery.status === 'DONE' ? 'badge-success' : 'badge-info'}`}>
                      {selectedDelivery.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                  Dispatched Items
                </div>
                {selectedDelivery.lines.map((i) => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{i.productName}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>SKU: {i.sku}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#EF4444', fontSize: 15 }}>
                      -{i.quantity} {i.unitOfMeasure}
                    </div>
                  </div>
                ))}
              </div>

              {selectedDelivery.notes && (
                <div style={{ fontSize: 12.5, color: '#64748B' }}>
                  <strong>Notes:</strong> {selectedDelivery.notes}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button onClick={() => setSelectedDelivery(null)} className="btn btn-outline">
                  Close
                </button>
                {selectedDelivery.status !== 'DONE' && selectedDelivery.status !== 'CANCELED' && (
                  <button
                    onClick={() => handleValidateDelivery(selectedDelivery.documentId)}
                    className="btn btn-primary"
                    style={{ background: '#3B82F6' }}
                    disabled={validatingId === selectedDelivery.documentId}
                  >
                    {validatingId === selectedDelivery.documentId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Validate & Dispatch Order
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
