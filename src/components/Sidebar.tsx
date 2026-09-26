import React from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  Truck,
  ArrowLeftRight,
  Sliders,
  Layers,
  ScrollText,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Building2,
  Tag,
  Settings2,
  User,
  LogOut,
  Boxes,
} from 'lucide-react';

export type RouteId =
  | 'dashboard'
  | 'products'
  | 'receipts'
  | 'deliveries'
  | 'transfers'
  | 'adjustments'
  | 'stock'
  | 'ledger'
  | 'locations'
  | 'stock-location'
  | 'cycle-counts'
  | 'risk'
  | 'reorder'
  | 'warehouses'
  | 'categories'
  | 'reordering-rules'
  | 'profile'
  | 'login';

interface SidebarProps {
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  pendingReceipts: number;
  pendingTransfers: number;
  pendingDeliveries: number;
  risksCount: number;
}

interface NavItem {
  id: RouteId;
  label: string;
  icon: any;
  badge?: number;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  pendingReceipts,
  pendingTransfers,
  pendingDeliveries,
  risksCount,
}) => {
  const navSections: NavSection[] = [
    {
      title: '',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'products', label: 'Products', icon: Package },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'receipts', label: 'Receipts', icon: ArrowDownToLine, badge: pendingReceipts > 0 ? pendingReceipts : undefined },
        { id: 'deliveries', label: 'Deliveries', icon: Truck, badge: pendingDeliveries > 0 ? pendingDeliveries : undefined },
        { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight, badge: pendingTransfers > 0 ? pendingTransfers : undefined },
        { id: 'adjustments', label: 'Adjustments', icon: Sliders },
      ],
    },
    {
      title: 'INVENTORY',
      items: [
        { id: 'stock', label: 'Stock Overview', icon: Layers },
        { id: 'ledger', label: 'Stock Ledger', icon: ScrollText },
        { id: 'locations', label: 'Locations', icon: MapPin },
        { id: 'stock-location', label: 'Stock by Location', icon: Boxes },
        { id: 'cycle-counts', label: 'Cycle Counts', icon: RefreshCw },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'risk', label: 'Risk Center', icon: AlertTriangle, badge: risksCount > 0 ? risksCount : undefined, badgeColor: '#EF4444' },
        { id: 'reorder', label: 'Reorder Recommendations', icon: Lightbulb },
      ],
    },
    {
      title: 'CONFIGURATION',
      items: [
        { id: 'warehouses', label: 'Warehouses', icon: Building2 },
        { id: 'categories', label: 'Categories', icon: Tag },
        { id: 'reordering-rules', label: 'Reordering Rules', icon: Settings2 },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: 254,
        background: '#181226',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        zIndex: 50,
        userSelect: 'none',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '24px 20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          cursor: 'pointer',
        }}
        onClick={() => onNavigate('dashboard')}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(109, 40, 217, 0.35)',
            flexShrink: 0,
          }}
        >
          {/* Isometric Cube SVG */}
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <polygon points="12,3 20,7.5 12,12 4,7.5" fill="#DDD6FE" />
            <polygon points="4,7.5 12,12 12,21 4,16.5" fill="#A78BFA" />
            <polygon points="12,12 20,7.5 20,16.5 12,21" fill="#8B5CF6" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            StockSense
          </div>
          <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2, letterSpacing: '0.01em' }}>
            Smarter Inventory. Stronger Business.
          </div>
        </div>
      </div>

      {/* Navigation Links Scrollable Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {navSections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#64748B',
                  padding: '4px 12px 6px',
                  textTransform: 'uppercase',
                }}
              >
                {section.title}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.items.map((item) => {
                const isActive = currentRoute === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: isActive ? '#6D28D9' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#CBD5E1',
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Icon size={18} color={isActive ? '#FFFFFF' : '#94A3B8'} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '1px 7px',
                          borderRadius: 999,
                          background: item.badgeColor || (isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)'),
                          color: item.badgeColor ? '#FFFFFF' : (isActive ? '#6D28D9' : '#FFFFFF'),
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Profile & Logout */}
      <div
        style={{
          padding: '14px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <button
          onClick={() => onNavigate('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: currentRoute === 'profile' ? '#6D28D9' : 'transparent',
            color: currentRoute === 'profile' ? '#FFFFFF' : '#CBD5E1',
            fontSize: 13.5,
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <User size={18} color={currentRoute === 'profile' ? '#FFFFFF' : '#94A3B8'} />
          <span>My Profile</span>
        </button>
        <button
          onClick={() => onNavigate('login')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: '#F87171',
            fontSize: 13.5,
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={18} color="#F87171" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
