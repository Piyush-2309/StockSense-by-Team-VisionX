/**
 * StockSense API Service Layer
 *
 * Every method calls the real Spring Boot backend via apiClient.
 * NO mock data. NO inventoryEngine. The backend is the source of truth.
 */

import { apiClient } from './apiClient';
import type {
  ProductResponse,
  ProductRequest,
  CategoryResponse,
  WarehouseResponse,
  LocationResponse,
  StockResponse,
  DocumentResponse,
  DashboardData,
  PagedResponse,
  ReceiptRequest,
  DeliveryRequest,
  TransferRequest,
  AdjustmentRequest,
} from '../types';

// ========================
// Dashboard
// ========================
export const dashboardService = {
  getDashboard: () => apiClient.get<DashboardData>('/api/v1/dashboard'),
};

// ========================
// Products
// ========================
export const productService = {
  list: (params?: { q?: string; categoryId?: number; page?: number; size?: number; sort?: string }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set('q', params.q);
    if (params?.categoryId) sp.set('categoryId', String(params.categoryId));
    sp.set('page', String(params?.page ?? 0));
    sp.set('size', String(params?.size ?? 100));
    if (params?.sort) sp.set('sort', params.sort);
    return apiClient.get<PagedResponse<ProductResponse>>(`/api/v1/products?${sp}`);
  },
  getById: (id: number) => apiClient.get<ProductResponse>(`/api/v1/products/${id}`),
  create: (data: ProductRequest) => apiClient.post<ProductResponse>('/api/v1/products', data),
  update: (id: number, data: ProductRequest) => apiClient.put<ProductResponse>(`/api/v1/products/${id}`, data),
  remove: (id: number) => apiClient.delete<void>(`/api/v1/products/${id}`),
};

// ========================
// Categories
// ========================
export const categoryService = {
  list: () => apiClient.get<CategoryResponse[]>('/api/v1/categories'),
  getById: (id: number) => apiClient.get<CategoryResponse>(`/api/v1/categories/${id}`),
  create: (data: { name: string; description?: string }) =>
    apiClient.post<CategoryResponse>('/api/v1/categories', data),
  update: (id: number, data: { name: string; description?: string }) =>
    apiClient.put<CategoryResponse>(`/api/v1/categories/${id}`, data),
  remove: (id: number) => apiClient.delete<void>(`/api/v1/categories/${id}`),
};

// ========================
// Warehouses
// ========================
export const warehouseService = {
  list: () => apiClient.get<WarehouseResponse[]>('/api/v1/warehouses'),
  getById: (id: number) => apiClient.get<WarehouseResponse>(`/api/v1/warehouses/${id}`),
  create: (data: { name: string; code: string; address?: string }) =>
    apiClient.post<WarehouseResponse>('/api/v1/warehouses', data),
  update: (id: number, data: { name: string; code: string; address?: string }) =>
    apiClient.put<WarehouseResponse>(`/api/v1/warehouses/${id}`, data),
};

// ========================
// Locations
// ========================
export const locationService = {
  list: (params?: { warehouseId?: number; parentLocationId?: number; active?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.warehouseId) sp.set('warehouseId', String(params.warehouseId));
    if (params?.parentLocationId) sp.set('parentLocationId', String(params.parentLocationId));
    if (params?.active !== undefined) sp.set('active', String(params.active));
    const q = sp.toString();
    return apiClient.get<LocationResponse[]>(`/api/v1/locations${q ? '?' + q : ''}`);
  },
  getById: (id: number) => apiClient.get<LocationResponse>(`/api/v1/locations/${id}`),
  create: (data: { name: string; code: string; warehouseId: number; parentLocationId?: number }) =>
    apiClient.post<LocationResponse>('/api/v1/locations', data),
  update: (id: number, data: { name: string; code: string; warehouseId: number; parentLocationId?: number }) =>
    apiClient.put<LocationResponse>(`/api/v1/locations/${id}`, data),
  remove: (id: number) => apiClient.delete<void>(`/api/v1/locations/${id}`),
};

// ========================
// Stock
// ========================
export const stockService = {
  list: () => apiClient.get<StockResponse[]>('/api/v1/stock'),
  byProduct: (productId: number) => apiClient.get<StockResponse[]>(`/api/v1/stock/product/${productId}`),
  byLocation: (locationId: number) => apiClient.get<StockResponse[]>(`/api/v1/stock/location/${locationId}`),
  updateDirectly: (stockId: number, data: { newQuantityOnHand: number; reason: string }) =>
    apiClient.patch<DocumentResponse>(`/api/v1/stock/${stockId}`, data),
};

