import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, LogOut, Menu, X, LayoutDashboard, Package, PackagePlus, Truck, ArrowLeftRight, ClipboardCheck, ScrollText, BarChart3, MapPin, ShieldAlert, RefreshCw, Building2, MapPinned, Tags, User } from 'lucide-react';
import { cn } from '../../utils/cn';
import { NAV_ITEMS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const iconComponents: Record<string, any> = {
  LayoutDashboard,
  Package,
  PackagePlus,
  Truck,
  ArrowLeftRight,
  ClipboardCheck,
  ScrollText,
  BarChart3,
  MapPin,
  ShieldAlert,
  RefreshCw,
  Building2,
  MapPinned,
  Tags,
};

export default function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (open: boolean) => void }) {
  const { hasRole, logout } = useAuth();
  const location = useLocation();

  const handleClose = () => setMobileOpen(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center gap-2 text-primary-600">
          <Box className="w-6 h-6" />
          <span className="text-lg font-bold tracking-tight">StockSense</span>
        </div>
        <button
          onClick={handleClose}
          className="p-1 -mr-2 text-gray-500 rounded-md md:hidden hover:bg-gray-100 hover:text-gray-900"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-6">
          {NAV_ITEMS.map((group) => {
            if (group.managerOnly && !hasRole('MANAGER')) return null;

            return (
              <div key={group.group}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {group.group}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = iconComponents[item.icon];
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleClose}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-5 h-5',
                            isActive ? 'text-primary-600' : 'text-gray-400'
                          )}
                        />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <NavLink
          to="/profile"
          onClick={handleClose}
          className={cn(
            'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            location.pathname === '/profile'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          <User className="w-5 h-5 text-gray-400" />
          My Profile
        </NavLink>
        <button
          onClick={() => {
            handleClose();
            logout();
          }}
          className="flex items-center gap-3 px-3 py-2 mt-1 w-full text-left text-sm font-medium text-gray-700 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/80 backdrop-blur-sm md:hidden transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* Sidebar container */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex-shrink-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
