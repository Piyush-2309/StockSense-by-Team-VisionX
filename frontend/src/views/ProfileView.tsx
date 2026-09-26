import React, { useState } from 'react';
import { User, LogOut, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { RouteId } from '../components/Sidebar';

interface ProfileViewProps {
  onNavigate: (route: RouteId) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || 'Administrator');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Profile Updated', 'User profile information updated.');
  };

  const handleLogout = () => {
    logout();
    showToast('info', 'Signed Out', 'You have been safely signed out.');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SS';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, color: '#0F172A' }}>My Profile & Settings</h1>
        <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
          Manage your StockSense account, user role, and session preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid #F1F5F9', paddingBottom: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#4C1D95',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(76, 29, 149, 0.35)',
            }}
          >
            {initials}
          </div>
          <div>
            <h2 style={{ fontSize: 20, color: '#0F172A' }}>{user?.name || 'Manager'}</h2>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>{user?.email || 'manager@stocksense.com'}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <span className="badge badge-purple">{user?.role || 'MANAGER'}</span>
              <span className="badge badge-success">JWT Session Active</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="input-label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="input-field"
                style={{ background: '#F8FAFC' }}
              />
            </div>
          </div>

          <div>
            <label className="input-label">System Role & Security Scope</label>
            <input
              type="text"
              disabled
              value={user?.role === 'MANAGER' ? 'Inventory Manager (Full Operations, Approvals & Ledger Verification)' : 'Warehouse Staff (Operations Execution)'}
              className="input-field"
              style={{ background: '#F8FAFC' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ color: '#EF4444', borderColor: '#FECACA' }}
            >
              <LogOut size={15} />
              Sign Out
            </button>

            <button type="submit" className="btn btn-primary" style={{ background: '#6D28D9' }}>
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
