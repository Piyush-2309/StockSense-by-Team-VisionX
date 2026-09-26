export interface Location {
  id: number;
  name: string;
  code: string;
  warehouseId: number;
  warehouseName: string;
  parentLocationId?: number;
  parentLocationName?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationCreateRequest {
  name: string;
  code: string;
  warehouseId: number;
  parentLocationId?: number;
}
