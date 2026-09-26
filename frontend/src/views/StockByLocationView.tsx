import React, { useState, useEffect } from 'react';
import {
  Building,
  MapPin,
  Package,
  ArrowLeftRight,
  Sliders,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { warehouseService, locationService, stockService, productService } from '../services/api';
import { WarehouseResponse, LocationResponse, StockResponse, ProductResponse } from '../types';
import { RouteId } from '../components/Sidebar';

interface StockByLocationViewProps {
  onNavigate: (route: RouteId, targetId?: string) => void;
  onOpenTransferForProduct: (productId: string) => void;
  onOpenAdjustmentForProduct: (productId: string) => void;
  refreshKey?: number;
}

export const StockByLocationView: React.FC<StockByLocationViewProps> = ({
  onNavigate,
  onOpenTransferForProduct,
  onOpenAdjustmentForProduct,
  refreshKey = 0,
}) => {
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [stocks, setStocks] = useState<StockResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWarehouse, setExpandedWarehouse] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [whRes, locRes, stockRes, prodRes] = await Promise.all([
        warehouseService.list(),
        locationService.list(),
        stockService.list(),
        productService.list({ size: 100 }),
      ]);
      setWarehouses(whRes || []);
      setLocations(locRes || []);
      setStocks(stockRes || []);
      setProducts(prodRes.content || []);

      if (whRes && whRes.length > 0 && expandedWarehouse === null) {
        setExpandedWarehouse(whRes[0].id);
      }
    } catch (err) {
      console.error('Failed to load stock by location:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, color: '#0F172A' }}>Stock by Location Hierarchy</h1>
        <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
          Physical warehouse layout, storage racks, and bin inventory allocations.
        </p>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
          <Loader2 size={28} color="#6D28D9" className="animate-spin" />
          <span style={{ color: '#64748B', fontSize: 14 }}>Loading warehouse hierarchy…</span>
        </div>
      )}

      {/* Warehouses Accordion Grid */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {warehouses.map((wh) => {
            const whLocations = locations.filter((l) => l.warehouseId === wh.id);
            const isExpanded = expandedWarehouse === wh.id;
            const whQuants = stocks.filter((q) => q.warehouseId === wh.id);
            const totalUnitsInWh = whQuants.reduce((s, q) => s + q.quantityOnHand, 0);

            return (
              <div key={wh.id} className="card" style={{ overflow: 'hidden' }}>
                {/* Warehouse Header Bar */}
                <div
                  onClick={() => setExpandedWarehouse(isExpanded ? null : wh.id)}
                  style={{
                    padding: '18px 24px',
                    background: isExpanded ? '#FAF5FF' : '#FFFFFF',
                    borderBottom: isExpanded ? '1px solid #DDD6FE' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: isExpanded ? '#6D28D9' : '#F1F5F9',
                        color: isExpanded ? '#FFFFFF' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 17, color: '#0F172A' }}>{wh.name}</h3>
                        <span className="badge badge-purple" style={{ fontSize: 11 }}>{wh.code}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>{wh.address || 'Central Facility'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                        {totalUnitsInWh.toLocaleString()} units
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>{whLocations.length} active racks/zones</div>
                    </div>
                    {isExpanded ? <ChevronDown size={20} color="#6D28D9" /> : <ChevronRight size={20} color="#94A3B8" />}
                  </div>
                </div>

                {/* Racks & Quants Content */}
                {isExpanded && (
                  <div style={{ padding: '20px 24px', background: '#FFFFFF' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                      {whLocations.map((loc) => {
                        const locQuants = stocks.filter((q) => q.locationId === loc.id);
                        const totalInRack = locQuants.reduce((s, q) => s + q.quantityOnHand, 0);

                        return (
                          <div
                            key={loc.id}
                            style={{
                              border: '1px solid #E2E8F0',
                              borderRadius: 12,
                              padding: '16px',
                              background: '#F8FAFC',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 12,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MapPin size={16} color="#6D28D9" />
                                <strong style={{ fontSize: 14, color: '#0F172A' }}>{loc.name}</strong>
                                <span style={{ fontSize: 11, color: '#64748B' }}>({loc.code})</span>
                              </div>
                              <span className="badge badge-neutral" style={{ fontSize: 11.5, fontWeight: 700 }}>
                                {totalInRack.toLocaleString()} units
                              </span>
                            </div>

                            {/* Items stored in this rack */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {locQuants.length === 0 ? (
                                <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                                  Rack currently empty
                                </div>
                              ) : (
                                locQuants.map((q) => (
                                  <div
                                    key={q.id}
                                    style={{
                                      background: '#FFFFFF',
                                      padding: '8px 12px',
                                      borderRadius: 8,
                                      border: '1px solid #E2E8F0',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                    }}
                                  >
                                    <div>
                                      <div
                                        style={{ fontWeight: 600, fontSize: 13, color: '#0F172A', cursor: 'pointer' }}
                                        onClick={() => onNavigate('products', String(q.productId))}
                                      >
                                        {q.productName}
                                      </div>
                                      <div style={{ fontSize: 11, color: '#64748B' }}>SKU: {q.sku}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <strong style={{ fontSize: 13, color: '#6D28D9' }}>
                                        {q.quantityOnHand} {q.unitOfMeasure}
                                      </strong>
                                      <button
                                        onClick={() => onOpenTransferForProduct(String(q.productId))}
                                        className="btn btn-sm btn-outline"
                                        title="Transfer this item"
                                        style={{ padding: '3px 7px' }}
                                      >
                                        <ArrowLeftRight size={12} />
                                      </button>
                                      <button
                                        onClick={() => onOpenAdjustmentForProduct(String(q.productId))}
                                        className="btn btn-sm btn-outline"
                                        title="Count / Adjust"
                                        style={{ padding: '3px 7px' }}
                                      >
                                        <Sliders size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
