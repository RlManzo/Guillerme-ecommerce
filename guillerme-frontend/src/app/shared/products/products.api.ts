import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ProductResponse = {
  id: number;
  nombre: string;
  img?: string | null;
  info?: string | null;
  infoModal?: string | null;
  cat?: string | null;
  categoria1?: string | null;
  categoria2?: string | null;
  detalle1?: string | null;
  detalle2?: string | null;
  stock: number;
};

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>('/api/products');
  }
}
