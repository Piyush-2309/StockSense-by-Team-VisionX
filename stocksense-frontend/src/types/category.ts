export interface Category {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
}
