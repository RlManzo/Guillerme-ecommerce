export interface OrderSummaryDto {
  id: number;
  createdAt: string; // ISO
  totalItems: number;
  status: string; // "CREATED", etc
}

export interface OrderItemDto {
  productId: number;
  productNombre: string;
  qty: number;
}

export interface OrderDetailDto {
  id: number;
  createdAt: string;
  status: string;
  items: OrderItemDto[];
  comment?: string | null;
}

