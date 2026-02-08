import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrderDetailDto, OrderSummaryDto } from './order.dto';

export interface CheckoutItemDto {
  productId: number;
  qty: number;
}

export interface CheckoutRequestDto {
  items: CheckoutItemDto[];
  comment?: string | null;
}

export interface CheckoutResponseDto {
  orderId: number;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  constructor(private http: HttpClient) {}

  checkout(body: CheckoutRequestDto) {
    return this.http.post<CheckoutResponseDto>('/api/orders/checkout', body);
  }

  listMine() {
    // ✅ tu backend usa GET /api/orders
    return this.http.get<OrderSummaryDto[]>('/api/orders');
  }

  getById(id: number) {
    return this.http.get<OrderDetailDto>(`/api/orders/${id}`);
  }
}
