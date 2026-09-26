import type { MoveType, MoveStatus, StockStatus, AdjustmentReason } from '../types/common';

// Status display configuration
export const STATUS_CONFIG: Record<MoveStatus, { label: string; color: string; bg: string; border: string }> = {
  DRAFT:    { label: 'Draft',    color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  WAITING:  { label: 'Waiting',  color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  READY:    { label: 'Ready',    color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  DONE:     { label: 'Done',     color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  CANCELED: { label: 'Canceled', color: 'text-gray-500',   bg: 'bg-gray-100',  border: 'border-gray-200' },
};

// Stock status display configuration
export const STOCK_STATUS_CONFIG: Record<StockStatus, { label: string; color: string; dotColor: string }> = {
  HEALTHY:      { label: 'Healthy',      color: 'text-green-700', dotColor: 'bg-green-500' },
  LOW_STOCK:    { label: 'Low Stock',    color: 'text-amber-700', dotColor: 'bg-amber-500' },
  OUT_OF_STOCK: { label: 'Out of Stock', color: 'text-red-700',   dotColor: 'bg-red-500' },
};

// Move type display configuration
export const MOVE_TYPE_CONFIG: Record<MoveType, { label: string; color: string; bg: string; icon: string }> = {
  RECEIPT:    { label: 'Receipt',    color: 'text-green-700', bg: 'bg-green-50', icon: '📥' },
  DELIVERY:   { label: 'Delivery',   color: 'text-red-700',   bg: 'bg-red-50',   icon: '📤' },
  INTERNAL:   { label: 'Transfer',   color: 'text-blue-700',  bg: 'bg-blue-50',  icon: '🔄' },
  ADJUSTMENT: { label: 'Adjustment', color: 'text-amber-700', bg: 'bg-amber-50', icon: '📐' },
};

// Adjustment reasons
export const ADJUSTMENT_REASONS: Record<AdjustmentReason, string> = {
  DAMAGED:        'Damaged',
  MISSING:        'Missing',
  MISPLACED:      'Misplaced',
  COUNTING_ERROR: 'Counting Error',
  OTHER:          'Other',
};

// API error code to user-friendly message mapping
export const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_STOCK:       'Insufficient stock for this operation.',
  INVALID_STATE_TRANSITION: 'This operation cannot be performed in the current state.',
  DUPLICATE_SKU:            'A product with this SKU already exists.',
  DUPLICATE_EMAIL:          'An account with this email already exists.',
  RESOURCE_NOT_FOUND:       'The requested item was not found.',
  INVALID_CREDENTIALS:      'Invalid email or password.',
  INVALID_OTP:              'Invalid OTP code.',
  OTP_EXPIRED:              'OTP has expired. Please request a new one.',
  OTP_RATE_LIMIT:           'Too many attempts. Please wait before trying again.',
  INVALID_LOCATION:         'Invalid location specified.',
  INVALID_TRANSFER:         'Invalid transfer — source and destination must be different.',
};

// Navigation items
export const NAV_ITEMS = [
  {
    group: 'Main',
    items: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
      { label: 'Products', path: '/products', icon: 'Package' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Receipts', path: '/receipts', icon: 'PackagePlus' },
      { label: 'Delivery Orders', path: '/deliveries', icon: 'Truck' },
      { label: 'Internal Transfers', path: '/transfers', icon: 'ArrowLeftRight' },
      { label: 'Adjustments', path: '/adjustments', icon: 'ClipboardCheck' },
      { label: 'Move History', path: '/ledger', icon: 'ScrollText' },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { label: 'Stock Overview', path: '/stock', icon: 'BarChart3' },
      { label: 'Stock by Location', path: '/stock/by-location', icon: 'MapPin' },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { label: 'Risk Center', path: '/risk', icon: 'ShieldAlert' },
      { label: 'Reorder', path: '/reorder', icon: 'RefreshCw' },
    ],
  },
  {
    group: 'Configuration',
    items: [
      { label: 'Warehouses', path: '/warehouses', icon: 'Building2' },
      { label: 'Locations', path: '/locations', icon: 'MapPinned' },
      { label: 'Categories', path: '/categories', icon: 'Tags' },
    ],
    managerOnly: true,
  },
];

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
