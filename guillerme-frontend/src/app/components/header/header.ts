import { CommonModule } from '@angular/common';
import { Component, inject, HostListener } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ProductsService } from '../productos/products.service'; // <-- ajustá path
import { Product } from '../productos/product.model'; // <-- ajustá path
import { filterProducts } from '../productos/search.util'; // <-- ajustá path

import { ShopStore, Producto } from '../../shared/store/shop.store'; // <-- ajustá path

declare const bootstrap: any; // para abrir el modal (Bootstrap JS)

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly productsService = inject(ProductsService);
  private readonly store = inject(ShopStore);

  query = '';
  resultsOpen = false;

  private readonly productsSig = toSignal(this.productsService.products$, {
    initialValue: [] as Product[],
  });

  filteredProducts: Product[] = [];

  onInput(ev: Event) {
    const value = (ev.target as HTMLInputElement).value ?? '';
    this.query = value;
    this.resultsOpen = true;

    const q = value.trim();
    if (!q) {
      this.filteredProducts = [];
      return;
    }

    // 🔎 buscar en productos reales
    this.filteredProducts = filterProducts(this.productsSig(), q).slice(0, 10);
  }

  openResults() {
  this.resultsOpen = this.query.trim().length > 0;
}

  closeResults() {
    this.resultsOpen = false;
  }

  openProduct(p: Product) {
    // 1) setear el producto para que el modal lo lea
    this.store.selectProducto(this.toProducto(p));

    // 2) cerrar buscador
    this.closeResults();
    this.query = '';
    this.filteredProducts = [];

    // 3) abrir modal bootstrap
    const el = document.getElementById('staticBackdrop');
    if (el) {
      const modal = bootstrap.Modal.getOrCreateInstance(el);
      modal.show();
    }
  }

  private toProducto(p: Product): Producto {
    return {
      id: p.id,
      nombre: p.nombre,
      img: p.img,
      info: p.descripcionCorta ?? '',
      infoModal: p.infoModal ?? p.descripcionCorta ?? '',
      cat: 'cat1',
      categoria1: (p.servicios?.[0] as any) ?? '',
      categoria2: (p.servicios?.[1] as any) ?? '',
      detalle1: p.variantes?.[0]?.label ?? '',
      detalle2: p.variantes?.[1]?.label ?? '',
    } as unknown as Producto;
  }

  @HostListener('document:click')
onDocClick() {
  this.closeResults();
}

formatPrice(value?: number | null): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 'Consultar';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);
}

}
