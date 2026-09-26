import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, Play, ScrollText, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { productService, locationService, receiptService, transferService, deliveryService, adjustmentService, stockService } from '../services/api';
import { ProductResponse, LocationResponse, StockResponse } from '../types';
import { useToast } from './Toast';
import { RouteId } from './Sidebar';

interface GoldenDemoWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: RouteId) => void;
}

export const GoldenDemoWidget: React.FC<GoldenDemoWidgetProps> = ({ isOpen, onClose, onNavigate }) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isRunning, setIsRunning] = useState(false);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [stocks, setStocks] = useState<StockResponse[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const loadState = async () => {
      try {
        const [prodRes, locRes, stockRes] = await Promise.all([
          productService.list({ size: 100 }),
          locationService.list(),
          stockService.list().catch(() => [] as StockResponse[]),
        ]);
        setProducts(prodRes.content || []);
        setLocations(locRes || []);
        setStocks(stockRes || []);
      } catch (err) {
        console.error('Failed to load demo context:', err);
      }
    };
    loadState();
  }, [isOpen]);

  if (!isOpen) return null;

  const targetProduct = products.find((p) => p.sku === 'STL-001') || products[0];
  const sourceLocation = locations[0];
  const destLocation = locations.length > 1 ? locations[1] : locations[0];

  const currentQuant = stocks.find((s) => s.productId === targetProduct?.id);

  const steps = [
    {
      num: 1,
      title: 'Inbound Receipt (+100 units)',
      desc: `Receive 100 units of ${targetProduct?.name || 'materials'} into ${sourceLocation?.name || 'Warehouse'}.`,
      expected: 'Physical stock balance increases by 100 units.',
      badge: '+100 Receipt',
      badgeColor: '#10B981',
    },
    {
      num: 2,
      title: 'Internal Transfer (30 units)',
      desc: `Relocate 30 units from ${sourceLocation?.name || 'Rack 1'} to ${destLocation?.name || 'Rack 2'}.`,
      expected: 'Stock transferred between locations with zero deficit.',
      badge: 'Relocation',
      badgeColor: '#6D28D9',
    },
    {
      num: 3,
      title: 'Customer Delivery (-20 units)',
      desc: `Dispatch 20 units to customer client account with automated reservation check.`,
      expected: 'Deducted from warehouse stock. Delivered status marked.',
      badge: '-20 Outgoing',
      badgeColor: '#3B82F6',
    },
    {
      num: 4,
      title: 'Physical Count & Adjustment (-3 units)',
      desc: 'Floor audit records variance. Reconcile with verified audit adjustment.',
      expected: 'System stock reconciled to actual physical count.',
      badge: '-3 Variance',
      badgeColor: '#EF4444',
    },
    {
      num: 5,
      title: 'Ledger Audit & Dashboard Verification',
      desc: 'Inspect the complete double-entry ledger with all transactions and live KPIs.',
      expected: 'Immutable audit trail recorded in PostgreSQL database.',
      badge: 'Immutable Audit',
      badgeColor: '#0F172A',
    },
  ];

  const executeStep1 = async () => {
    if (!targetProduct || !sourceLocation) throw new Error('Product/location not found');
    const rec = await receiptService.create({
      supplier: 'Apex Materials Corp',
      destinationLocationId: sourceLocation.id,
      items: [{ productId: targetProduct.id, quantity: 100 }],
      notes: 'Golden Demo Step 1: Inbound Receipt (+100)',
    });
    await receiptService.validate(rec.documentId);
  };

  const executeStep2 = async () => {
    if (!targetProduct || !sourceLocation || !destLocation) throw new Error('Locations not found');
    const tr = await transferService.create({
      sourceLocationId: sourceLocation.id,
      destinationLocationId: destLocation.id,
      items: [{ productId: targetProduct.id, quantity: 30 }],
      notes: 'Golden Demo Step 2: Internal Transfer (30)',
    });
    await transferService.validate(tr.documentId);
  };

  const executeStep3 = async () => {
    if (!targetProduct || !sourceLocation) throw new Error('Product/location not found');
    const del = await deliveryService.create({
      customer: 'Zenith Logistics Ltd',
      sourceLocationId: sourceLocation.id,
      items: [{ productId: targetProduct.id, quantity: 20 }],
      notes: 'Golden Demo Step 3: Customer Dispatch (-20)',
    });
    await deliveryService.validate(del.documentId);
  };

  const executeStep4 = async () => {
    if (!targetProduct || !sourceLocation) throw new Error('Product/location not found');
    const adj = await adjustmentService.create({
      locationId: sourceLocation.id,
      reason: 'Physical Count Audit',
      notes: 'Golden Demo Step 4: Audit count reconciliation',
      items: [{ productId: targetProduct.id, physicalQuantity: 47 }],
    });
    await adjustmentService.validate(adj.documentId);
  };

  const handleRunStep = async (stepNum: number) => {
    setIsRunning(true);
    try {
      if (stepNum === 1) await executeStep1();
      else if (stepNum === 2) await executeStep2();
      else if (stepNum === 3) await executeStep3();
      else if (stepNum === 4) await executeStep4();

      confetti({
        particleCount: stepNum >= 4 ? 80 : 40,
        spread: 60,
        origin: { y: 0.6 },
      });
      showToast('success', `Step ${stepNum} Completed!`, `Operation executed and confirmed on backend database.`);
      if (stepNum < 5) {
        setCurrentStep(stepNum + 1);
      }
    } catch (err: any) {
      showToast('error', 'Execution Error', err?.message || 'Could not complete step');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunFullDemo = async () => {
    setIsRunning(true);
    try {
      await executeStep1();
      await new Promise((r) => setTimeout(r, 400));
      await executeStep2();
      await new Promise((r) => setTimeout(r, 400));
      await executeStep3();
      await new Promise((r) => setTimeout(r, 400));
      await executeStep4();

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
      setCurrentStep(5);
      showToast(
        'success',
        'Golden Demo Completed!',
        'All 4 operations executed and committed to PostgreSQL database. Inspect the Stock Ledger!'
      );
    } catch (err: any) {
      showToast('error', 'Demo Failed', err?.message || 'Error executing golden demo pipeline');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 720, maxHeight: '92vh', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #181226 0%, #2D1B4E 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={22} color="#DDD6FE" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, color: '#FFFFFF' }}>Hackathon Golden Demo Scenario</h2>
              <div style={{ fontSize: 12.5, color: '#CBD5E1', marginTop: 2 }}>
                Step-by-step authoritative inventory workflow proof for judges
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Status Box */}
        <div
          style={{
            background: '#F5F3FF',
            borderBottom: '1px solid #DDD6FE',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#5B21B6' }}>
              TARGET ITEM: {targetProduct?.name || 'Material Item'} ({targetProduct?.sku || 'SKU'})
            </span>
            <span className="badge badge-purple">{targetProduct?.totalStock ?? 0} {targetProduct?.unitOfMeasure || 'units'}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#4C1D95' }}>
            <span>Warehouse: <strong>{sourceLocation?.warehouseName || 'Main'}</strong></span>
            <span>Status: <strong>{targetProduct?.stockStatus || 'Active'}</strong></span>
          </div>
        </div>

        {/* Step Progression List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {steps.map((s) => {
            const isCompleted = currentStep > s.num || (currentStep === 5 && s.num < 5);
            const isCurrent = currentStep === s.num;

            return (
              <div
                key={s.num}
                style={{
                  border: `1.5px solid ${isCurrent ? '#6D28D9' : isCompleted ? '#A7F3D0' : '#E2E8F0'}`,
                  borderRadius: 12,
                  padding: '14px 18px',
                  background: isCurrent ? '#FAF5FF' : isCompleted ? '#F0FDF4' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isCompleted ? '#10B981' : isCurrent ? '#6D28D9' : '#F1F5F9',
                    color: isCompleted || isCurrent ? '#FFFFFF' : '#64748B',
                    fontWeight: 700,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={18} /> : s.num}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{s.title}</div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: `${s.badgeColor}15`,
                        color: s.badgeColor,
                        fontWeight: 600,
                      }}
                    >
                      {s.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#475569', marginTop: 3 }}>{s.desc}</div>
                  <div style={{ fontSize: 12, color: '#6D28D9', marginTop: 2, fontWeight: 500 }}>
                    Impact: {s.expected}
                  </div>
                </div>

                {s.num < 5 ? (
                  <button
                    onClick={() => handleRunStep(s.num)}
                    disabled={isRunning}
                    className="btn btn-sm btn-primary"
                    style={{ flexShrink: 0 }}
                  >
                    {isRunning && currentStep === s.num ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Play size={13} />
                    )}
                    Run Step {s.num}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onNavigate('ledger');
                      onClose();
                    }}
                    className="btn btn-sm btn-outline-purple"
                    style={{ flexShrink: 0 }}
                  >
                    <ScrollText size={13} />
                    Inspect Ledger
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer controls */}
        <div
          style={{
            padding: '16px 24px',
            background: '#FAFBFD',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => setCurrentStep(1)}
            className="btn btn-outline"
            style={{ fontSize: 12.5 }}
          >
            Reset Step View
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                onNavigate('dashboard');
                onClose();
              }}
              className="btn btn-outline"
            >
              View Dashboard
            </button>
            <button
              onClick={handleRunFullDemo}
              disabled={isRunning}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)' }}
            >
              {isRunning ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              Run 1-Click Golden Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
