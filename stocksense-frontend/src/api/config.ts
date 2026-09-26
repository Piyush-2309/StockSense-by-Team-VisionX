import client from './client';
import type { Warehouse, WarehouseCreateRequest } from '../types/warehouse';
import type { Location, LocationCreateRequest } from '../types/location';
import type { Category, CategoryCreateRequest } from '../types/category';

export const warehouseApi = {
  list: () => client.get<Warehouse[]>('/warehouses'),
  get: (id: number) => client.get<Warehouse>(`/warehouses/${id}`),
  create: (data: WarehouseCreateRequest) => client.post<Warehouse>('/warehouses', data),
  update: (id: number, data: WarehouseCreateRequest) => client.put<Warehouse>(`/warehouses/${id}`, data),
};

export const locationApi = {
  list: (params?: Record<string, unknown>) => client.get<Location[]>('/locations', { params }),
  get: (id: number) => client.get<Location>(`/locations/${id}`),
  create: (data: LocationCreateRequest) => client.post<Location>('/locations', data),
  update: (id: number, data: LocationCreateRequest) => client.put<Location>(`/locations/${id}`, data),
};

export const categoryApi = {
  list: () => client.get<Category[]>('/categories'),
  get: (id: number) => client.get<Category>(`/categories/${id}`),
  create: (data: CategoryCreateRequest) => client.post<Category>('/categories', data),
  update: (id: number, data: CategoryCreateRequest) => client.put<Category>(`/categories/${id}`, data),
};
