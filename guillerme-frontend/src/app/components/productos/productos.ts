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

import { SearchStateService } from '../../shared/search-state.service';

import { ProductsFilterStateService } from '../../shared/products-filter-state.service';


type FilterKey = 'all' | 'libreria' | 'combos' | 'varios';

type SortBy = 'NEWEST' | 'OLDEST' | 'AZ' | 'ZA' | 'CHEAPEST' | 'EXPENSIVE';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, NgClass, FormsModule, ProductoModal],
  templateUrl: './productos.html',
  styleUrl: './productos.scss',
})
export class Productos implements AfterViewInit {
  private readonly productsService = inject(ProductsService);
  public readonly store = inject(ShopStore);
  private readonly toast = inject(ToastService);
  private readonly searchState = inject(SearchStateService);
  private readonly productsFilterState = inject(ProductsFilterStateService);


  // ✅ tabs
  readonly filtro = signal<FilterKey>('all');

  // ✅ query local (sincroniza con el SearchState)
  readonly q = signal<string>('');

  // ✅ paginación (default 10 pero configurable desde UI)
  readonly page = signal(0);
  readonly pageSize = signal(10);

  // ✅ orden
  readonly sortBy = signal<SortBy>('NEWEST');

  // ✅ rango precio (null = sin filtro)
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);

  // UI: dropdown precio
