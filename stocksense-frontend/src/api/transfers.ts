import client from './client';
import type { Transfer, TransferCreateRequest } from '../types/transfer';
import type { PageResponse } from '../types/common';

export const transferApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PageResponse<Transfer>>('/transfers', { params }),

  get: (id: number) =>
    client.get<Transfer>(`/transfers/${id}`),

  create: (data: TransferCreateRequest) =>
    client.post<Transfer>('/transfers', data),

  update: (id: number, data: Partial<TransferCreateRequest>) =>
    client.put<Transfer>(`/transfers/${id}`, data),

  validate: (id: number) =>
    client.post<Transfer>(`/transfers/${id}/validate`),

  cancel: (id: number) =>
    client.post<Transfer>(`/transfers/${id}/cancel`),
};
