import React, { useState, useEffect } from 'react';
import { Search, Package, Loader2 } from 'lucide-react';
import { stockService, warehouseService, categoryService } from '../services/api';
import { StockResponse, WarehouseResponse, CategoryResponse } from '../types';
import { RouteId } from '../components/Sidebar';

interface StockOverviewViewProps {
  onNavigate: (route: RouteId, targetId?: string) => void;
  refreshKey?: number;
}

export const StockOverviewView: React.FC<StockOverviewViewProps> = ({ onNavigate, refreshKey = 0 }) => {
  const [stocks, setStocks] = useState<StockResponse[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stockRes, whRes, catRes] = await Promise.all([
        stockService.list(),
        warehouseService.list(),
        categoryService.list(),
      ]);
      setStocks(stockRes || []);
      setWarehouses(whRes || []);
      setCategories(catRes || []);
    } catch (err) {
      console.error('Failed to load stock overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const filteredStock = stocks.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.productName?.toLowerCase().includes(q) && !s.sku?.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (selectedWarehouse !== 'all' && String(s.warehouseId) !== selectedWarehouse) {
      return false;
    }
    return true;
  });

  const totalStockCount = filteredStock.reduce((acc, i) => acc + i.quantityOnHand, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, color: '#0F172A' }}>Stock Overview</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            Detailed breakdown of on-hand, available, and reserved units by warehouse rack.
          </p>
        </div>
        <span className="badge badge-purple" style={{ padding: '6px 14px', fontSize: 13 }}>
          {totalStockCount.toLocaleString()} Total Units Tracked
        </span>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            type="text"
            placeholder="Search by product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 36 }}
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="input-field"
          >
            <option value="all">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={String(w.id)}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Overview Table */}
      <div className="table-container">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
            <Loader2 size={28} color="#6D28D9" className="animate-spin" />
            <span style={{ color: '#64748B', fontSize: 14 }}>Loading inventory quants…</span>
          </div>
        )}

        {!loading && (
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Warehouse</th>
                <th>Location</th>
                <th>On Hand</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                    <Package size={40} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 600, fontSize: 14 }}>No stock records found</div>
                  </td>
                </tr>
              ) : (
                filteredStock.map((s) => {
                  let badgeClass = 'badge-success';
                  let statusLabel = 'In Stock';
                  if (s.quantityOnHand <= 0) {
                    badgeClass = 'badge-danger';
                    statusLabel = 'Out of Stock';
                  } else if (s.quantityOnHand <= s.reorderLevel) {
                    badgeClass = 'badge-warning';
                    statusLabel = 'Low Stock';
                  }

                  return (
                    <tr key={s.id}>
                      <td>
                        <div
                          style={{ fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
                          onClick={() => onNavigate('products', String(s.productId))}
                        >
                          {s.productName}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#6D28D9' }}>{s.sku}</td>
                      <td style={{ color: '#334155' }}>{s.warehouseName}</td>
                      <td style={{ fontWeight: 500, color: '#0F172A' }}>{s.locationName || s.locationCode}</td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>
                        {s.quantityOnHand} {s.unitOfMeasure}
                      </td>
                      <td style={{ color: '#F59E0B' }}>
                        {s.quantityReserved} {s.unitOfMeasure}
                      </td>
                      <td style={{ fontWeight: 600, color: '#10B981' }}>
                        {s.quantityFree} {s.unitOfMeasure}
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>
                          <span className="badge-dot" />
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => onNavigate('products', String(s.productId))}
                          className="btn btn-sm btn-outline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
