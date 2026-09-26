import type { MoveStatus } from './common';

export interface DeliveryItem {
  productId: number;
  productName?: string;
  sku?: string;
  quantity: number;
  availableStock?: number;
  unitOfMeasure?: string;
}

export interface Delivery {
  id: number;
  reference: string;
  customer: string;
  sourceLocationId: number;
  sourceLocationName: string;
  warehouseName: string;
  status: MoveStatus;
  items: DeliveryItem[];
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryCreateRequest {
  customer: string;
  sourceLocationId: number;
  items: { productId: number; quantity: number }[];
  notes?: string;
}
