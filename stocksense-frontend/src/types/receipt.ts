import type { MoveStatus } from './common';

export interface ReceiptItem {
  productId: number;
  productName?: string;
  sku?: string;
  quantity: number;
  unitOfMeasure?: string;
}

export interface Receipt {
  id: number;
  reference: string;
  supplier: string;
  destinationLocationId: number;
  destinationLocationName: string;
  warehouseName: string;
  status: MoveStatus;
  items: ReceiptItem[];
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptCreateRequest {
  supplier: string;
  destinationLocationId: number;
  items: { productId: number; quantity: number }[];
  notes?: string;
}
