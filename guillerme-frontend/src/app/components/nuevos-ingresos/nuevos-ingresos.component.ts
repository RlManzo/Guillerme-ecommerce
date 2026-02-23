// src/app/components/nuevos-ingresos/nuevos-ingresos.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class NuevosIngresosComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  readonly store = inject(ShopStore);
  private readonly toast = inject(ToastService);

  loading = true;
  error = false;
  productos: Product[] = [];

  ngOnInit(): void {
    // aseguramos que los productos estén cargados
    this.productsService.load().subscribe({
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });

    // tomamos los últimos 3 productos activos por id
    this.productsService.products$.subscribe({
      next: (all) => {
        const activos = all.filter(p => (p as any).estado ?? true);
        const ordenados = [...activos].sort(
          (a, b) => (b.id ?? 0) - (a.id ?? 0)
        );
        this.productos = ordenados.slice(0, 3);
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  // ---------- helpers de UI ----------

  getImagen(p: Product): string {
    return p.img || 'assets/img/placeholder-producto.png';
  }

  getPrecio(p: Product): string {
    return this.formatPrice(p.precio ?? 0);
  }

  // igual que en ProductosPreview
  private formatPrice(value: number | string | null | undefined): string {
    const n = typeof value === 'string' ? Number(value) : value;
    if (n == null || Number.isNaN(n)) return '';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(n);
  }

  // ---------- acciones ----------

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

  // mismo mapper que en ProductosPreview
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