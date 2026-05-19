import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  AdminProductsApi,
  CreateProductRequest,
} from '../../shared/admin/admin-products.api';
import { ToastService } from '../../shared/service/toast.service';

import { ProductsService } from '../../components/productos/products.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Product } from '../../components/productos/product.model';

type CategoriaFilter = 'ALL' | 'LIBRERIA' | 'COMBOS' | 'VARIOS';
type SortBy = 'NEWEST' | 'OLDEST' | 'AZ' | 'ZA';
type EstadoFilter = 'ACTIVOS' | 'INACTIVOS' | 'TODOS';

@Component({
  standalone: true,
  selector: 'app-admin-products-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-products.page.html',
  styleUrl: './admin-products.page.scss',
})
export class AdminProductsPage implements OnInit {
  private readonly adminApi = inject(AdminProductsApi);
  private readonly productsService = inject(ProductsService);
  private readonly toast = inject(ToastService);

  constructor() {
    effect(() => {
      const list = this.productsSig();

      console.log('TOTAL PRODUCTS SIG:', list.length);

      const cartulina = list.find((p) => p.id === 1136);
      console.log('PRODUCTO 1136 EN FRONT:', cartulina);

      console.log(
        'BUSQUEDA CARTULINA EN FRONT:',
        list
          .filter((p) => this.productText(p).includes('cartulina'))
          .map((p) => ({
            id: p.id,
            nombre: p.nombre,
            activo: (p as any).activo,
            estado: (p as any).estado,
            stock: p.stock,
            text: this.productText(p),
          }))
      );
    });
  }

  // tabs
  tab = signal<'single' | 'bulk'>('single');

  // UI
  showForm = signal(false);
  showProducts = signal(false);

  loading = signal(false);
  uploadingImg = signal(false);

  barcodeErrorCreate = signal<string | null>(null);
  barcodeErrorEdit = signal<string | null>(null);

  keywordErrorCreate = signal<string | null>(null);
  keywordErrorEdit = signal<string | null>(null);

  // Por default muestra activos
  estadoFilter = signal<EstadoFilter>('ACTIVOS');

  readonly productsSig = toSignal(this.productsService.adminProducts$, {
  initialValue: [] as Product[],
});

  productsCount = computed(() => this.productsSig().length);

  totalStock = computed(() =>
    this.productsSig().reduce((acc, p) => acc + (p.stock ?? 0), 0)
  );

  onCreateBarcodeChange(value: string) {
    this.barcodeErrorCreate.set(null);
    this.setField('barcode', value as any);
  }

  onEditBarcodeChange(value: string) {
    this.barcodeErrorEdit.set(null);
    this.setEditField('barcode', value as any);
  }

  // =========================
  // Catálogos UI
  // =========================
  readonly categoriasOpts = ['Libreria', 'combos', 'varios'] as const;

  readonly keywordsOpts = [
    'Filgo',
    'Skycolor',
    'Olami',
    'C-B-X',
    'FW',
    'Keyroad',
    'Ibicraft',
    'Wero',
    'Laprida-Exito',
    'Bic',
    'Carpel',
    'Otros',
  ] as const;

  // =========================
  // Buscador + filtros + orden + paginador
  // =========================
  q = signal<string>('');
  categoriaFilter = signal<CategoriaFilter>('ALL');
  searchInput = signal<string>('');

  applySearch() {
    this.q.set((this.searchInput() ?? '').trim());
    this.page.set(1);
  }

  clearSearch() {
    this.searchInput.set('');
    this.q.set('');
    this.categoriaFilter.set('ALL');
    this.estadoFilter.set('ACTIVOS');
    this.sortBy.set('NEWEST');
    this.page.set(1);
  }

  sortBy = signal<SortBy>('NEWEST');

  onSortChange(v: SortBy) {
    this.sortBy.set((v ?? 'NEWEST') as SortBy);
    this.page.set(1);
  }

  page = signal<number>(1);
  pageSize = signal<number>(10);

