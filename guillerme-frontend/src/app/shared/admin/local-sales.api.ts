import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface CreateLocalSaleRequest {
  items: Array<{
    productId: number;
    qty: number;
  }>;
  comment?: string | null;
  customerName?: string | null;
}

export interface UpdateLocalSaleRequest {
  items: Array<{
    productId: number;
    qty: number;
  }>;
  comment?: string | null;
  customerName?: string | null;
}

export interface CreateLocalSaleResponse {
  saleId: number;
}

export interface LocalSaleSummaryDto {
  id: number;
  createdAt: string;
  createdByEmail?: string | null;
  customerName?: string | null;
  totalItems: number;
  totalAmount: number;
  comment?: string | null;
  status: 'ABIERTA' | 'FINALIZADA' | 'ANULADA';
}

export interface LocalSaleItemDto {
  productId: number;
  productNombre: string;
  barcode?: string | null;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface LocalSaleDetailDto {
  id: number;
  createdAt: string;
  createdByEmail?: string | null;
  customerName?: string | null;
  totalItems: number;
  totalAmount: number;
  comment?: string | null;
  status: 'ABIERTA' | 'FINALIZADA' | 'ANULADA';
  items: LocalSaleItemDto[];
}

export interface PageDto<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class LocalSalesApi {
  private readonly http = inject(HttpClient);

  create(body: CreateLocalSaleRequest) {
    return this.http.post<CreateLocalSaleResponse>('/api/admin/local-sales', body);
  }

  update(id: number, body: UpdateLocalSaleRequest) {
    return this.http.put<CreateLocalSaleResponse>(`/api/admin/local-sales/${id}`, body);
  }

  cancel(id: number) {
    return this.http.patch<void>(`/api/admin/local-sales/${id}/cancel`, {});
  }

  reopen(id: number) {
    return this.http.patch<void>(`/api/admin/local-sales/${id}/reopen`, {});
  }

  list(params?: {
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string;
}) {
  let p = new HttpParams();

  if (params?.q) p = p.set('q', params.q);
  if (params?.from) p = p.set('from', params.from);
  if (params?.to) p = p.set('to', params.to);
  if (params?.page != null) p = p.set('page', String(params.page));
  if (params?.size != null) p = p.set('size', String(params.size));
  if (params?.sort) p = p.set('sort', params.sort);

  return this.http.get<PageDto<LocalSaleSummaryDto>>('/api/admin/local-sales', {
    params: p,
  });
}

  getById(id: number) {
    return this.http.get<LocalSaleDetailDto>(`/api/admin/local-sales/${id}`);
  }

  close(id: number) {
  return this.http.patch<void>(`/api/admin/local-sales/${id}/close`, {});
}
}