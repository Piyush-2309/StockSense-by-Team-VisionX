import React, { useState } from 'react';
import {
  Search,
  Building,
  Bell,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Bot,
  User as UserIcon,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { WarehouseResponse, User } from '../types';

interface TopbarProps {
  warehouses: WarehouseResponse[];
  selectedWarehouse: string;
  onSelectWarehouse: (warehouseId: string) => void;
  user: User;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
  onOpenAi: () => void;
  onOpenGoldenDemo: () => void;
  onResetData: () => void;
  onNavigate: (route: any) => void;
  onLogout?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  warehouses,
  selectedWarehouse,
  onSelectWarehouse,
  user,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenSearch,
  onOpenAi,
  onOpenGoldenDemo,
  onResetData,
  onNavigate,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showWarehouseMenu, setShowWarehouseMenu] = useState(false);

  const currentWarehouseName =
    selectedWarehouse === 'all'
      ? 'All Warehouses'
      : warehouses.find((w) => String(w.id) === selectedWarehouse)?.name || 'Main Warehouse';

  return (
    <header
      style={{
        height: 70,
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Global Search Bar */}
      <div style={{ flex: 1, maxWidth: 520, position: 'relative' }}>
        <button
          onClick={onOpenSearch}
          style={{
            width: '100%',
            height: 42,
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            textAlign: 'left',
            color: '#64748B',
            fontSize: 13.5,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#CBD5E1';
            e.currentTarget.style.background = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.background = '#F8FAFC';
          }}
        >
          <Search size={17} color="#94A3B8" />
          <span style={{ flex: 1 }}>Search products, SKU, transfers, receipts...</span>
          <kbd
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 6,
              padding: '2px 6px',
              fontSize: 11,
              fontWeight: 600,
              color: '#64748B',
              boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
            }}
          >
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Golden Demo Runner Action */}
        <button
          onClick={onOpenGoldenDemo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 13px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(124, 58, 237, 0.35)',
            transition: 'transform 0.15s ease',
          }}
          title="Interactive walkthrough of the Hackathon Golden Demo"
        >
          <Sparkles size={15} />
          <span>Demo Flow</span>
        </button>

        {/* AI Assistant Quick Button */}
        <button
          onClick={onOpenAi}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            background: '#F5F3FF',
            color: '#6D28D9',
            border: '1px solid #DDD6FE',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          title="Ask StockSense AI about stock risks and inventory movements"
        >
          <Bot size={15} />
          <span>Ask AI</span>
        </button>

        {/* Reset Demo Data Button */}
        <button
          onClick={onResetData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 10px',
            background: '#FFFFFF',
            color: '#64748B',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
          title="Reset database to initial demo state"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>

        {/* Warehouse Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowWarehouseMenu(!showWarehouseMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <Building size={16} color="#6D28D9" />
            <span>{currentWarehouseName}</span>
            <ChevronDown size={14} color="#94A3B8" />
          </button>

          {showWarehouseMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                minWidth: 190,
                zIndex: 100,
              }}
            >
              <div
                onClick={() => {
                  onSelectWarehouse('all');
                  setShowWarehouseMenu(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: selectedWarehouse === 'all' ? 600 : 500,
                  color: selectedWarehouse === 'all' ? '#6D28D9' : '#334155',
                  background: selectedWarehouse === 'all' ? '#F5F3FF' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                All Warehouses
              </div>
              {warehouses.map((w) => (
                <div
                  key={w.id}
                  onClick={() => {
                    onSelectWarehouse(String(w.id));
                    setShowWarehouseMenu(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: selectedWarehouse === String(w.id) ? 600 : 500,
                    color: selectedWarehouse === String(w.id) ? '#6D28D9' : '#334155',
                    background: selectedWarehouse === String(w.id) ? '#F5F3FF' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  {w.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon with Badge */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={onOpenNotifications}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              color: '#475569',
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: 10.5,
                  fontWeight: 700,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #FFFFFF',
                }}
              >
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '4px 8px 4px 4px',
              border: '1px solid transparent',
              borderRadius: 24,
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#4C1D95',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(76, 29, 149, 0.25)',
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{user.role}</div>
            </div>
            <ChevronDown size={14} color="#94A3B8" />
          </button>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                minWidth: 200,
                zIndex: 100,
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{user.email}</div>
              </div>

              <div
                onClick={() => {
                  onNavigate('profile');
                  setShowProfileMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                <UserIcon size={15} />
                <span>My Profile</span>
              </div>

              <div
                onClick={() => {
                  onNavigate('reordering-rules');
                  setShowProfileMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                <ShieldCheck size={15} />
                <span>ERP Permissions</span>
              </div>

              <div
                onClick={() => {
                  if (onLogout) onLogout();
                  else onNavigate('login');
                  setShowProfileMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#EF4444',
                  cursor: 'pointer',
                  borderTop: '1px solid #F1F5F9',
                }}
              >
                <LogOut size={15} />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
