import { Component, computed, signal, inject, effect, AfterViewInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { ProductsService } from './products.service';
import { filterProducts } from './search.util';
import { Product } from './product.model';

import { ShopStore, Producto } from '../../shared/store/shop.store';
import { ProductoModal } from '../producto-modal/producto-modal';
import { ToastService } from '../../shared/service/toast.service';

// ✅ estado compartido del buscador (Header -> Productos)
import { SearchStateService } from '../../shared/search-state.service';

type FilterKey = 'all' | 'libreria' | 'combos' | 'jugueteria' | 'bazar';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, NgClass, FormsModule, ProductoModal],
  templateUrl: './productos.html',
  styleUrl: './productos.scss',
})
export class Productos implements AfterViewInit{
  private readonly productsService = inject(ProductsService);
  public readonly store = inject(ShopStore);
  private readonly toast = inject(ToastService);
  private readonly searchState = inject(SearchStateService);

  // ✅ tabs
  readonly filtro = signal<FilterKey>('all');

  // ✅ query local (sincroniza con el SearchState)
  readonly q = signal<string>('');

  // ✅ paginación (fijo 10)
  readonly page = signal(0);
  readonly pageSize = signal(10);

  constructor() {
    // sync: header -> productos
    effect(() => {
      this.q.set(this.searchState.query());
      // cuando cambia el query global, vuelvo a página 1
      this.page.set(0);
    });

    // cargar productos
    this.productsService.load().subscribe();
  }

  ngAfterViewInit(): void {
    const el = document.getElementById('staticBackdrop');
    if (!el) return;

    el.addEventListener('hidden.bs.modal', () => {
      // 1) limpia el store (por si cerró con X o click afuera)
      this.store.selectProducto(null);

      // 2) limpia residuos típicos
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');

      // 3) elimina backdrops que hayan quedado colgados
      document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
    });
  }

  private readonly productsSig = toSignal(this.productsService.products$, {
  initialValue: [] as Product[],
});

  // -------------------------
  // Helpers de categoría
  // -------------------------
  private norm = (s: any) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  private hasCat(p: Product, wanted: string) {
    const w = this.norm(wanted);
    const cats = (p.categorias ?? []).map((c) => this.norm(c));
    return cats.some((c) => c.includes(w));
  }

  private readonly tabFilter: Record<FilterKey, (p: Product) => boolean> = {
    all: () => true,
    libreria: (p) => this.hasCat(p, 'libreria'),
    combos: (p) => this.hasCat(p, 'combos'),
    jugueteria: (p) => this.hasCat(p, 'jugueteria'),
    bazar: (p) => this.hasCat(p, 'bazar'),
  };

  // -------------------------
  // Filtro final (tabs + texto)
  // -------------------------
  readonly productosFiltrados = computed(() => {
    const all = this.productsSig();
    const f = this.filtro();
    const q = this.q();

    // 1) tab
    const byTab = all.filter(this.tabFilter[f]);

    // 2) texto (tu util)
    const filtered = filterProducts(byTab, q);

    // ✅ si la página quedó fuera de rango por filtrar/buscar
    const tp = Math.max(1, Math.ceil(filtered.length / this.pageSize()));
    if (this.page() > tp - 1) this.page.set(0);

    return filtered;
  });

  // -------------------------
  // Paginación (slice local)
  // -------------------------
  readonly totalPages = computed(() => {
    const total = this.productosFiltrados().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  readonly productosPaginados = computed(() => {
    const all = this.productosFiltrados();
    const start = this.page() * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });

  prevPage() {
    this.page.update((p) => Math.max(0, p - 1));
  }

  nextPage() {
    this.page.update((p) => Math.min(this.totalPages() - 1, p + 1));
  }

  // -------------------------
  // UI Actions
  // -------------------------
  setFilter(f: FilterKey) {
    this.filtro.set(f);
    this.page.set(0);
  }

  // si en algún momento tenés input de búsqueda acá también
  onSearchChange(value: string) {
    const v = value ?? '';
    this.q.set(v);
    this.searchState.setQuery(v);
    this.page.set(0);
  }

  openDetalle(p: Product) {
    this.store.selectProducto(this.toProducto(p));
  }

  add(p: Product) {
    this.store.addToCart(this.toProducto(p));
    this.toast.success('Producto agregado al carrito');
  }

  whatsappInfoLink(p: Product) {
    const phone = '543513721017';
    const text =
      `Hola LKS! Me gustaria saber mas sobre el siguiente articulo:\n\n` +
      `${p.nombre}.\n\n` +
      `Categoria:\n${(p.categorias ?? []).join(', ') || '-'}.\n\n` +
      `Servicios:\n${(p.servicios ?? []).join(', ') || '-'}.\n\n` +
      `Detalle:\n${p.infoModal ?? p.descripcionCorta ?? ''}`;

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
      text
    )}`;
  }

  private toProducto(p: Product): Producto {
  return {
    id: p.id,
    nombre: p.nombre,
    img: p.img,
    info: p.descripcionCorta ?? '',
    infoModal: p.infoModal ?? p.descripcionCorta ?? '',

    cat: /* tu lógica */ 'all',

    categoria1: (p.servicios?.[0] as any) ?? '',
    categoria2: (p.servicios?.[1] as any) ?? '',
    detalle1: p.variantes?.[0]?.label ?? '',
    detalle2: p.variantes?.[1]?.label ?? '',

    // ✅ nuevos (para modal)
    categorias: p.categorias ?? [],
    keywords: p.keywords ?? [],
    stock: p.stock ?? 0,
    precio: p.precio ?? 0,
  };
}



  formatPrice(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n == null || Number.isNaN(n)) return '';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);
}
}
