import client from './client';
import type { Product, ProductCreateRequest, ProductUpdateRequest } from '../types/product';
import type { PageResponse } from '../types/common';

export const productApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PageResponse<Product>>('/products', { params }),

  get: (id: number) =>
    client.get<Product>(`/products/${id}`),

  create: (data: ProductCreateRequest) =>
    client.post<Product>('/products', data),

  update: (id: number, data: ProductUpdateRequest) =>
    client.put<Product>(`/products/${id}`, data),

  delete: (id: number) =>
    client.delete(`/products/${id}`),
};
