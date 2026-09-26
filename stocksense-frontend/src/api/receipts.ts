import client from './client';
import type { Receipt, ReceiptCreateRequest } from '../types/receipt';
import type { PageResponse } from '../types/common';

export const receiptApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PageResponse<Receipt>>('/receipts', { params }),

  get: (id: number) =>
    client.get<Receipt>(`/receipts/${id}`),

  create: (data: ReceiptCreateRequest) =>
    client.post<Receipt>('/receipts', data),

  update: (id: number, data: Partial<ReceiptCreateRequest>) =>
    client.put<Receipt>(`/receipts/${id}`, data),

  validate: (id: number) =>
    client.post<Receipt>(`/receipts/${id}/validate`),

  cancel: (id: number) =>
    client.post<Receipt>(`/receipts/${id}/cancel`),
};
