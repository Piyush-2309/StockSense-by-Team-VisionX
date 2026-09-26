import client from './client';
import type { StockMove } from '../types/move';
import type { PageResponse } from '../types/common';

export const ledgerApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PageResponse<StockMove>>('/moves', { params }),

  get: (id: number) =>
    client.get<StockMove>(`/moves/${id}`),
};
