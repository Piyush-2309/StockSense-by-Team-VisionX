import type { StockStatus } from './common';

export interface Stock {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  warehouseId: number;
  warehouseName: string;
  locationId: number;
  locationName: string;
  quantity: number;
  unitOfMeasure: string;
  reorderLevel: number;
  status: StockStatus;
}

export interface StockByLocation {
  warehouseId: number;
  warehouseName: string;
  locations: LocationStock[];
}

export interface LocationStock {
  locationId: number;
  locationName: string;
  items: LocationStockItem[];
  children?: LocationStock[];
}

export interface LocationStockItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitOfMeasure: string;
  status: StockStatus;
}
