import client from './client';
import type { Adjustment, AdjustmentCreateRequest } from '../types/adjustment';
import type { PageResponse } from '../types/common';

export const adjustmentApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PageResponse<Adjustment>>('/adjustments', { params }),

  get: (id: number) =>
    client.get<Adjustment>(`/adjustments/${id}`),

  create: (data: AdjustmentCreateRequest) =>
    client.post<Adjustment>('/adjustments', data),

  apply: (id: number) =>
    client.post<Adjustment>(`/adjustments/${id}/apply`),

  cancel: (id: number) =>
    client.post<Adjustment>(`/adjustments/${id}/cancel`),
};
