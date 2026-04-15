import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, of, tap, timeout, interval, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { Product } from './product.model';
import { ProductResponseDto } from './product-response.dto';
import { mapProductFromApi } from './product.mapper';

@Injectable({ providedIn: 'root' })
export class ProductsService implements OnDestroy {
  private readonly http = inject(HttpClient);

  private readonly _products$ = new BehaviorSubject<Product[]>([]);
  readonly products$ = this._products$.asObservable();

  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading$.asObservable();

  private readonly _error$ = new BehaviorSubject<string | null>(null);
  readonly error$ = this._error$.asObservable();

  private pollingSub?: Subscription;

  load() {
    this._loading$.next(true);
    this._error$.next(null);

    return this.http.get<ProductResponseDto[]>('/api/products').pipe(
      timeout(8000),
      map((rows) => (rows ?? []).map(mapProductFromApi)),
      tap((mapped) => {
        this._products$.next(mapped);
      }),
      catchError((err) => {
        console.error('ProductsService.load error', err);
        this._error$.next('No se pudieron cargar los productos');
        this._products$.next([]);
        return of([] as Product[]);
      }),
      finalize(() => this._loading$.next(false))
    );
  }

  // 👇 NUEVO: iniciar polling
  startPolling(intervalMs = 15000) {
    if (this.pollingSub) return; // evita duplicar

    this.pollingSub = interval(intervalMs).subscribe(() => {
      this.load().subscribe();
    });

    // primera carga inmediata
    this.load().subscribe();
  }

  // 👇 opcional: detener polling
  stopPolling() {
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;
  }

  refresh() {
    return this.load();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}