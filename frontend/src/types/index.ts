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
<<<<<<< HEAD
=======
  targetLevel: number;
  status: ProductStatus;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  locationCount: number;
  status: 'Active' | 'Inactive';
}

export interface Location {
  id: string;
  warehouseId: string;
  warehouseName: string;
  code: string;
  name: string;
  type: 'Internal' | 'Production' | 'Transit' | 'Vendor' | 'Customer';
  parentLocationId?: string;
  status: 'Active' | 'Inactive';
}

export interface StockQuant {
  id: string;
  productId: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
}

export type ReceiptStatus = 'Draft' | 'Ready' | 'Done' | 'Cancelled';

export interface ReceiptItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  uom: string;
  orderedQty: number;
  receivedQty: number;
}

export interface Receipt {
  id: string;
  reference: string; // e.g. RC-0042
  supplier: string;
  warehouseId: string;
  locationId: string;
  warehouseName: string;
  locationName: string;
  items: ReceiptItem[];
  status: ReceiptStatus;
  date: string;
  notes?: string;
}

export type DeliveryStatus = 'Draft' | 'Picked' | 'Packed' | 'Ready' | 'Done' | 'Cancelled';

export interface DeliveryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  uom: string;
  availableQty: number;
  requestedQty: number;
  deliveredQty: number;
}

export interface Delivery {
  id: string;
  reference: string; // e.g. DO-0028
  customer: string;
  warehouseId: string;
  locationId: string;
  warehouseName: string;
  locationName: string;
  items: DeliveryItem[];
  status: DeliveryStatus;
  date: string;
  notes?: string;
}

export type TransferStatus = 'Draft' | 'Ready' | 'Done' | 'Cancelled';

export interface TransferItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  uom: string;
  availableQty: number;
  quantity: number;
}

export interface InternalTransfer {
  id: string;
  reference: string; // e.g. INT-0091
  sourceWarehouseId: string;
  sourceWarehouseName?: string;
  sourceLocationId: string;
  sourceLocationName: string;
  destWarehouseId: string;
  destWarehouseName?: string;
  destLocationId: string;
  destLocationName: string;
  items: TransferItem[];
  status: TransferStatus;
  date: string;
  notes?: string;
}

export type AdjustmentReason = 'Damaged' | 'Missing' | 'Misplaced' | 'Counting Error' | 'Other';
export type AdjustmentStatus = 'Draft' | 'Applied';

export interface Adjustment {
  id: string;
  reference: string; // e.g. ADJ-0012
  warehouseId: string;
  locationId: string;
  locationName: string;
  productId: string;
  productName: string;
  sku: string;
  uom: string;
  systemQuantity: number;
  physicalCount: number;
  variance: number;
  reason: AdjustmentReason;
  status: AdjustmentStatus;
  date: string;
  notes?: string;
}

export type MovementType = 'Receipt' | 'Delivery' | 'Internal Transfer' | 'Adjustment';

export interface StockLedgerEntry {
  id: string;
  reference: string;
  timestamp: string;
  type: MovementType;
  productId: string;
  productName: string;
  sku: string;
  fromLocation: string;
  toLocation: string;
  quantity: number; // positive or negative
  uom: string;
  user: string;
  status: 'Done';
  notes?: string;
  impact?: 'IN' | 'OUT' | 'INTERNAL';
  balanceAfter?: number;
}

export type CycleCountStatus = 'Pending' | 'Counting' | 'Review' | 'Completed';

export interface CycleCount {
  id: string;
  locationId: string;
  locationName: string;
  productId: string;
  productName: string;
  sku: string;
  uom: string;
  systemQuantity: number;
  countedQuantity?: number;
  variance?: number;
  assignedTo: string;
  status: CycleCountStatus;
  lastCountDate: string;
  nextCountDate: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  productCount: number;
}

export interface ReorderingRule {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  uom: string;
  warehouseId: string;
  warehouseName: string;
  minQuantity: number;
  targetQuantity: number;
>>>>>>> e5898a935da6d61920e1ab01dc90bd3dfb05bc54
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
