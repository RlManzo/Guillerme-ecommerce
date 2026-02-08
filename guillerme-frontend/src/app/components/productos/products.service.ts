import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, finalize, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { Product } from './product.model';
import { ProductResponseDto } from './product-response.dto';
import { mapProductFromApi } from './product.mapper';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);

  private readonly _products$ = new BehaviorSubject<Product[]>([]);
  products$ = this._products$.asObservable();

  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  loading$ = this._loading$.asObservable();

  private readonly _error$ = new BehaviorSubject<string | null>(null);
  error$ = this._error$.asObservable();

  getSnapshot(): Product[] {
    return this._products$.value;
  }

  load() {
    this._loading$.next(true);
    this._error$.next(null);

    // Si tenés proxy.conf.json, esto puede ser solo '/api/products'
    return this.http.get<ProductResponseDto[]>('/api/products').pipe(
      tap((rows) => {
        const mapped = (rows ?? []).map(mapProductFromApi);
        this._products$.next(mapped);
      }),
      catchError((err) => {
        console.error('ProductsService.load error', err);
        this._error$.next('No se pudieron cargar los productos');
        this._products$.next([]);
        return of([]);
      }),
      finalize(() => this._loading$.next(false))
    );
  }

  // si querés refrescar manualmente (misma idea que load)
  refresh() {
    return this.load();
  }
}