// ========================
// Receipts
// ========================
export const receiptService = {
  list: (params?: { status?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    sp.set('page', String(params?.page ?? 0));
    sp.set('size', String(params?.size ?? 100));
    return apiClient.get<PagedResponse<DocumentResponse>>(`/api/v1/receipts?${sp}`);
  },
  getById: (documentId: string) => apiClient.get<DocumentResponse>(`/api/v1/receipts/${documentId}`),
  create: (data: ReceiptRequest) => apiClient.post<DocumentResponse>('/api/v1/receipts', data),
  update: (documentId: string, data: ReceiptRequest) =>
    apiClient.put<DocumentResponse>(`/api/v1/receipts/${documentId}`, data),
  markReady: (documentId: string) =>
    apiClient.patch<DocumentResponse>(`/api/v1/receipts/${documentId}/mark-ready`),
  validate: (documentId: string) =>
    apiClient.patch<DocumentResponse>(`/api/v1/receipts/${documentId}/validate`),
  cancel: (documentId: string) =>
    apiClient.patch<DocumentResponse>(`/api/v1/receipts/${documentId}/cancel`),
};

// ========================
// Deliveries
// ========================
export const deliveryService = {
  list: (params?: { status?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    sp.set('page', String(params?.page ?? 0));
    sp.set('size', String(params?.size ?? 100));
    return apiClient.get<PagedResponse<DocumentResponse>>(`/api/v1/deliveries?${sp}`);
  },
  getById: (documentId: string) => apiClient.get<DocumentResponse>(`/api/v1/deliveries/${documentId}`),
  create: (data: DeliveryRequest) => apiClient.post<DocumentResponse>('/api/v1/deliveries', data),
  update: (documentId: string, data: DeliveryRequest) =>
    apiClient.put<DocumentResponse>(`/api/v1/deliveries/${documentId}`, data),
  checkAvailability: (documentId: string) =>
    apiClient.patch<DocumentResponse>(`/api/v1/deliveries/${documentId}/check-availability`),
  validate: (documentId: string) =>
    apiClient.patch<DocumentResponse>(`/api/v1/deliveries/${documentId}/validate`),
  cancel: (documentId: string) =>
    apiClient.patch<DocumentResponse>(`/api/v1/deliveries/${documentId}/cancel`),
};

// ========================
// Transfers
// ========================
export const transferService = {
  list: (params?: { status?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    sp.set('page', String(params?.page ?? 0));
    sp.set('size', String(params?.size ?? 100));
    return apiClient.get<PagedResponse<DocumentResponse>>(`/api/v1/transfers?${sp}`);
  },
  getById: (documentId: string) => apiClient.get<DocumentResponse>(`/api/v1/transfers/${documentId}`),
  create: (data: TransferRequest) => apiClient.post<DocumentResponse>('/api/v1/transfers', data),
  update: (documentId: string, data: TransferRequest) =>
    apiClient.put<DocumentResponse>(`/api/v1/transfers/${documentId}`, data),
  validate: (documentId: string) =>
    apiClient.patch<DocumentResponse>(`/api/v1/transfers/${documentId}/validate`),
  cancel: (documentId: string) =>
    apiClient.patch<DocumentResponse>(`/api/v1/transfers/${documentId}/cancel`),
};

// ========================
// Adjustments
// ========================
export const adjustmentService = {
  list: (params?: { status?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    sp.set('page', String(params?.page ?? 0));
    sp.set('size', String(params?.size ?? 100));
    return apiClient.get<PagedResponse<DocumentResponse>>(`/api/v1/adjustments?${sp}`);
  },
  getById: (documentId: string) => apiClient.get<DocumentResponse>(`/api/v1/adjustments/${documentId}`),
  create: (data: AdjustmentRequest) => apiClient.post<DocumentResponse>('/api/v1/adjustments', data),
  validate: (documentId: string) =>
    apiClient.patch<DocumentResponse>(`/api/v1/adjustments/${documentId}/validate`),
  cancel: (documentId: string) =>
    apiClient.patch<DocumentResponse>(`/api/v1/adjustments/${documentId}/cancel`),
};

// ========================
// Moves / Ledger
// ========================
export const ledgerService = {
  list: (params?: { type?: string; status?: string; productId?: number; search?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.type) sp.set('type', params.type);
    if (params?.status) sp.set('status', params.status);
    if (params?.productId) sp.set('productId', String(params.productId));
    if (params?.search) sp.set('search', params.search);
    sp.set('page', String(params?.page ?? 0));
    sp.set('size', String(params?.size ?? 100));
    return apiClient.get<PagedResponse<DocumentResponse>>(`/api/v1/moves?${sp}`);
  },
  getById: (documentId: string) => apiClient.get<DocumentResponse>(`/api/v1/moves/${documentId}`),
};
