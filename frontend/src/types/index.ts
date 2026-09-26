/**
 * StockSense Frontend Types — aligned with Spring Boot backend DTOs.
 *
 * All IDs are `number` (Java Long) except documentId which is `string` (UUID).
 * The backend uses a unified DocumentResponse for receipts, deliveries,
 * transfers, and adjustments — the frontend adapts this into view-friendly shapes.
 */

// ========================
// Auth
// ========================
export type UserRole = 'MANAGER' | 'STAFF';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

// ========================
// API envelope
// ========================
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ========================
// Products
// ========================
export type StockStatus = 'HEALTHY' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface ProductResponse {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  categoryName: string;
  unitOfMeasure: string;
  unitCost: number | null;
  reorderLevel: number;
  active: boolean;
  totalStock: number;
  stockStatus: StockStatus;
  createdAt: string;
  updatedAt: string;
}

// ========================
// Categories
// ========================
export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========================
// Warehouses
// ========================
export interface WarehouseResponse {
  id: number;
  name: string;
  code: string;
  address: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========================
// Locations
// ========================
export interface LocationResponse {
  id: number;
  name: string;
  code: string;
  warehouseId: number;
  warehouseName: string;
  parentLocationId: number | null;
  parentLocationName: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========================
// Stock
// ========================
export interface StockResponse {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  locationId: number;
  locationName: string;
  locationCode: string;
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityFree: number;
  unitOfMeasure: string;
  unitCost: number | null;
  reorderLevel: number;
  status: StockStatus;
  updatedAt: string;
}

// ========================
// Documents (unified: receipts, deliveries, transfers, adjustments, ledger)
// ========================
export type OperationType = 'RECEIPT' | 'DELIVERY' | 'INTERNAL' | 'ADJUSTMENT';
export type MoveStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

export interface MoveLineResponse {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unitOfMeasure: string;
  quantity: number;
  resultingQuantity: number | null;
  isShort?: boolean;
}

export interface DocumentResponse {
  documentId: string; // UUID
  reference: string;
  type: OperationType;
  status: MoveStatus;
  partnerName: string | null;
  reason: string | null;
  notes: string | null;
  scheduledDate: string | null;

  sourceLocationId: number | null;
  sourceLocationName: string | null;
  sourceLocationCode: string | null;
  sourceWarehouseId: number | null;
  sourceWarehouseName: string | null;

  destinationLocationId: number | null;
  destinationLocationName: string | null;
  destinationLocationCode: string | null;
  destinationWarehouseId: number | null;
  destinationWarehouseName: string | null;

  userId: number;
  userName: string;
  validatedById: number | null;
  validatedByName: string | null;

  lines: MoveLineResponse[];

  createdAt: string;
  updatedAt: string;
}

// ========================
// Dashboard
// ========================
export interface LowStockItem {
  productId: number;
  productName: string;
  sku: string;
  locationName: string;
  warehouseName: string;
  quantityOnHand: number;
  reorderLevel: number;
  status: string;
}

export interface DashboardData {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  pendingTransfers: number;
  pendingAdjustments: number;
  recentMovements: DocumentResponse[];
  lowStockItems: LowStockItem[];
}

// ========================
// Request types
// ========================
export interface MoveLineRequest {
  productId: number;
  quantity: number;
}

export interface AdjustmentLineRequest {
  productId: number;
  physicalQuantity: number;
}

export interface ReceiptRequest {
  supplier?: string;
  destinationLocationId: number;
  scheduledDate?: string;
  items: MoveLineRequest[];
  notes?: string;
}

export interface DeliveryRequest {
  customer?: string;
  sourceLocationId: number;
  scheduledDate?: string;
  items: MoveLineRequest[];
  notes?: string;
}

export interface TransferRequest {
  sourceLocationId: number;
  destinationLocationId: number;
  items: MoveLineRequest[];
  notes?: string;
}

export interface AdjustmentRequest {
  locationId: number;
  reason: string;
  notes?: string;
  items: AdjustmentLineRequest[];
}

export interface ProductRequest {
  name: string;
  sku: string;
  categoryId: number;
  unitOfMeasure: string;
  unitCost?: number;
  reorderLevel?: number;
}

// ========================
// Sidebar Route type (re-exported for convenience)
// ========================
export type RouteId =
  | 'login'
  | 'dashboard'
  | 'products'
  | 'receipts'
  | 'deliveries'
  | 'transfers'
  | 'adjustments'
  | 'stock'
  | 'stock-location'
  | 'ledger'
  | 'cycle-counts'
  | 'risk'
  | 'reorder'
  | 'warehouses'
  | 'locations'
  | 'categories'
  | 'reordering-rules'
  | 'profile';
