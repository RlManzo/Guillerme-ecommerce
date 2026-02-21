import { CommonModule } from '@angular/common';
import { Component, inject, HostListener, ElementRef, ViewChild, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ProductsService } from '../productos/products.service';
import { Product } from '../productos/product.model';
import { filterProducts } from '../productos/search.util';
import { ShopStore, Producto } from '../../shared/store/shop.store';

declare const bootstrap: any;

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

  @ViewChild('qInput') qInput?: ElementRef<HTMLInputElement>;

  query = '';
  resultsOpen = false;

  // ✅ modo navbar mobile
  readonly searchOpen = signal(false);

  // simple: por ancho de pantalla
  readonly isMobile = computed(() => window.innerWidth <= 768);

  private readonly productsSig = toSignal(this.productsService.products$, {
    initialValue: [] as Product[],
  });

  filteredProducts: Product[] = [];

  toggleSearch(ev?: MouseEvent) {
    ev?.preventDefault();
    ev?.stopPropagation();

    // si está abierto y está vacío, lo cierro
    if (this.searchOpen() && !this.query.trim()) {
      this.closeAll();
      return;
    }

    this.searchOpen.set(true);

    // foco al input
    setTimeout(() => this.qInput?.nativeElement?.focus(), 0);

    // si ya había texto, reabrimos resultados
    if (this.query.trim()) this.resultsOpen = true;
  }

  closeAll() {
    this.searchOpen.set(false);
    this.resultsOpen = false;
    this.query = '';
    this.filteredProducts = [];
  }

  onInput(ev: Event) {
    const value = (ev.target as HTMLInputElement).value ?? '';
    this.query = value;

    const q = value.trim();
    if (!q) {
      this.filteredProducts = [];
      this.resultsOpen = false;
      return;
    }

    this.resultsOpen = true;
    this.filteredProducts = filterProducts(this.productsSig(), q).slice(0, 10);
  }

  openResults() {
  // solo abrimos si hay texto
  this.resultsOpen = this.query.trim().length > 0;

  // SOLO ajustamos overlay en mobile
  if (window.innerWidth <= 768) {
    const inputEl = this.qInput?.nativeElement;
    if (!inputEl) return;

    const r = inputEl.getBoundingClientRect();
    const top = Math.round(r.bottom + 8); // 8px de separación

    // este var(--search-top) lo usa el CSS mobile del overlay
    document.documentElement.style.setProperty('--search-top', `${top}px`);
  }
}


  openProduct(p: Product) {
    this.store.selectProducto(this.toProducto(p));

    // cerrar buscador
    this.resultsOpen = false;
    this.searchOpen.set(false);
    this.query = '';
    this.filteredProducts = [];

    const el = document.getElementById('staticBackdrop');
    if (el) bootstrap.Modal.getOrCreateInstance(el).show();
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
      precio: (p as any).precio ?? 0,
      stock: (p as any).stock ?? 0,
    } as unknown as Producto;
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

  @HostListener('window:resize')
  onResize() {
    // si vuelve a desktop, dejamos input visible
    if (window.innerWidth > 768) this.searchOpen.set(true);
    // si va a mobile, lo cerramos si no hay query
    if (window.innerWidth <= 768 && !this.query.trim()) this.searchOpen.set(false);
  }

  @HostListener('document:click')
    onDocClick() {
      // 🔵 En mobile NO se cierra al tocar fuera
      if (window.innerWidth <= 768) return;

      // 🔵 En desktop sí
      this.resultsOpen = false;
    }

  readonly mobileSearchOpen = signal(false);

  closeResults() {
  this.resultsOpen = false;

  // si estás usando signal para mobile
  if (typeof this.mobileSearchOpen === 'function') {
    this.mobileSearchOpen.set?.(false);
  }

  // opcional: limpiar búsqueda
  // this.query = '';
  // this.filteredProducts = [];
}

toggleResults() {
  if (this.resultsOpen) {
    this.closeResults();
  } else {
    this.openResults();
  }
}
}