priceOpen = false;

  constructor() {
    // sync: header -> productos
    effect(() => {
      this.q.set(this.searchState.query());
      this.page.set(0);
    });

    effect(() => {
  const cat = this.productsFilterState.category();
  this.setFilter(cat);   // 'all' | 'libreria' | 'combos' | 'varios'
  this.page.set(0);
});

    // cargar productos
    this.productsService.load().subscribe();
  }

  ngAfterViewInit(): void {
    const el = document.getElementById('staticBackdrop');
    if (!el) return;

    el.addEventListener('hidden.bs.modal', () => {
      this.store.selectProducto(null);

      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');

      document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
    });
  }

  private readonly productsSig = toSignal(this.productsService.products$, {
    initialValue: [] as Product[],
  });

  // -------------------------
  // Helpers comunes
  // -------------------------
  private norm = (s: any) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  private toNumber(v: any): number | null {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private priceOf(p: Product): number {
    const n = Number((p as any).precio ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  // ✅ si no tenés createdAt, fallback por id (id más alto = más nuevo)
  private createdKey(p: Product): number {
    const anyP = p as any;
    const dt =
      anyP.createdAt ||
      anyP.created_at ||
      anyP.fechaAlta ||
      anyP.fechaCreacion ||
      anyP.created;
    const t = dt ? new Date(dt).getTime() : NaN;
    if (Number.isFinite(t)) return t;
    return Number(anyP.id ?? 0);
  }

  private sortProducts(list: Product[], s: SortBy): Product[] {
    const arr = [...list];

    switch (s) {
      case 'NEWEST':
        return arr.sort((a, b) => this.createdKey(b) - this.createdKey(a));
      case 'OLDEST':
        return arr.sort((a, b) => this.createdKey(a) - this.createdKey(b));
      case 'AZ':
        return arr.sort((a, b) =>
          this.norm(a.nombre).localeCompare(this.norm(b.nombre))
        );
      case 'ZA':
        return arr.sort((a, b) =>
          this.norm(b.nombre).localeCompare(this.norm(a.nombre))
        );
      case 'CHEAPEST':
        return arr.sort((a, b) => this.priceOf(a) - this.priceOf(b));
      case 'EXPENSIVE':
        return arr.sort((a, b) => this.priceOf(b) - this.priceOf(a));
      default:
        return arr;
    }
  }

  // -------------------------
  // Helpers de categoría
  // -------------------------
  private getCategoriasNormalized(p: Product): string[] {
    const raw: any = (p as any).categorias;

    // array -> ok
    if (Array.isArray(raw)) {
      return raw.map((c) => this.norm(c)).filter(Boolean);
    }

    // string -> split por coma
    if (typeof raw === 'string') {
      return raw
        .split(',')
        .map((s) => this.norm(s))
        .filter(Boolean);
    }

    return [];
  }

  private hasCat(p: Product, wanted: string) {
    const w = this.norm(wanted);
    const cats = this.getCategoriasNormalized(p);
    return cats.some((c) => c === w || c.includes(w));
  }

  private readonly tabFilter: Record<FilterKey, (p: Product) => boolean> = {
    all: () => true,
    libreria: (p) => this.hasCat(p, 'libreria'),
    combos: (p) => this.hasCat(p, 'combos'),
    varios: (p) => this.hasCat(p, 'varios'),
  };

  // -------------------------
  // Filtro final (tabs + texto + rango + sort)
  // -------------------------
  readonly productosFiltrados = computed(() => {
  const all = this.productsSig();
  const f = this.filtro();
  const q = this.q();
  const s = this.sortBy();
  const minP = this.minPrice();
  const maxP = this.maxPrice();

  // ✅ 0) SOLO ACTIVOS POR ESTADO (default true si viene undefined/null)
  const activos = all.filter(p => (p.estado ?? true) === true);

  // 1) tab
  const byTab = activos.filter(this.tabFilter[f]);

  // 2) texto
  const byText = filterProducts(byTab, q);

  // 3) rango precio
  const byPrice = byText.filter((p) => {
    const price = this.priceOf(p);
    const okMin = minP == null || price >= minP;
    const okMax = maxP == null || price <= maxP;
    return okMin && okMax;
  });

  // 4) ordenar
  const sorted = this.sortProducts(byPrice, s);

  // clamp page
  const tp = Math.max(1, Math.ceil(sorted.length / this.pageSize()));
  if (this.page() > tp - 1) this.page.set(0);

  return sorted;
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

  onSearchChange(value: string) {
    const v = value ?? '';
    this.q.set(v);
    this.searchState.setQuery(v);
    this.page.set(0);
  }

  onSortChange(v: SortBy) {
    this.sortBy.set((v ?? 'NEWEST') as SortBy);
    this.page.set(0);
  }

  onMinPriceChange(v: any) {
    this.minPrice.set(this.toNumber(v));
    this.page.set(0);
  }

  onMaxPriceChange(v: any) {
    this.maxPrice.set(this.toNumber(v));
    this.page.set(0);
  }

  onPageSizeChange(v: number) {
    const n = Number(v);
    this.pageSize.set(Number.isFinite(n) && n > 0 ? n : 10);
    this.page.set(0);
  }

  // opcional (UI)
  applyFilters() {
    // no hace nada porque ya es reactivo
  }

  clearFilters() {
    this.q.set('');
    this.searchState.setQuery('');
    this.sortBy.set('NEWEST');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.pageSize.set(10);
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

  // =========================
  // ✅ VIDEO helper (cards + modal)
  // =========================
  private isVideoUrl(url?: string | null): boolean {
    const u = (url ?? '').toLowerCase().trim();
    return (
      u.endsWith('.mp4') ||
      u.endsWith('.webm') ||
      u.endsWith('.mov') ||
      u.endsWith('.m4v') ||
      u.includes('video')
    );
  }

  // para usar desde el HTML
  isVideo(url?: string | null) {
    return this.isVideoUrl(url);
  }

  // ✅ construye lista de medias (img/video) desde tu Product del BE
  private buildMedias(p: any): string[] {
    const raw = [
      ...(Array.isArray(p?.imagenes) ? p.imagenes : []), // si ya viene armado
      p?.imgUrl,
      p?.imgUrl2,
      p?.imgUrl3,
      p?.img, // fallback legacy
    ]
      .map((x: any) => String(x ?? '').trim())
      .filter(Boolean);

    // unique + preserva orden
    return Array.from(new Set(raw));
  }

  private toProducto(p: Product): Producto {
    const medias = this.buildMedias(p as any);
    const principal = medias[0] ?? (p.img ?? '');

    return {
      id: p.id,
      nombre: p.nombre,

      // ✅ para la card y para compatibilidad vieja
      img: principal,

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

      // ✅ CLAVE: modal va a mostrar img o video según url
      imagenes: medias.length ? medias : [principal].filter(Boolean),
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
