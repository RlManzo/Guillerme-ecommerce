import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { ProductsService } from '../productos/products.service';
import { Product } from '../productos/product.model';
import { ShopStore, Producto } from '../../shared/store/shop.store';
import { ToastService } from '../../shared/service/toast.service';

declare const bootstrap: any;

@Component({
  selector: 'app-nuevos-ingresos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nuevos-ingresos.component.html',
  styleUrls: ['./nuevos-ingresos.component.scss'],
})
export class NuevosIngresosComponent implements OnInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  readonly store = inject(ShopStore);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  loading = true;
  error = false;
  productos: Product[] = [];

  ngOnInit(): void {
    this.productsService.products$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (all) => {
          const activos = (all ?? []).filter(p => (p as any).estado ?? true);

          const ordenados = [...activos].sort(
            (a, b) => (Number(b.id) || 0) - (Number(a.id) || 0)
          );

          this.productos = ordenados.slice(0, 6);
          this.loading = false;
          this.error = false;
        },
        error: () => {
          this.error = true;
          this.loading = false;
        },
      });

    this.productsService.load()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => {
          this.error = true;
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getImagen(p: Product): string {
    return p.img || 'assets/img/placeholder-producto.png';
  }

  getPrecio(p: Product): string {
    return this.formatPrice(p.precio ?? 0);
  }

  private formatPrice(value: number | string | null | undefined): string {
    const n = typeof value === 'string' ? Number(value) : value;
    if (n == null || Number.isNaN(n)) return '';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(n);
  }

  add(p: Product) {
    this.store.addToCart(this.toProducto(p));
    this.toast.success('Producto agregado al carrito');
  }

  openDetalle(p: Product) {
    this.store.selectProducto(this.toProducto(p));

    const el = document.getElementById('staticBackdrop');
    if (el) {
      bootstrap.Modal.getOrCreateInstance(el).show();
    }
  }

  private toProducto(p: Product): Producto {
    return {
      id: p.id,
      nombre: p.nombre,
      img: p.img,
      info: p.descripcionCorta ?? '',
      infoModal: p.infoModal ?? p.descripcionCorta ?? '',
      cat: 'all',
      categoria1: (p.servicios?.[0] as any) ?? '',
      categoria2: (p.servicios?.[1] as any) ?? '',
      detalle1: p.variantes?.[0]?.label ?? '',
      detalle2: p.variantes?.[1]?.label ?? '',
      categorias: p.categorias ?? [],
      keywords: p.keywords ?? [],
      stock: p.stock ?? 0,
      precio: p.precio ?? 0,
      imagenes: [p.img].filter(Boolean) as string[],
    } as unknown as Producto;
  }
}