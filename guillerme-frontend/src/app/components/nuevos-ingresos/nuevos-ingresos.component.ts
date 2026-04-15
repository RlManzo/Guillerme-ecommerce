import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

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
  private readonly cdr = inject(ChangeDetectorRef);

  private sub?: Subscription;

  loading = true;
  error = false;
  productos: Product[] = [];

  ngOnInit(): void {
    this.loading = true;
    this.error = false;
    this.productos = [];

    this.sub = this.productsService.products$.subscribe({
      next: (all) => {
        try {
          const lista = Array.isArray(all) ? all : [];

          const activos = lista.filter((p) => (p.estado ?? true) === true);

          const ordenados = [...activos].sort(
            (a: any, b: any) => (Number(b?.id) || 0) - (Number(a?.id) || 0)
          );

          const maxItems = window.innerWidth <= 767 ? 8 : 6;
          this.productos = ordenados.slice(0, maxItems);
          this.error = false;
        } catch (e) {
          console.error('Error procesando nuevos ingresos:', e);
          this.productos = [];
          this.error = true;
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error cargando nuevos ingresos:', err);
        this.productos = [];
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  hasStock(p: Product): boolean {
    return Number(p.stock ?? 0) > 0;
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
    if (!this.hasStock(p)) {
      this.toast.error('Producto sin stock');
      return;
    }

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