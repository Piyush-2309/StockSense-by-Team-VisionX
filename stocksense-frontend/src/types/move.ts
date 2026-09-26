import type { MoveType, MoveStatus } from './common';

export interface StockMove {
  id: number;
  reference: string;
  type: MoveType;
  status: MoveStatus;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitOfMeasure: string;
  sourceLocationId?: number;
  sourceLocationName?: string;
  destinationLocationId?: number;
  destinationLocationName?: string;
  userId: number;
  userName: string;
  reason?: string;
  resultingQuantity?: number;
  createdAt: string;
}
