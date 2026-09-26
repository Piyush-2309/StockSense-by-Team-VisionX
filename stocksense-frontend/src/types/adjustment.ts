import type { MoveStatus, AdjustmentReason } from './common';

export interface Adjustment {
  id: number;
  reference: string;
  productId: number;
  productName: string;
  sku: string;
  locationId: number;
  locationName: string;
  warehouseName: string;
  systemQuantity: number;
  physicalQuantity: number;
  delta: number;
  reason: AdjustmentReason;
  status: MoveStatus;
  notes?: string;
  unitOfMeasure: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdjustmentCreateRequest {
  productId: number;
  locationId: number;
  physicalQuantity: number;
  reason: AdjustmentReason;
  notes?: string;
}
