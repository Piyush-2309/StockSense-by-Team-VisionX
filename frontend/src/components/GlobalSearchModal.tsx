import React, { useState, useEffect } from 'react';
import { Search, X, Package, ArrowDownToLine, Truck, ArrowLeftRight, ScrollText, ArrowRight, Loader2 } from 'lucide-react';
import { productService, ledgerService } from '../services/api';
import { ProductResponse, DocumentResponse } from '../types';
import { RouteId } from './Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: RouteId, targetId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [movements, setMovements] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [prodRes, moveRes] = await Promise.all([
          productService.list({ q: query.trim() || undefined, size: 10 }),
          ledgerService.list({ search: query.trim() || undefined, size: 10 }),
        ]);
        setProducts(prodRes.content || []);
        setMovements(moveRes.content || []);
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, query]);

  if (!isOpen) return null;

  const totalResults = products.length + movements.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Search size={20} color="#6D28D9" />
          <input
            autoFocus
            type="text"
            placeholder="Type to search products, SKU, receipts, transfers, ledger..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: '#0F172A',
            }}
          />
          {loading && <Loader2 size={16} color="#6D28D9" className="animate-spin" />}
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          )}
          <kbd
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 11,
              color: '#64748B',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: '12px 16px' }}>
          {totalResults === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
              <Package size={36} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>No matches found for "{query}"</div>
              <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 4 }}>
                Try searching for "Steel", "Bearing", "REC", or SKU codes
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Products Category */}
              {products.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    Products & SKU
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {products.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigate('products', String(p.id));
                          onClose();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: '#F5F3FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Package size={16} color="#6D28D9" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0F172A' }}>{p.name}</div>
                            <div style={{ fontSize: 11.5, color: '#64748B' }}>
                              SKU: {p.sku} • {p.categoryName}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`badge ${p.totalStock <= 0 ? 'badge-danger' : p.totalStock <= p.reorderLevel ? 'badge-warning' : 'badge-success'}`}>
                            {p.totalStock} {p.unitOfMeasure}
                          </span>
                          <ArrowRight size={14} color="#94A3B8" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ledger Movements Category */}
              {movements.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    Inventory Moves & Audit Logs
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {movements.slice(0, 4).map((m) => {
                      const route =
                        m.type === 'RECEIPT'
                          ? 'receipts'
                          : m.type === 'DELIVERY'
                          ? 'deliveries'
                          : m.type === 'INTERNAL'
                          ? 'transfers'
                          : 'adjustments';

                      return (
                        <div
                          key={m.documentId}
                          onClick={() => {
                            onNavigate(route as RouteId, m.documentId);
                            onClose();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                background: '#F5F3FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <ScrollText size={16} color="#6D28D9" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0F172A' }}>
                                {m.reference} ({m.type})
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                                {m.partnerName || m.destinationLocationName || 'Warehouse'}
                              </div>
                            </div>
                          </div>
                          <span className={`badge ${m.status === 'DONE' ? 'badge-success' : 'badge-warning'}`}>
                            {m.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
