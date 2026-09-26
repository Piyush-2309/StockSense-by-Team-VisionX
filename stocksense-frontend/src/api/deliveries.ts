import client from './client';
import type { Delivery, DeliveryCreateRequest } from '../types/delivery';
import type { PageResponse } from '../types/common';

export const deliveryApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PageResponse<Delivery>>('/deliveries', { params }),

  get: (id: number) =>
    client.get<Delivery>(`/deliveries/${id}`),

  create: (data: DeliveryCreateRequest) =>
    client.post<Delivery>('/deliveries', data),

  update: (id: number, data: Partial<DeliveryCreateRequest>) =>
    client.put<Delivery>(`/deliveries/${id}`, data),

  pick: (id: number) =>
    client.post<Delivery>(`/deliveries/${id}/pick`),

  pack: (id: number) =>
    client.post<Delivery>(`/deliveries/${id}/pack`),

  validate: (id: number) =>
    client.post<Delivery>(`/deliveries/${id}/validate`),

  cancel: (id: number) =>
    client.post<Delivery>(`/deliveries/${id}/cancel`),
};
