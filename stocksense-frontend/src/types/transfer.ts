import type { MoveStatus } from './common';

export interface TransferItem {
  productId: number;
  productName?: string;
  sku?: string;
  quantity: number;
  availableStock?: number;
  unitOfMeasure?: string;
}

export interface Transfer {
  id: number;
  reference: string;
  sourceLocationId: number;
  sourceLocationName: string;
  sourceWarehouseName: string;
  destinationLocationId: number;
  destinationLocationName: string;
  destinationWarehouseName: string;
  status: MoveStatus;
  items: TransferItem[];
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferCreateRequest {
  sourceLocationId: number;
  destinationLocationId: number;
  items: { productId: number; quantity: number }[];
  notes?: string;
}
