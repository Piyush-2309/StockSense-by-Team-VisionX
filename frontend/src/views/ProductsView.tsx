import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  ArrowLeftRight,
  Sliders,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { productService, categoryService, warehouseService, locationService, adjustmentService } from '../services/api';
import { ProductResponse, CategoryResponse, WarehouseResponse, LocationResponse } from '../types';
import { RouteId } from '../components/Sidebar';
import { useToast } from '../components/Toast';

interface ProductsViewProps {
  onNavigate: (route: RouteId, targetId?: string) => void;
  onOpenTransferForProduct?: (productId: string) => void;
  onOpenAdjustmentForProduct?: (productId: string) => void;
  refreshKey?: number;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  onNavigate,
  onOpenTransferForProduct,
  onOpenAdjustmentForProduct,
  refreshKey = 0,
}) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Product Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: 0,
    uom: 'pcs',
    unitCost: 10,
    initialStock: 0,
    reorderLevel: 20,
    warehouseId: 0,
    locationId: 0,
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes, whRes, locRes] = await Promise.all([
        productService.list({ size: 100 }),
        categoryService.list(),
        warehouseService.list(),
        locationService.list(),
      ]);
      setProducts(prodRes.content || []);
      setCategories(catRes || []);
      setWarehouses(whRes || []);
      setLocations(locRes || []);

      if (catRes && catRes.length > 0 && formData.categoryId === 0) {
        setFormData((prev) => ({
          ...prev,
          categoryId: catRes[0].id,
          warehouseId: whRes[0]?.id || 0,
          locationId: locRes[0]?.id || 0,
        }));
      }
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setError(err?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (selectedCategory !== 'all' && String(p.categoryId) !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'In Stock' && p.stockStatus !== 'HEALTHY') return false;
      if (selectedStatus === 'Low Stock' && p.stockStatus !== 'LOW_STOCK') return false;
      if (selectedStatus === 'Out of Stock' && p.stockStatus !== 'OUT_OF_STOCK') return false;
    }
    return true;
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      showToast('error', 'Validation Error', 'Product Name and SKU are required.');
      return;
    }

    const catId = formData.categoryId || (categories[0]?.id ?? 1);

    setSubmitting(true);
    try {
      const created = await productService.create({
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        categoryId: catId,
        unitOfMeasure: formData.uom,
        unitCost: Number(formData.unitCost) || 0,
        reorderLevel: Number(formData.reorderLevel) || 10,
      });

      // If initial stock specified and location chosen, create an initial adjustment
      if (formData.initialStock > 0 && formData.locationId) {
        try {
          await adjustmentService.create({
            locationId: formData.locationId,
            reason: 'INITIAL_STOCK',
            notes: 'Initial inventory balance setup',
            items: [
              {
                productId: created.id,
                physicalQuantity: Number(formData.initialStock),
              },
            ],
          });
        } catch (adjErr) {
          console.warn('Initial stock adjustment note:', adjErr);
        }
      }

      showToast('success', 'Product Created', `${created.name} (${created.sku}) added to inventory catalog.`);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        sku: '',
        categoryId: categories[0]?.id || 0,
        uom: 'pcs',
        unitCost: 10,
        initialStock: 0,
        reorderLevel: 20,
        warehouseId: warehouses[0]?.id || 0,
        locationId: locations[0]?.id || 0,
        description: '',
      });
      fetchData();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err?.message || 'Could not create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, color: '#0F172A' }}>Products</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            Manage catalog items, physical stock availability, and reorder levels.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
          style={{ background: '#6D28D9', padding: '10px 18px' }}
        >
          <Plus size={16} />
          <span>New Product</span>
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
        {/* Search */}
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            type="text"
            placeholder="Search by name, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 36 }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ minWidth: 160 }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: 160 }}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-field"
          >
            <option value="all">All Statuses</option>
            <option value="In Stock">In Stock (Healthy)</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
            <Loader2 size={28} color="#6D28D9" className="animate-spin" />
            <span style={{ color: '#64748B', fontSize: 14 }}>Loading products from database…</span>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#DC2626' }}>
            <p style={{ fontWeight: 600 }}>{error}</p>
            <button onClick={fetchData} className="btn btn-outline" style={{ marginTop: 12 }}>
              <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>On Hand</th>
                <th>Reorder Level</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                    <Package size={40} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 600, fontSize: 14 }}>No products match your filters</div>
                    <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 4 }}>
                      Try clearing search criteria or create a new product above.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  let badgeClass = 'badge-success';
                  let displayStatus = 'In Stock';
                  if (p.stockStatus === 'OUT_OF_STOCK' || p.totalStock <= 0) {
                    badgeClass = 'badge-danger';
                    displayStatus = 'Out of Stock';
                  } else if (p.stockStatus === 'LOW_STOCK' || p.totalStock <= p.reorderLevel) {
                    badgeClass = 'badge-warning';
                    displayStatus = 'Low Stock';
                  }

                  return (
                    <tr key={p.id}>
                      <td>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                          onClick={() => onNavigate('products', String(p.id))}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: '#F1F5F9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Package size={18} color="#64748B" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A' }}>{p.name}</div>
                            <div style={{ fontSize: 11.5, color: '#64748B' }}>
                              Cost: ${p.unitCost ?? 0} / {p.unitOfMeasure}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#6D28D9' }}>{p.sku}</td>
                      <td>{p.categoryName || 'General'}</td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>
                        {p.totalStock} {p.unitOfMeasure}
                      </td>
                      <td style={{ color: '#64748B' }}>
                        {p.reorderLevel} {p.unitOfMeasure}
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>
                          <span className="badge-dot" />
                          {displayStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => onNavigate('products', String(p.id))}
                            className="btn btn-sm btn-outline"
                            title="View Product Details"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              if (onOpenTransferForProduct) onOpenTransferForProduct(String(p.id));
                              else onNavigate('transfers', String(p.id));
                            }}
                            className="btn btn-sm btn-outline"
                            title="Transfer Stock"
                          >
                            <ArrowLeftRight size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (onOpenAdjustmentForProduct) onOpenAdjustmentForProduct(String(p.id));
                              else onNavigate('adjustments', String(p.id));
                            }}
                            className="btn btn-sm btn-outline"
                            title="Count & Adjust Stock"
                          >
                            <Sliders size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Product Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
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
                    background: '#F5F3FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Package size={18} color="#6D28D9" />
                </div>
                <h3 style={{ fontSize: 17 }}>Create New Product</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
                <div>
                  <label className="input-label">
                    Product Name <span className="input-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Copper Wire Spool"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">
                    SKU Code <span className="input-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. COP-009"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input-field"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="input-label">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                    className="input-field"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Unit of Measure (UOM)</label>
                  <select
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                    className="input-field"
                  >
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="roll">roll (Spools / Rolls)</option>
                    <option value="box">box (Boxes / Cartons)</option>
                    <option value="m">m (Meters)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label className="input-label">Unit Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({ ...formData, initialStock: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              {formData.initialStock > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="input-label">Initial Warehouse</label>
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
                    <label className="input-label">Initial Storage Location</label>
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
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 12,
                  marginTop: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#6D28D9' }}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
