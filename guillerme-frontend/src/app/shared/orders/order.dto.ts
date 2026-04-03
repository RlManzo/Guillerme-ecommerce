export interface OrderSummaryDto {
  id: number;
  createdAt: string; // ISO
  totalItems: number;
  status: string;
}

export interface OrderItemDto {
  productId: number;
  productNombre: string;
  qty: number;
  unitPrice: number | null;
}

export interface OrderDetailDto {
  id: number;
  createdAt: string;
  status: string;
  items: OrderItemDto[];
  comment?: string | null;
}