import type { StockStatus } from './common';

export interface Product {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  categoryName: string;
  unitOfMeasure: string;
  reorderLevel: number;
  currentStock: number;
  status: StockStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateRequest {
  name: string;
  sku: string;
  categoryId: number;
  unitOfMeasure: string;
  reorderLevel: number;
}

export interface ProductUpdateRequest extends ProductCreateRequest {
  active?: boolean;
}
