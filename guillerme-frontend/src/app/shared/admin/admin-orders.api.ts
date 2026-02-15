import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export type OrderStatus =
  | 'NUEVO'
  | 'PENDIENTE_DE_PAGO'
  | 'PAGADO'
  | 'ENVIADO';

export interface AdminOrderSummaryDto {
  id: number;
  createdAt: string;
  status: OrderStatus;
  totalItems: number;
  customerEmail: string;
  customerNombre: string;
  customerApellido: string;
}

export interface AdminOrderItemDto {
  productId: number;
  productNombre: string;
  qty: number;
  imgUrl?: string | null;
  unitPrice: number;
}

export interface AdminOrderDetailDto {
  id: number;
  createdAt: string;
  status: OrderStatus;

  customerEmail: string;
  customerNombre: string;
  customerApellido: string;
  customerTelefono?: string | null;
  customerDireccion?: string | null;

  comment?: string | null;
  items: AdminOrderItemDto[];
}

export interface PageDto<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class AdminOrdersApi {
  private readonly http = inject(HttpClient);

  list(params?: {
    q?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
    sort?: string;
  }) {
    let p = new HttpParams();

    if (params?.q) p = p.set('q', params.q);
    if (params?.status) p = p.set('status', params.status);
    if (params?.from) p = p.set('from', params.from);
    if (params?.to) p = p.set('to', params.to);
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

  /** ✅ ENVIADO + tracking + archivo (pdf/jpg/png) */
  markShipped(
    id: number,
    payload: { tracking?: string | null; file: File }
  ) {
    const fd = new FormData();

    const tracking = (payload.tracking ?? '').trim();
    if (tracking) fd.append('tracking', tracking);

    fd.append('file', payload.file);

    return this.http.post<void>(`/api/admin/orders/${id}/shipped`, fd);
  }
}
