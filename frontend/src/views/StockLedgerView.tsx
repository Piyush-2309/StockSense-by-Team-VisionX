import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowDownToLine,
  Truck,
  ArrowLeftRight,
  Sliders,
  CheckCircle2,
  X,
  Loader2,
  ScrollText,
} from 'lucide-react';
import { ledgerService } from '../services/api';
import { DocumentResponse } from '../types';
import { RouteId } from '../components/Sidebar';

interface StockLedgerViewProps {
  onNavigate: (route: RouteId, targetId?: string) => void;
  refreshKey?: number;
}

export const StockLedgerView: React.FC<StockLedgerViewProps> = ({ onNavigate, refreshKey = 0 }) => {
  const [entries, setEntries] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<DocumentResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const typeParam = typeFilter === 'all' ? undefined : typeFilter.toUpperCase();
      const res = await ledgerService.list({
        type: typeParam,
        search: search.trim() || undefined,
        size: 100,
      });
      setEntries(res.content || []);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, refreshKey]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, color: '#0F172A' }}>Stock Ledger (Audit Trail)</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            Immutable, double-entry audit trail recording every physical stock-affecting transaction.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="badge badge-purple" style={{ padding: '6px 14px', fontSize: 13 }}>
            {entries.length} Verified Ledger Events
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            type="text"
            placeholder="Search by reference #, product name, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 36 }}
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Movement Types</option>
            <option value="RECEIPT">Receipt (+)</option>
            <option value="DELIVERY">Delivery (-)</option>
            <option value="INTERNAL">Internal Transfer</option>
            <option value="ADJUSTMENT">Adjustment (±)</option>
          </select>
        </div>
      </form>

      {/* Ledger Table */}
      <div className="table-container">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
            <Loader2 size={28} color="#6D28D9" className="animate-spin" />
            <span style={{ color: '#64748B', fontSize: 14 }}>Reading immutable ledger records…</span>
          </div>
        )}

        {!loading && (
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date & Time</th>
                <th>Operation Type</th>
                <th>Product</th>
                <th>From Location</th>
                <th>To Location</th>
                <th>Quantity</th>
                <th>Executed By</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                    <ScrollText size={40} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 600, fontSize: 14 }}>No ledger movements recorded</div>
                    <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 4 }}>
                      Validated receipts, dispatches, and transfers will appear here.
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((e) => {
                  const line = e.lines[0];
                  const isPositive = e.type === 'RECEIPT';
                  let typeColor = '#6D28D9';
                  let TypeIcon = ArrowLeftRight;

                  if (e.type === 'RECEIPT') {
                    typeColor = '#10B981';
                    TypeIcon = ArrowDownToLine;
                  } else if (e.type === 'DELIVERY') {
                    typeColor = '#3B82F6';
                    TypeIcon = Truck;
                  } else if (e.type === 'ADJUSTMENT') {
                    typeColor = '#F59E0B';
                    TypeIcon = Sliders;
                  }

                  const fromLoc = e.sourceLocationName ? `${e.sourceWarehouseName || ''} / ${e.sourceLocationName}` : 'External / Vendor';
                  const toLoc = e.destinationLocationName ? `${e.destinationWarehouseName || ''} / ${e.destinationLocationName}` : (e.partnerName || 'External / Customer');

                  return (
                    <tr key={e.documentId}>
                      <td style={{ fontWeight: 700, color: '#6D28D9', cursor: 'pointer' }} onClick={() => setSelectedEntry(e)}>
                        {e.reference}
                      </td>
                      <td style={{ fontSize: 12, color: '#64748B' }}>
                        {e.createdAt ? new Date(e.createdAt).toLocaleString() : 'Recent'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: typeColor }}>
                          <TypeIcon size={14} />
                          <span>{e.type}</span>
                        </div>
                      </td>
                      <td>
                        {line ? (
                          <div>
                            <div
                              style={{ fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
                              onClick={() => onNavigate('products', String(line.productId))}
                            >
                              {line.productName}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>{line.sku}</div>
                          </div>
                        ) : (
                          'General'
                        )}
                      </td>
                      <td style={{ color: '#475569', fontSize: 12.5 }}>{fromLoc}</td>
                      <td style={{ fontWeight: 500, color: '#0F172A', fontSize: 12.5 }}>{toLoc}</td>
                      <td
                        style={{
                          fontWeight: 800,
                          color: isPositive ? '#10B981' : e.type === 'DELIVERY' ? '#EF4444' : '#6D28D9',
                          fontSize: 13.5,
                        }}
                      >
                        {line ? `${isPositive ? '+' : e.type === 'DELIVERY' ? '-' : ''}${line.quantity} ${line.unitOfMeasure}` : '-'}
                      </td>
                      <td style={{ color: '#334155', fontSize: 12.5 }}>{e.userName || 'Operator'}</td>
                      <td>
                        <span className={`badge ${e.status === 'DONE' ? 'badge-success' : 'badge-warning'}`}>
                          <span className="badge-dot" />
                          {e.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => setSelectedEntry(e)} className="btn btn-sm btn-outline">
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

      {/* Movement Detail Inspection Modal */}
      {selectedEntry && (
        <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
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
              <div>
                <div style={{ fontSize: 13, color: '#6D28D9', fontWeight: 700 }}>
                  AUDIT LOG #{selectedEntry.reference}
                </div>
                <h3 style={{ fontSize: 18, marginTop: 2 }}>
                  {selectedEntry.type} — {selectedEntry.reference}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedEntry.lines.map((l) => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontSize: 13 }}>Product:</span>
                    <strong style={{ color: '#0F172A', fontSize: 13 }}>
                      {l.productName} ({l.sku}) — {l.quantity} {l.unitOfMeasure}
                    </strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B', fontSize: 13 }}>Source:</span>
                  <strong style={{ color: '#0F172A', fontSize: 13 }}>
                    {selectedEntry.sourceLocationName || selectedEntry.partnerName || 'External Vendor'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B', fontSize: 13 }}>Destination:</span>
                  <strong style={{ color: '#0F172A', fontSize: 13 }}>
                    {selectedEntry.destinationLocationName || selectedEntry.partnerName || 'External Destination'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
                  <span style={{ color: '#64748B', fontSize: 13 }}>Operator:</span>
                  <strong style={{ color: '#6D28D9', fontSize: 13 }}>{selectedEntry.userName || 'System'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B', fontSize: 13 }}>Timestamp:</span>
                  <span style={{ color: '#64748B', fontSize: 12 }}>
                    {selectedEntry.createdAt ? new Date(selectedEntry.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              {selectedEntry.notes && (
                <div style={{ fontSize: 13, color: '#475569' }}>
                  <strong>Operation Remarks:</strong> {selectedEntry.notes}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button onClick={() => setSelectedEntry(null)} className="btn btn-outline">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
