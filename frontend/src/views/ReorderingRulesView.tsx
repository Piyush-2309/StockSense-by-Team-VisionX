import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { productService, warehouseService } from '../services/api';
import { ProductResponse, WarehouseResponse } from '../types';
import { useToast } from '../components/Toast';

export const ReorderingRulesView: React.FC = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productId: 0,
    warehouseId: 0,
    minQuantity: 25,
    targetQuantity: 50,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, whRes] = await Promise.all([
        productService.list({ size: 100 }),
        warehouseService.list(),
      ]);
      setProducts(prodRes.content || []);
      setWarehouses(whRes || []);

      if (formData.productId === 0 && prodRes.content?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          productId: prodRes.content[0].id,
          warehouseId: whRes[0]?.id || 0,
        }));
      }
    } catch (err) {
      console.error('Failed to load products/warehouses for rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateReorderLevel = async (p: ProductResponse, newLevel: number) => {
    try {
      await productService.update(p.id, {
        name: p.name,
        sku: p.sku,
        categoryId: p.categoryId,
        unitOfMeasure: p.unitOfMeasure,
        unitCost: p.unitCost ?? undefined,
        reorderLevel: newLevel,
      });
      showToast('success', 'Threshold Updated', `Reorder point for ${p.name} updated to ${newLevel} ${p.unitOfMeasure}.`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Update Failed', err?.message || 'Could not update reorder point');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === formData.productId);
    if (!prod) return;

    setSubmitting(true);
    try {
      await productService.update(prod.id, {
        name: prod.name,
        sku: prod.sku,
        categoryId: prod.categoryId,
        unitOfMeasure: prod.unitOfMeasure,
        unitCost: prod.unitCost ?? undefined,
        reorderLevel: Number(formData.minQuantity) || 10,
      });

      showToast('success', 'Rule Configured', `Reordering threshold rule set for ${prod.name}.`);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Rule Creation Failed', err?.message || 'Could not save reorder rule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, color: '#0F172A' }}>Reordering Rules</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            Configure min/safety inventory buffers on catalog products to automate replenishment triggers.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ background: '#6D28D9', padding: '10px 18px' }}
        >
          <Plus size={16} />
          <span>New Reordering Rule</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="table-container">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
            <Loader2 size={28} color="#6D28D9" className="animate-spin" />
            <span style={{ color: '#64748B', fontSize: 14 }}>Loading rules…</span>
          </div>
        )}

        {!loading && (
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Safety Reorder Level</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((r) => {
                const isUnder = r.totalStock <= r.reorderLevel;
                return (
                  <tr key={r.id}>
                    <td>
                      <strong style={{ color: '#0F172A' }}>{r.name}</strong>
                    </td>
                    <td style={{ fontWeight: 600, color: '#6D28D9' }}>{r.sku}</td>
                    <td style={{ color: '#334155' }}>{r.categoryName}</td>
                    <td style={{ fontWeight: 700, color: isUnder ? '#EF4444' : '#0F172A' }}>
                      {r.totalStock} {r.unitOfMeasure}
                    </td>
                    <td style={{ fontWeight: 700, color: '#F59E0B' }}>
                      {r.reorderLevel} {r.unitOfMeasure}
                    </td>
                    <td>
                      <span className={`badge ${isUnder ? 'badge-warning' : 'badge-success'}`}>
                        <span className="badge-dot" />
                        {isUnder ? 'Needs Reorder' : 'Protected'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setFormData({
                            productId: r.id,
                            warehouseId: warehouses[0]?.id || 0,
                            minQuantity: r.reorderLevel,
                            targetQuantity: r.reorderLevel * 2,
                          });
                          setIsModalOpen(true);
                        }}
                        className="btn btn-sm btn-outline"
                      >
                        Edit Rule
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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
              <h3 style={{ fontSize: 17 }}>Configure Reordering Rule</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Product</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: Number(e.target.value) })}
                  className="input-field"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Minimum Safety Threshold (Reorder Point)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#6D28D9' }} disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
