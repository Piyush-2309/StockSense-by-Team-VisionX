import client from './client';
import type { Stock } from '../types/stock';
import type { PageResponse } from '../types/common';

export const stockApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PageResponse<Stock>>('/stock', { params }),

  getByProduct: (productId: number) =>
    client.get<Stock[]>(`/stock/product/${productId}`),

  getByLocation: (locationId: number) =>
    client.get<Stock[]>(`/stock/location/${locationId}`),
};
