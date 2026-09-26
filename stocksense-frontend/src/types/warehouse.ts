export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseCreateRequest {
  name: string;
  code: string;
  address?: string;
}