  private norm(s: any): string {
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private productCategoria(p: Product): string {
    const categorias = (p as any).categorias;

    if (Array.isArray(categorias)) {
      return this.norm(categorias.join(' '));
    }

    return this.norm(categorias ?? '');
  }

  private productKeywordsText(p: Product): string {
    const keywords = (p as any).keywords;

    if (Array.isArray(keywords)) {
      return this.norm(keywords.join(' '));
    }

    return this.norm(keywords ?? '');
  }

  private productText(p: Product): string {
    const categorias = Array.isArray((p as any).categorias)
      ? (p as any).categorias.join(' ')
      : ((p as any).categorias ?? '');

    return this.norm(
      [
        p.id,
        p.nombre,
        p.descripcionCorta,
        p.infoModal,
        this.productKeywordsText(p),
        categorias,
        (p as any).barcode ?? '',
      ].join(' ')
    );
  }

  /**
   * Búsqueda más flexible:
   * - Divide por palabras.
   * - Todas las palabras deben aparecer.
   * - Soporta singular/plural simple.
   *
   * Ej:
   * "cartulina estampada" encuentra "CARTULINA ESTAMPADAS X10".
   */
  private matchesSearch(p: Product, q: string): boolean {
    const search = this.norm(q);

    if (!search) return true;

    const text = this.productText(p);

    const terms = search
      .split(/\s+/)
      .map((x) => x.trim())
      .filter(Boolean);

    return terms.every((term) => {
      const singular = term.endsWith('s') ? term.slice(0, -1) : term;
      const plural = term.endsWith('s') ? term : `${term}s`;

      return (
        text.includes(term) ||
        text.includes(singular) ||
        text.includes(plural)
      );
    });
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
    const estado = this.estadoFilter();

    const catNorm =
      cat === 'ALL'
        ? ''
        : cat === 'LIBRERIA'
          ? 'libreria'
          : cat === 'COMBOS'
            ? 'combos'
            : cat === 'VARIOS'
              ? 'varios'
              : '';

    return all.filter((p) => {
      const okSearch = this.matchesSearch(p, q);
      const okCat = !catNorm || this.productCategoria(p).includes(catNorm);

      const isActive = this.isProductActive(p);

      const okEstado =
        estado === 'TODOS'
          ? true
          : estado === 'ACTIVOS'
            ? isActive
            : !isActive;

      return okSearch && okCat && okEstado;
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

    if (p !== this.page()) {
      this.page.set(p);
    }

    const start = (p - 1) * size;
    const end = start + size;

    return this.sortedProducts().slice(start, end);
  });

  onSearchChange(v: string) {
    this.q.set((v ?? '').trim());
    this.page.set(1);
  }

  onCategoriaChange(v: CategoriaFilter) {
    this.categoriaFilter.set((v ?? 'ALL') as CategoriaFilter);
    this.page.set(1);
  }

  goPrev() {
    this.page.set(Math.max(1, this.page() - 1));
  }

  goNext() {
    this.page.set(Math.min(this.totalPages(), this.page() + 1));
  }

  ngOnInit(): void {
    this.showProducts.set(true);
    this.showForm.set(false);
    this.productsService.loadForAdmin().subscribe();
  }

  toggleForm() {
    const next = !this.showForm();

    if (next) {
      this.showProducts.set(false);
      this.tab.set('single');
    }

    this.showForm.set(next);
  }

  toggleProducts() {
    const next = !this.showProducts();

    if (next) {
      this.showForm.set(false);
      this.productsService.refreshForAdmin().subscribe();
    }

    this.showProducts.set(next);
  }

  fileUrl(path?: string | null) {
    return path ?? '';
  }

  // -----------------------------
  // CREATE
  // -----------------------------
  form = signal<CreateProductRequest>({
    nombre: '',
    descripcionCorta: '',
    infoModal: '',
    imgUrl: '',
    imgUrl2: '',
    imgUrl3: '',
    barcode: '',
    categorias: '',
    servicios: '',
    keywords: '',
    activo: true,
    stock: 0,
    precio: 0,
  });

  setField<K extends keyof CreateProductRequest>(
    key: K,
    value: CreateProductRequest[K]
  ) {
    this.form.update((v) => ({ ...v, [key]: value }));
  }

  // =========================
  // Keyword única obligatoria
  // =========================
  private normalizeKeywordValue(input: string | null | undefined): string {
    const value = String(input ?? '')
      .split(/[,;|]/g)[0]
      ?.trim();

    return value || '';
  }

  selectedKeyword(): string {
    return this.normalizeKeywordValue(this.form().keywords);
  }

  selectKeyword(k: string) {
    this.keywordErrorCreate.set(null);
    this.setField('keywords', k as any);
  }

  selectedEditKeyword(): string {
    return this.normalizeKeywordValue(this.editRow().keywords);
  }

  selectEditKeyword(k: string) {
    this.keywordErrorEdit.set(null);
    this.setEditField('keywords', k as any);
  }

  private validateCreateKeyword(): boolean {
    const selected = this.selectedKeyword();

    if (!selected) {
      this.keywordErrorCreate.set('Tenés que seleccionar una marca.');
      this.toast.error('Tenés que seleccionar una marca');
      return false;
    }

    this.keywordErrorCreate.set(null);
    return true;
  }

  private validateEditKeyword(): boolean {
    const selected = this.selectedEditKeyword();

    if (!selected) {
      this.keywordErrorEdit.set('Tenés que seleccionar una marca.');
      this.toast.error('Tenés que seleccionar una marca');
      return false;
    }

    this.keywordErrorEdit.set(null);
    return true;
  }

  onFileSelected(evt: Event, slot: 1 | 2 | 3) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.uploadingImg.set(true);

    this.adminApi.uploadImage(file).subscribe({
      next: (res) => {
        this.uploadingImg.set(false);

        if (slot === 1) this.setField('imgUrl', res.url as any);
        if (slot === 2) this.setField('imgUrl2', res.url as any);
        if (slot === 3) this.setField('imgUrl3', res.url as any);

        this.toast.success(`Imagen ${slot} subida`);
      },
      error: () => {
        this.uploadingImg.set(false);
        this.toast.error('No se pudo subir la imagen');
      },
    });
  }

  onEditFileSelected(evt: Event, slot: 1 | 2 | 3) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.uploadingImg.set(true);

    this.adminApi.uploadImage(file).subscribe({
      next: (res) => {
        this.uploadingImg.set(false);

        if (slot === 1) this.setEditField('imgUrl', res.url as any);
        if (slot === 2) this.setEditField('imgUrl2', res.url as any);
        if (slot === 3) this.setEditField('imgUrl3', res.url as any);

        this.toast.success(`Imagen ${slot} lista (guardá para confirmar)`);
      },
      error: () => {
        this.uploadingImg.set(false);
        this.toast.error('No se pudo subir la imagen');
      },
    });
  }

