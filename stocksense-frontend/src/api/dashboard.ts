import client from './client';
import type { DashboardData, ReorderRecommendation, RiskItem } from '../types/dashboard';

export const dashboardApi = {
  get: () =>
    client.get<DashboardData>('/dashboard'),
};

export const riskApi = {
  list: () =>
    client.get<RiskItem[]>('/risk'),
};

export const reorderApi = {
  list: () =>
    client.get<ReorderRecommendation[]>('/reorder/recommendations'),
};
