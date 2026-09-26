export type UserRole = 'Inventory Manager' | 'Warehouse Staff' | 'Administrator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export type ProductStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Below Minimum' | 'High Consumption';

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  uom: string; // kg, roll, pcs, box, etc.
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  reorderLevel: number;
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
  sourceLocationId: string;
  sourceLocationName: string;
  destWarehouseId: string;
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
  active: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'out_of_stock' | 'pending_receipt' | 'pending_delivery' | 'pending_transfer' | 'adjustment';
  link: string;
  isRead: boolean;
  timestamp: string;
}

export interface DashboardStats {
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingReceiptsCount: number;
  pendingTransfersCount: number;
  pendingDeliveriesCount: number;
}
