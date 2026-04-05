import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { ProductsService } from '../../components/productos/products.service';
import { Product } from '../../components/productos/product.model';

type CategoriaFilter = 'ALL' | 'LIBRERIA' | 'COMBOS' | 'VARIOS';
type SortBy = 'NEWEST' | 'OLDEST' | 'AZ' | 'ZA';

@Component({
  standalone: true,
  selector: 'app-admin-stock-lookup',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-stock-lookup.component.html',
  styleUrl: './admin-stock-lookup.component.scss',
})
export class AdminStockLookupComponent implements OnInit {
  private readonly productsService = inject(ProductsService);

  readonly productsSig = toSignal(this.productsService.products$, {
    initialValue: [] as Product[],
  });

  loading = signal(false);

  searchInput = signal('');
  q = signal('');
  categoriaFilter = signal<CategoriaFilter>('ALL');
  sortBy = signal<SortBy>('NEWEST');

  page = signal<number>(1);
  pageSize = signal<number>(10);

  productsCount = computed(() => this.productsSig().length);

  totalStock = computed(() =>
    this.productsSig().reduce((acc, p) => acc + Number(p.stock ?? 0), 0)
  );

  ngOnInit(): void {
    this.loading.set(true);
    this.productsService.load().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  applySearch() {
    this.q.set(this.searchInput() ?? '');
    this.page.set(1);
  }

  clearSearch() {
    this.searchInput.set('');
    this.q.set('');
    this.categoriaFilter.set('ALL');
    this.sortBy.set('NEWEST');
    this.page.set(1);
  }

  onCategoriaChange(v: CategoriaFilter) {
    this.categoriaFilter.set((v ?? 'ALL') as CategoriaFilter);
    this.page.set(1);
  }

  onSortChange(v: SortBy) {
    this.sortBy.set((v ?? 'NEWEST') as SortBy);
    this.page.set(1);
  }

  goPrev() {
    this.page.set(Math.max(1, this.page() - 1));
  }

  goNext() {
    this.page.set(Math.min(this.totalPages(), this.page() + 1));
  }

  fileUrl(path?: string | null) {
    return path ?? '';
  }

  trackById = (_: number, p: Product) => p.id;

  private norm(s: unknown): string {
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private productCategoria(p: Product): string {
    const cat = Array.isArray(p.categorias)
      ? (p.categorias[0] ?? '')
      : (p as any).categorias ?? '';
    return this.norm(cat);
  }

  private productKeywordsText(p: Product): string {
    const kws = Array.isArray(p.keywords)
      ? p.keywords.join(' ')
      : (p as any).keywords ?? '';
    return this.norm(kws);
  }

  private productText(p: Product): string {
    const categorias = Array.isArray(p.categorias)
      ? p.categorias.join(' ')
      : (p as any).categorias ?? '';

    return this.norm(
      [
        p.nombre,
        p.descripcionCorta,
        p.infoModal,
        this.productKeywordsText(p),
        categorias,
        p.barcode ?? '',
      ].join(' ')
    );
  }

  private getTimeOrId(p: any): number {
    const t =
      p?.createdAt ? new Date(p.createdAt).getTime()
      : p?.created_at ? new Date(p.created_at).getTime()
      : 0;

    if (Number.isFinite(t) && t > 0) return t;
    return Number(p?.id ?? 0);
  }

  private compareNombre(a: Product, b: Product): number {
    const an = this.norm(a?.nombre ?? '');
    const bn = this.norm(b?.nombre ?? '');
    return an.localeCompare(bn);
  }

  readonly filteredProducts = computed(() => {
    const all = this.productsSig();
    const q = this.norm(this.q());
    const cat = this.categoriaFilter();

    const catNorm =
      cat === 'ALL'
        ? ''
        : cat === 'LIBRERIA'
          ? 'libreria'
          : cat === 'COMBOS'
            ? 'combos'
            : 'varios';

    return all.filter((p) => {
      const okSearch = !q || this.productText(p).includes(q);
      const okCat = !catNorm || this.productCategoria(p).includes(catNorm);
      return okSearch && okCat;
    });
  });

  readonly sortedProducts = computed(() => {
    const list = [...this.filteredProducts()];
    const mode = this.sortBy();

    switch (mode) {
      case 'AZ':
        list.sort((a, b) => this.compareNombre(a, b));
        break;
      case 'ZA':
        list.sort((a, b) => this.compareNombre(b, a));
        break;
      case 'OLDEST':
        list.sort((a: any, b: any) => this.getTimeOrId(a) - this.getTimeOrId(b));
        break;
      case 'NEWEST':
      default:
        list.sort((a: any, b: any) => this.getTimeOrId(b) - this.getTimeOrId(a));
        break;
    }

    return list;
  });

  totalFiltered = computed(() => this.sortedProducts().length);

  totalPages = computed(() => {
    const total = this.totalFiltered();
    const size = Math.max(1, Number(this.pageSize() || 10));
    return Math.max(1, Math.ceil(total / size));
  });

  readonly pagedProducts = computed(() => {
    const size = Math.max(1, Number(this.pageSize() || 10));
    const pages = this.totalPages();

    let p = Number(this.page() || 1);
    if (p < 1) p = 1;
    if (p > pages) p = pages;
    if (p !== this.page()) this.page.set(p);

    const start = (p - 1) * size;
    const end = start + size;

    return this.sortedProducts().slice(start, end);
  });
}