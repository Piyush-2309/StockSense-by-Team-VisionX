import React, { useState, useEffect } from 'react';
import { MapPin, Plus, X, Loader2 } from 'lucide-react';
import { locationService, warehouseService, stockService } from '../services/api';
import { LocationResponse, WarehouseResponse, StockResponse } from '../types';
import { useToast } from '../components/Toast';
import { RouteId } from '../components/Sidebar';

interface LocationsViewProps {
  onNavigate: (route: RouteId) => void;
  refreshKey?: number;
}

export const LocationsView: React.FC<LocationsViewProps> = ({ onNavigate, refreshKey = 0 }) => {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [stocks, setStocks] = useState<StockResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    warehouseId: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [locRes, whRes, stockRes] = await Promise.all([
        locationService.list(),
        warehouseService.list(),
        stockService.list().catch(() => [] as StockResponse[]),
      ]);
      setLocations(locRes || []);
      setWarehouses(whRes || []);
      setStocks(stockRes || []);

      if (formData.warehouseId === 0 && whRes?.length > 0) {
        setFormData((prev) => ({ ...prev, warehouseId: whRes[0].id }));
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('error', 'Validation Error', 'Rack Name and Code are required.');
      return;
    }

    const whId = formData.warehouseId || warehouses[0]?.id;
    if (!whId) {
      showToast('error', 'Warehouse Required', 'Please choose a warehouse facility.');
      return;
    }

    setSubmitting(true);
    try {
      await locationService.create({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        warehouseId: whId,
      });

      showToast('success', 'Location Created', `Location ${formData.name} added.`);
      setIsModalOpen(false);
      setFormData({ name: '', code: '', warehouseId: warehouses[0]?.id || 0 });
      fetchData();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err?.message || 'Could not create location');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, color: '#0F172A' }}>Locations & Racks</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            Sub-locations, internal aisle racks, and staging areas.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ background: '#6D28D9', padding: '10px 18px' }}
        >
          <Plus size={16} />
          <span>New Location</span>
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
          <Loader2 size={28} color="#6D28D9" className="animate-spin" />
          <span style={{ color: '#64748B', fontSize: 14 }}>Loading warehouse locations…</span>
        </div>
      )}

      {/* Locations Table */}
      {!loading && (
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Location Name</th>
                <th>Code</th>
                <th>Warehouse</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Units On Hand</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => {
                const totalUnits = stocks
                  .filter((s) => s.locationId === loc.id)
                  .reduce((acc, q) => acc + q.quantityOnHand, 0);

                return (
                  <tr key={loc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MapPin size={16} color="#6D28D9" />
                        <strong style={{ color: '#0F172A' }}>{loc.name}</strong>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#6D28D9' }}>{loc.code}</td>
                    <td style={{ color: '#334155' }}>{loc.warehouseName}</td>
                    <td>
                      <span className="badge badge-success">
                        <span className="badge-dot" />
                        Active
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        {totalUnits.toLocaleString()} units
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ fontSize: 17 }}>Create Storage Location</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddLocation} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Location / Rack Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rack D, Aisle 3"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="input-label">Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RACK-D"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input-field"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div>
                  <label className="input-label">Warehouse</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: Number(e.target.value) })}
                    className="input-field"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#6D28D9' }} disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