  saveSingle() {
    const data = this.form();

    if (!data.nombre?.trim()) {
      this.toast.error('El nombre es obligatorio');
      return;
    }

    if ((data.stock ?? 0) < 0) {
      this.toast.error('Stock inválido');
      return;
    }

    if ((data.precio ?? 0) < 0) {
      this.toast.error('Precio inválido');
      return;
    }

    if (!this.validateCreateKeyword()) {
      return;
    }

    this.loading.set(true);

    this.adminApi
      .create({
        ...data,
        stock: Number(data.stock ?? 0),
        precio: Number(data.precio ?? 0),
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toast.success(`Creado #${res.id}`);

          this.form.set({
            nombre: '',
            descripcionCorta: '',
            infoModal: '',
            imgUrl: '',
            imgUrl2: '',
            imgUrl3: '',
            barcode: '',
            categorias: '',
            servicios: '',
            keywords: '',
            activo: true,
            stock: 0,
            precio: 0,
          });

          this.barcodeErrorCreate.set(null);
          this.keywordErrorCreate.set(null);

          this.showForm.set(false);
          this.showProducts.set(true);
          this.productsService.refreshForAdmin().subscribe();
        },
        error: (e) => {
          this.loading.set(false);
          console.error(e);

          const msg = e?.error?.message || 'No se pudo crear el producto';
          const normalizedMsg = this.normalizeText(msg);

          if (
            normalizedMsg.includes('codigo de barras') ||
            normalizedMsg.includes('barcode')
          ) {
            this.barcodeErrorCreate.set(msg);
          }

          this.toast.error(msg);
        },
      });
  }

  // -----------------------------
  // BULK
  // -----------------------------
  bulkText = signal(
    `[
  {
    "nombre": "Producto 1",
    "descripcionCorta": "Descripción corta",
    "infoModal": "Descripción larga",
    "imgUrl": "/uploads/example.jpg",
    "categorias": "Libreria",
    "servicios": "SUBLIMABLE, DTF",
    "keywords": "regalo, personalizado",
    "activo": true,
    "stock": 10,
    "precio": 0
  }
]`
  );

  saveBulk() {
    let items: CreateProductRequest[] = [];

    try {
      items = JSON.parse(this.bulkText());

      if (!Array.isArray(items)) {
        throw new Error('bulk must be array');
      }
    } catch {
      this.toast.error('JSON inválido');
      return;
    }

    if (items.length === 0) {
      this.toast.error('No hay items para cargar');
      return;
    }

    for (const it of items) {
      if (!it.nombre?.trim()) {
        this.toast.error('Hay items sin nombre');
        return;
      }

      if ((it.stock ?? 0) < 0) {
        this.toast.error('Hay items con stock inválido');
        return;
      }

      if ((it.precio ?? 0) < 0) {
        this.toast.error('Hay items con precio inválido');
        return;
      }
    }

    const normalized = items.map((it) => ({
      ...it,
      stock: Number(it.stock ?? 0),
      precio: Number(it.precio ?? 0),
    }));

    this.loading.set(true);

    this.adminApi.bulkCreate({ items: normalized }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(`Cargados ${res.ids.length} productos`);
        this.productsService.refreshForAdmin().subscribe();
      },
      error: (e) => {
        this.loading.set(false);
        console.error(e);
        this.toast.error('Falló la carga masiva');
      },
    });
  }

  // -----------------------------
  // EDIT INLINE
  // -----------------------------
  editingId = signal<number | null>(null);
  savingRow = signal(false);

  editRow = signal<CreateProductRequest>({
    nombre: '',
    descripcionCorta: '',
    infoModal: '',
    imgUrl: '',
    imgUrl2: '',
    imgUrl3: '',
    barcode: '',
    categorias: '',
    servicios: '',
    keywords: '',
    activo: true,
    stock: 0,
    precio: 0,
  });

  isEditing(id: number) {
    return this.editingId() === id;
  }

  startEdit(p: Product) {
    this.editingId.set(p.id);
    this.barcodeErrorEdit.set(null);
    this.keywordErrorEdit.set(null);

    this.editRow.set({
      nombre: p.nombre ?? '',
      descripcionCorta: p.descripcionCorta ?? '',
      infoModal: p.infoModal ?? '',
      imgUrl: p.imgUrl ?? p.img ?? '',
      imgUrl2: p.imgUrl2 ?? '',
      imgUrl3: p.imgUrl3 ?? '',
      barcode: (p as any).barcode ?? '',
      categorias: Array.isArray(p.categorias)
        ? p.categorias.join(', ')
        : ((p as any).categorias ?? ''),
      servicios: Array.isArray(p.servicios)
        ? p.servicios.join(', ')
        : ((p as any).servicios ?? ''),
      keywords: this.normalizeKeywordValue(
        Array.isArray(p.keywords) ? p.keywords.join(', ') : (p.keywords as any)
      ),
      activo: (p as any).activo ?? true,
      stock: Number(p.stock ?? 0),
      precio: Number((p as any).precio ?? 0),
    });
  }

  cancelEdit() {
    this.barcodeErrorEdit.set(null);
    this.keywordErrorEdit.set(null);
    this.editingId.set(null);
  }

  setEditField<K extends keyof CreateProductRequest>(
    key: K,
    value: CreateProductRequest[K]
  ) {
    this.editRow.update((v) => ({ ...v, [key]: value }));
  }

  saveEdit(id: number) {
    const r = this.editRow();

    if (!r.nombre?.trim()) {
      this.toast.error('El nombre es obligatorio');
      return;
    }

    if ((r.stock ?? 0) < 0 || Number.isNaN(Number(r.stock))) {
      this.toast.error('Stock inválido');
      return;
    }

    if ((r.precio ?? 0) < 0 || Number.isNaN(Number(r.precio))) {
      this.toast.error('Precio inválido');
      return;
    }

    if (!this.validateEditKeyword()) {
      return;
    }

    this.savingRow.set(true);

    this.adminApi
      .update(id, {
        ...r,
        stock: Number(r.stock ?? 0),
        precio: Number(r.precio ?? 0),
      })
      .subscribe({
        next: () => {
          this.savingRow.set(false);
          this.toast.success('Producto actualizado');
          this.editingId.set(null);
          this.productsService.refreshForAdmin().subscribe();
        },
        error: (e) => {
          console.error(e);
          this.savingRow.set(false);

          const msg = e?.error?.message || 'No se pudo actualizar';
          const normalizedMsg = this.normalizeText(msg);

          if (
            normalizedMsg.includes('codigo de barras') ||
            normalizedMsg.includes('barcode')
          ) {
            this.barcodeErrorEdit.set(msg);
          }

          this.toast.error(msg);
        },
      });
  }

  remove(id: number) {
    if (!confirm('¿Eliminar producto?')) return;

    this.adminApi.delete(id).subscribe({
      next: () => {
        this.toast.success('Producto eliminado');
        this.productsService.refreshForAdmin().subscribe();
      },
      error: (e) => {
        console.error(e);
        this.toast.error('No se pudo eliminar');
      },
    });
  }

  trackById = (_: number, p: Product) => p.id;

  toggleEdit(p: Product) {
    if (this.isEditing(p.id)) {
      this.cancelEdit();
    } else {
      this.startEdit(p);
    }
  }

  private isVideoUrl(url?: string | null): boolean {
    const u = (url ?? '').toLowerCase();

    return (
      u.endsWith('.mp4') ||
      u.endsWith('.webm') ||
      u.endsWith('.mov') ||
      u.endsWith('.m4v') ||
      u.includes('video')
    );
  }

  isVideo(url?: string | null) {
    return this.isVideoUrl(url);
  }

  private uploadMedia(file: File, onDone: (url: string) => void) {
    this.uploadingImg.set(true);

    this.adminApi.uploadImage(file).subscribe({
      next: (res) => {
        this.uploadingImg.set(false);
        onDone(res.url as any);
        this.toast.success('Archivo subido (guardá para confirmar)');
      },
      error: (err) => {
        this.uploadingImg.set(false);

        const msg =
          err?.error?.message ||
          (err?.status === 413 ? 'El archivo es demasiado grande para subirlo' : null) ||
          'No se pudo subir el archivo';

        this.toast.error(msg);
      },
    });
  }

  onMediaSelected(evt: Event, slot: 1 | 2 | 3) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const maxMb = file.type.startsWith('video/') ? 50 : 8;

    if (file.size > maxMb * 1024 * 1024) {
      this.toast.error(`El archivo supera ${maxMb}MB`);
      input.value = '';
      return;
    }

    this.uploadMedia(file, (url) => {
      if (slot === 1) this.setField('imgUrl', url as any);
      if (slot === 2) this.setField('imgUrl2', url as any);
      if (slot === 3) this.setField('imgUrl3', url as any);
    });
  }

  onEditMediaSelected(evt: Event, slot: 1 | 2 | 3) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const maxMb = file.type.startsWith('video/') ? 50 : 8;

    if (file.size > maxMb * 1024 * 1024) {
      this.toast.error(`El archivo supera ${maxMb}MB`);
      input.value = '';
      return;
    }

    this.uploadMedia(file, (url) => {
      if (slot === 1) this.setEditField('imgUrl', url as any);
      if (slot === 2) this.setEditField('imgUrl2', url as any);
      if (slot === 3) this.setEditField('imgUrl3', url as any);
    });
  }

  // El switch visual sigue leyendo estado
  isEstadoOn(p: Product): boolean {
    const v = (p as any)?.estado;

    if (v === null || v === undefined) return true;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;

    if (typeof v === 'string') {
      const value = v.toLowerCase();
      return value === '1' || value === 'true' || value === 't';
    }

    return !!v;
  }

  toggleEstado(p: Product) {
    const next = !this.isEstadoOn(p);

    this.adminApi.updateEstado(p.id, next).subscribe({
      next: () => {
        this.toast.success(`Producto ${next ? 'activado' : 'desactivado'}`);
        this.productsService.refreshForAdmin().subscribe();
      },
      error: (e) => {
        console.error(e);
        this.toast.error('No se pudo cambiar el estado');
      },
    });
  }

  private normalizeText(value: string): string {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // El filtro Activos/Inactivos/Todos usa activo
  private isProductActive(p: Product): boolean {
  const estado = (p as any)?.estado;

  if (estado === null || estado === undefined) return false;
  if (typeof estado === 'boolean') return estado;
  if (typeof estado === 'number') return estado === 1;

  if (typeof estado === 'string') {
    const value = estado.toLowerCase();
    return value === 'true' || value === '1' || value === 't';
  }

  return !!estado;
}
}