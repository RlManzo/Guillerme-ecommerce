import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type CreateProductRequest = {
  nombre: string;
  descripcionCorta?: string | null;
  infoModal?: string | null;
  imgUrl?: string | null;

  categorias?: string | null;
  servicios?: string | null;
  keywords?: string | null;

  activo?: boolean | null;
  stock: number;
  precio: number;
};

export type ProductResponse = {
  id: number;
  nombre: string;
  descripcionCorta?: string | null;
  infoModal?: string | null;
  imgUrl?: string | null;
  categorias?: string | null;
  servicios?: string | null;
  keywords?: string | null;
  activo: boolean;
  stock: number;
  precio: number;
};

export type BulkProductCreateRequest = { items: CreateProductRequest[] };
export type BulkProductCreateResponse = { ids: number[] };

@Injectable({ providedIn: 'root' })
export class AdminProductsApi {
  constructor(private readonly http: HttpClient) {}

  create(body: CreateProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>('/api/admin/products', body);
  }

  bulkCreate(body: BulkProductCreateRequest): Observable<BulkProductCreateResponse> {
    return this.http.post<BulkProductCreateResponse>('/api/admin/products/bulk', body);
  }

  update(id: number, body: CreateProductRequest): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`/api/admin/products/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/products/${id}`);
  }

  uploadImage(file: File): Observable<{ url: string; filename: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ url: string; filename: string }>(
      '/api/admin/products/image',
      fd
    );
  }
}
