import type { StockStatus } from './common';
import type { StockMove } from './move';

export interface DashboardData {
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  pendingTransfers: number;
  stockByLocation: DashboardStockLocation[];
  recentMovements: StockMove[];
  riskItems: RiskItem[];
  operationsToday: OperationsSummary;
}

export interface DashboardStockLocation {
  warehouseName: string;
  locationName: string;
  totalQuantity: number;
}

export interface RiskItem {
  productId: number;
  productName: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  unitOfMeasure: string;
  status: StockStatus;
  riskCategory: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'LARGE_VARIANCE' | 'PENDING_ACTION';
}

export interface OperationsSummary {
  receipts: number;
  deliveries: number;
  transfers: number;
  adjustments: number;
}

export interface ReorderRecommendation {
  productId: number;
  productName: string;
  sku: string;
  currentStock: number;
  minimumLevel: number;
  targetLevel: number;
  suggestedReorder: number;
  unitOfMeasure: string;
}
