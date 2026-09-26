import React, { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, X, Loader2 } from 'lucide-react';
import { warehouseService, locationService, stockService } from '../services/api';
import { WarehouseResponse, LocationResponse, StockResponse } from '../types';
import { useToast } from '../components/Toast';
import { RouteId } from '../components/Sidebar';

interface WarehousesViewProps {
  onNavigate: (route: RouteId) => void;
  refreshKey?: number;
}

export const WarehousesView: React.FC<WarehousesViewProps> = ({ onNavigate, refreshKey = 0 }) => {
  const { showToast } = useToast();
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [stocks, setStocks] = useState<StockResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', address: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [whRes, locRes, stockRes] = await Promise.all([
        warehouseService.list(),
        locationService.list(),
        stockService.list().catch(() => [] as StockResponse[]),
      ]);
      setWarehouses(whRes || []);
      setLocations(locRes || []);
      setStocks(stockRes || []);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('error', 'Validation Error', 'Name and Code are required.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await warehouseService.create({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        address: formData.address.trim() || undefined,
      });

      // Also create a default storage location for this warehouse
      try {
        await locationService.create({
          warehouseId: created.id,
          name: `${created.name} Rack 1`,
          code: 'RACK-01',
        });
      } catch (locErr) {
        console.warn('Initial rack note:', locErr);
      }

      showToast('success', 'Warehouse Added', `Warehouse ${created.name} (${created.code}) created successfully.`);
      setIsModalOpen(false);
      setFormData({ name: '', code: '', address: '' });
      fetchData();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err?.message || 'Could not create warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, color: '#0F172A' }}>Warehouses</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            Configure and manage physical storage facilities and multi-warehouse supply channels.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ background: '#6D28D9', padding: '10px 18px' }}
        >
          <Plus size={16} />
          <span>New Warehouse</span>
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
          <Loader2 size={28} color="#6D28D9" className="animate-spin" />
          <span style={{ color: '#64748B', fontSize: 14 }}>Loading facilities…</span>
        </div>
      )}

      {/* Warehouse Cards Grid */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          {warehouses.map((w) => {
            const whLocs = locations.filter((l) => l.warehouseId === w.id);
            const quantsInWh = stocks.filter((s) => s.warehouseId === w.id);
            const totalUnits = quantsInWh.reduce((s, q) => s + q.quantityOnHand, 0);

            return (
              <div key={w.id} className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: '#F5F3FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building2 size={22} color="#6D28D9" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, color: '#0F172A' }}>{w.name}</h3>
                      <span className="badge badge-purple" style={{ fontSize: 11, marginTop: 2 }}>{w.code}</span>
                    </div>
                  </div>
                  <span className="badge badge-success">Active</span>
                </div>

                <div style={{ fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <MapPin size={16} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{w.address || 'Standard facility'}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#F8FAFC',
                    borderRadius: 8,
                    fontSize: 12.5,
                  }}
                >
                  <div>
                    <span style={{ color: '#64748B' }}>Storage Racks: </span>
                    <strong>{whLocs.length}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Stored Units: </span>
                    <strong style={{ color: '#6D28D9' }}>{totalUnits.toLocaleString()}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    onClick={() => onNavigate('stock-location')}
                    className="btn btn-sm btn-outline-purple"
                    style={{ flex: 1 }}
                  >
                    Manage Racks
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ fontSize: 17 }}>Add New Warehouse</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddWarehouse} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Warehouse Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Distribution Hub"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Facility Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WH-HUB"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input-field"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label className="input-label">Address & Logistics Bay</label>
                <input
                  type="text"
                  placeholder="Facility address..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#6D28D9' }} disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
