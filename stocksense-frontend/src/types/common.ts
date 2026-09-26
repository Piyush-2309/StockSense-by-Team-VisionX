// Common shared types

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
}

export type StockStatus = 'HEALTHY' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type MoveType = 'RECEIPT' | 'DELIVERY' | 'INTERNAL' | 'ADJUSTMENT';
export type MoveStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';
export type AdjustmentReason = 'DAMAGED' | 'MISSING' | 'MISPLACED' | 'COUNTING_ERROR' | 'OTHER';
export type UserRole = 'MANAGER' | 'STAFF';
