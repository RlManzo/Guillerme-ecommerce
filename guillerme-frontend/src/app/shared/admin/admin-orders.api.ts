import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';


export type OrderStatus =
  | 'NUEVO'
  | 'PENDIENTE_DE_PAGO'
  | 'PAGADO'
  | 'ENVIADO';  

export interface AdminOrderSummaryDto {
  id: number;
  createdAt: string; // ISO
  status: OrderStatus;
  totalItems: number;

  // ✅ según tu error, vos tenés userEmail
  userEmail: string;

  // ✅ y estos te faltan para el HTML (sumalos)
  customerNombre: string;
  customerApellido: string;
}

export interface AdminOrderItemDto {
  productId: number;
  productNombre: string;
  qty: number;
  imgUrl?: string | null;
}

export interface AdminOrderDetailDto {
  id: number;
  createdAt: string;
  status: OrderStatus;

  userEmail: string;

  customerNombre: string;
  customerApellido: string;
  customerTelefono?: string | null;
  customerDireccion?: string | null;

  comment?: string | null;
  items: AdminOrderItemDto[];
}

// ✅ Page wrapper (Spring Page)
export interface PageDto<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // page index
  size: number;
}

@Injectable({ providedIn: 'root' })
export class AdminOrdersApi {
  private readonly http = inject(HttpClient);

  list(params?: {
    q?: string;
    status?: string;
    from?: string; // YYYY-MM-DD
     to?: string;   // YYYY-MM-DD
    page?: number;
    size?: number;
    sort?: string; // "createdAt,desc"
  }) {
    let p = new HttpParams();

    if (params?.q) p = p.set('q', params.q);
    if (params?.status) p = p.set('status', params.status);
    if (params?.page != null) p = p.set('page', String(params.page));
    if (params?.size != null) p = p.set('size', String(params.size));
    if (params?.sort) p = p.set('sort', params.sort);

    return this.http.get<PageDto<AdminOrderSummaryDto>>('/api/admin/orders', {
      params: p,
    });
  }

  getById(id: number) {
    return this.http.get<AdminOrderDetailDto>(`/api/admin/orders/${id}`);
  }

  updateStatus(id: number, status: OrderStatus) {
  return this.http.patch<void>(`/api/admin/orders/${id}/status`, { status });
}
}
