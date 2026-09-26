import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Loader2 } from 'lucide-react';
import { categoryService, productService } from '../services/api';
import { CategoryResponse, ProductResponse } from '../types';
import { useToast } from '../components/Toast';

interface CategoriesViewProps {
  refreshKey?: number;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ refreshKey = 0 }) => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        categoryService.list(),
        productService.list({ size: 100 }),
      ]);
      setCategories(catRes || []);
      setProducts(prodRes.content || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('error', 'Validation Error', 'Category Name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await categoryService.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      showToast('success', 'Category Created', `Category ${created.name} added.`);
      setIsModalOpen(false);
      setFormData({ name: '', description: '' });
      fetchData();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err?.message || 'Could not create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, color: '#0F172A' }}>Product Categories</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            Organize catalog products into material groups, components, and finished goods.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ background: '#6D28D9', padding: '10px 18px' }}
        >
          <Plus size={16} />
          <span>New Category</span>
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
          <Loader2 size={28} color="#6D28D9" className="animate-spin" />
          <span style={{ color: '#64748B', fontSize: 14 }}>Loading categories…</span>
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {categories.map((c) => {
            const prodCount = products.filter((p) => p.categoryId === c.id).length;
            return (
              <div key={c.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: '#F5F3FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Tag size={18} color="#6D28D9" />
                    </div>
                    <h3 style={{ fontSize: 16, color: '#0F172A' }}>{c.name}</h3>
                  </div>
                  <span className="badge badge-purple">CAT-{c.id}</span>
                </div>
                <p style={{ fontSize: 13, color: '#64748B' }}>{c.description || 'No description provided'}</p>
                <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#64748B' }}>
                  <strong>{prodCount}</strong> assigned products
                </div>
              </div>
            );
          })}
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
              <h3 style={{ fontSize: 17 }}>Create Category</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrical Components"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Description</label>
                <input
                  type="text"
                  placeholder="Brief description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#6D28D9' }} disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
