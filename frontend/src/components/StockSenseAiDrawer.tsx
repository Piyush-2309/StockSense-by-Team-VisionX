import React, { useState, useEffect } from 'react';
import { X, Bot, Send } from 'lucide-react';
import { dashboardService, productService, stockService, ledgerService } from '../services/api';
import { ProductResponse, StockResponse, DashboardData } from '../types';
import { RouteId } from './Sidebar';

interface StockSenseAiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: RouteId, targetId?: string) => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  actionRoute?: RouteId;
  actionLabel?: string;
  dataPoints?: Array<{ label: string; value: string }>;
}

export const StockSenseAiDrawer: React.FC<StockSenseAiDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello! I'm your StockSense AI Inventory Assistant. I inspect your actual real-time warehouse data, ledger movements, and stock levels to answer your questions accurately.",
    },
  ]);
  const [input, setInput] = useState('');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [stocks, setStocks] = useState<StockResponse[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchContext = async () => {
      try {
        const [dashRes, prodRes, stockRes] = await Promise.all([
          dashboardService.getDashboard(),
          productService.list({ size: 100 }),
          stockService.list().catch(() => [] as StockResponse[]),
        ]);
        setDashboard(dashRes);
        setProducts(prodRes.content || []);
        setStocks(stockRes || []);
      } catch (err) {
        console.error('Failed to load AI context:', err);
      }
    };
    fetchContext();
  }, [isOpen]);

  if (!isOpen) return null;

  const quickQuestions = [
    'Why is stock showing low?',
    'Which products need replenishment?',
    'Where is stock located?',
    'Summarize current warehouse risk',
  ];

  const handleSend = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: Message = { sender: 'user', text: queryText };
    const q = queryText.toLowerCase();

    let botReply: Message = {
      sender: 'assistant',
      text: '',
    };

    const lowStockProduct = products.find(
      (p) => p.stockStatus === 'LOW_STOCK' || p.stockStatus === 'OUT_OF_STOCK' || p.totalStock <= p.reorderLevel
    );

    if (q.includes('why') || q.includes('low') || (lowStockProduct && q.includes(lowStockProduct.name.toLowerCase()))) {
      const prod = lowStockProduct || products[0];
      const prodStocks = stocks.filter((s) => s.productId === prod?.id);

      botReply = {
        sender: 'assistant',
        text: prod
          ? `${prod.name} (${prod.sku}) is currently at **${prod.totalStock} ${prod.unitOfMeasure}**, which is at or below its configured safety threshold of **${prod.reorderLevel} ${prod.unitOfMeasure}**.`
          : 'All inventory products are currently above their safety thresholds.',
        dataPoints: prod
          ? [
              { label: 'Current On-Hand', value: `${prod.totalStock} ${prod.unitOfMeasure}` },
              { label: 'Reorder Point', value: `${prod.reorderLevel} ${prod.unitOfMeasure}` },
              { label: 'Locations Count', value: `${prodStocks.length} storage locations` },
              { label: 'Status', value: prod.stockStatus },
            ]
          : [],
        actionRoute: 'reorder',
        actionLabel: 'Create Replenishment Order →',
      };
    } else if (q.includes('replenish') || q.includes('reorder') || q.includes('out of stock')) {
      const atRisk = products.filter((p) => p.totalStock <= p.reorderLevel);

      botReply = {
        sender: 'assistant',
        text: `Based on your live stock rules, **${atRisk.length} products** currently require replenishment:`,
        dataPoints: atRisk.slice(0, 5).map((p) => ({
          label: `${p.name} (${p.sku})`,
          value: `${p.totalStock} / ${p.reorderLevel} ${p.unitOfMeasure}`,
        })),
        actionRoute: 'risk',
        actionLabel: 'Go to Risk Center →',
      };
    } else if (q.includes('where') || q.includes('location')) {
      botReply = {
        sender: 'assistant',
        text: `Physical inventory is distributed across **${stocks.length} storage records**. You can view complete hierarchical locations in Stock by Location:`,
        dataPoints: stocks.slice(0, 4).map((s) => ({
          label: `${s.warehouseName} / ${s.locationName || s.locationCode}`,
          value: `${s.quantityOnHand} ${s.unitOfMeasure} (${s.productName})`,
        })),
        actionRoute: 'stock-location',
        actionLabel: 'View Stock By Location →',
      };
    } else {
      const totalUnits = stocks.reduce((acc, s) => acc + s.quantityOnHand, 0);
      botReply = {
        sender: 'assistant',
        text: `Warehouse State Summary: You have **${dashboard?.outOfStockCount ?? 0} Out-of-Stock items** and **${dashboard?.lowStockCount ?? 0} Low-Stock items**. Total physical units in system: **${totalUnits.toLocaleString()} units** across ${products.length} catalog items.`,
        dataPoints: [
          { label: 'Total Products', value: `${products.length} SKUs` },
          { label: 'Low Stock', value: `${dashboard?.lowStockCount ?? 0} items` },
          { label: 'Pending Inbound', value: `${dashboard?.pendingReceipts ?? 0} receipts` },
          { label: 'Pending Outbound', value: `${dashboard?.pendingDeliveries ?? 0} deliveries` },
        ],
        actionRoute: 'risk',
        actionLabel: 'Open Inventory Risk Center →',
      };
    }

    setMessages((prev) => [...prev, userMsg, botReply]);
    setInput('');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        style={{
          width: 440,
          height: '100vh',
          background: '#FFFFFF',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 22px',
            background: 'linear-gradient(135deg, #181226 0%, #2D1B4E 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={20} color="#DDD6FE" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Ask StockSense AI</div>
              <div style={{ fontSize: 11.5, color: '#CBD5E1' }}>Real-time verified inventory insights</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat History */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: '#F8FAFC',
          }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '88%',
                  padding: '12px 16px',
                  borderRadius: 14,
                  fontSize: 13.5,
                  lineHeight: 1.45,
                  background: m.sender === 'user' ? '#6D28D9' : '#FFFFFF',
                  color: m.sender === 'user' ? '#FFFFFF' : '#1E293B',
                  border: m.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                  boxShadow: m.sender === 'user' ? '0 2px 4px rgba(109, 40, 217, 0.2)' : 'var(--shadow-xs)',
                }}
              >
                {m.text}

                {/* Data Points Pill List */}
                {m.dataPoints && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    {m.dataPoints.map((dp, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          background: '#F8FAFC',
                          padding: '4px 8px',
                          borderRadius: 6,
                        }}
                      >
                        <span style={{ color: '#64748B' }}>{dp.label}:</span>
                        <strong style={{ color: '#0F172A' }}>{dp.value}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Route Button */}
                {m.actionRoute && m.actionLabel && (
                  <button
                    onClick={() => {
                      onNavigate(m.actionRoute!);
                      onClose();
                    }}
                    style={{
                      marginTop: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#F5F3FF',
                      border: '1px solid #DDD6FE',
                      borderRadius: 6,
                      padding: '5px 10px',
                      color: '#6D28D9',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {m.actionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Quick Questions */}
        <div style={{ padding: '10px 16px', background: '#FFFFFF', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
            Quick Inquiries
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                style={{
                  fontSize: 11.5,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  color: '#475569',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '12px 16px',
            background: '#FFFFFF',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
          }}
        >
          <input
            type="text"
            placeholder="Ask StockSense AI about stock, movements, rules..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: 13,
              border: '1px solid var(--border)',
              borderRadius: 8,
              outline: 'none',
            }}
          />
          <button
            onClick={() => handleSend(input)}
            style={{
              padding: '0 14px',
              background: '#6D28D9',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
