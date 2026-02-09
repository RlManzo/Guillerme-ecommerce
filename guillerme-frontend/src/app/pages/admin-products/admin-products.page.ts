import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
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

  // tabs
  tab = signal<'single' | 'bulk'>('single');

  // UI
  showForm = signal(false);
  showProducts = signal(false);

  loading = signal(false);
  uploadingImg = signal(false);

  // ✅ OJO: NO private, así el HTML puede usar productsSig()
  readonly productsSig = toSignal(this.productsService.products$, {
    initialValue: [] as Product[],
  });

  productsCount = computed(() => this.productsSig().length);

  totalStock = computed(() =>
    this.productsSig().reduce((acc, p) => acc + (p.stock ?? 0), 0)
  );

  // =========================
  // Catálogos UI (alta simple)
  // =========================
  readonly categoriasOpts = ['Libreria', 'combos', 'varios'] as const;

  // ✅ Lista de keywords disponibles (editá cuando quieras)
  readonly keywordsOpts = [
    'taza',
    'regalo',
    'cumpleaños',
    'escolar',
    'libreria',
    'juguete',
    'bazar',
    'promo',
    'combo',
    'personalizado',
  ] as const;

  // =========================
  // ✅ Buscador + filtro + paginador (para la tabla)
  // =========================
  q = signal<string>('');
  categoriaFilter = signal<CategoriaFilter>('ALL');

  page = signal<number>(1);
  pageSize = signal<number>(10);

  // Helpers de texto para filtrar
  private norm(s: any): string {
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private productCategoria(p: Product): string {
    // tu FE: p.categorias es string[]
    const cat = (p.categorias?.[0] ?? '').toString();
    return this.norm(cat);
  }

  private productKeywordsText(p: Product): string {
    return this.norm((p.keywords ?? []).join(' '));
  }

  private productText(p: Product): string {
    return this.norm(
      [
        p.nombre,
        p.descripcionCorta,
        p.infoModal,
        this.productKeywordsText(p),
        (p.categorias ?? []).join(' '),
      ].join(' ')
    );
  }

  // Lista filtrada (search + categoria)
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
            : cat === 'VARIOS'
              ? 'varios'
              : 'libreria';

    return all.filter((p) => {
      const okSearch = !q || this.productText(p).includes(q);
      const okCat = !catNorm || this.productCategoria(p).includes(catNorm);
      return okSearch && okCat;
    });
  });

  // total filtrado
  totalFiltered = computed(() => this.filteredProducts().length);

  // total de páginas
  totalPages = computed(() => {
    const total = this.totalFiltered();
    const size = Math.max(1, Number(this.pageSize() || 10));
    return Math.max(1, Math.ceil(total / size));
  });

  // página actual recortada
  readonly pagedProducts = computed(() => {
    const size = Math.max(1, Number(this.pageSize() || 10));
    const pages = this.totalPages();

    // clamp page
    let p = Number(this.page() || 1);
    if (p < 1) p = 1;
    if (p > pages) p = pages;

    // si cambiamos por clamp, actualizamos el signal (sin romper)
    if (p !== this.page()) this.page.set(p);

    const start = (p - 1) * size;
    const end = start + size;

    return this.filteredProducts().slice(start, end);
  });

  onSearchChange(v: string) {
    this.q.set(v ?? '');
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
  this.productsService.load().subscribe();
}

  toggleForm() {
  const next = !this.showForm();

  // si voy a mostrar el form, oculto la grilla
  if (next) {
    this.showProducts.set(false);
    this.tab.set('single');
  }

  this.showForm.set(next);
}


  toggleProducts() {
  const next = !this.showProducts();

  // si voy a mostrar productos, oculto el form
  if (next) {
    this.showForm.set(false);
    // opcional: si querés asegurarte que no quede en bulk
    // this.tab.set('single');
    this.productsService.refresh().subscribe();
  }

  this.showProducts.set(next);
}

  /**
   * Si tenés proxy para /uploads, podés dejarlo así (return path).
   * Si no, prefijá con baseUrl del backend.
   */
  fileUrl(path?: string | null) {
  return path ?? '';
}


  // -----------------------------
  // CREATE (alta simple) DTO real + precio
  // -----------------------------
  form = signal<CreateProductRequest>({
    nombre: '',
    descripcionCorta: '',
    infoModal: '',
    imgUrl: '',
    imgUrl2: '',
    imgUrl3: '',
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
  // Keywords (multi-select) -> CSV string en form.keywords
  // =========================
  private parseCsv(input: string | null | undefined): string[] {
    if (!input) return [];
    return String(input)
      .split(/[,;|]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private toCsv(arr: string[]): string {
    return arr.map((s) => s.trim()).filter(Boolean).join(', ');
  }

  selectedKeywords(): string[] {
    return this.parseCsv(this.form().keywords);
  }

  toggleKeyword(k: string, checked: boolean) {
    const current = this.selectedKeywords();

    let next = current;
    if (checked) {
      if (!current.includes(k)) next = [...current, k];
    } else {
      next = current.filter((x) => x !== k);
    }

    if (next.length > 4) {
      this.toast.error('Podés elegir hasta 4 palabras clave');
      return;
    }

    this.setField('keywords', this.toCsv(next) as any);
  }

  onFileSelected(evt: Event, slot: 1|2|3) {
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
    }
  });
}

onEditFileSelected(evt: Event, slot: 1|2|3) {
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
    }
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
              categorias: '',
              servicios: '',
              keywords: '',
              activo: true,
              stock: 0,
              precio: 0,
            });


          this.showForm.set(false);
          this.productsService.refresh().subscribe();
          this.toggleProducts();
        },
        error: (e) => {
          this.loading.set(false);
          console.error(e);
          this.toast.error('No se pudo crear el producto');
        },
      });
  }

  // -----------------------------
  // BULK (DTO real + precio)  (si dejaste la sección bulk comentada en HTML, igual no molesta)
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
      if (!Array.isArray(items)) throw new Error('bulk must be array');
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
        this.productsService.refresh().subscribe();
      },
      error: (e) => {
        this.loading.set(false);
        console.error(e);
        this.toast.error('Falló la carga masiva');
      },
    });
  }

  // -----------------------------
  // EDIT INLINE (tabla) + precio
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

    this.editRow.set({
      nombre: p.nombre ?? '',
      descripcionCorta: p.descripcionCorta ?? '',
      infoModal: p.infoModal ?? '',
        imgUrl: p.imgUrl ?? p.img ?? '',
        imgUrl2: p.imgUrl2 ?? '',
        imgUrl3: p.imgUrl3 ?? '',

      categorias: (p.categorias ?? []).join(', '),
      servicios: (p.servicios ?? []).join(', '),
      keywords: (p.keywords ?? []).join(', '),

      activo: (p as any).activo ?? true,
      stock: Number(p.stock ?? 0),
      precio: Number((p as any).precio ?? 0),
    });
  }

  cancelEdit() {
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
          this.productsService.refresh().subscribe();
        },
        error: (e) => {
          console.error(e);
          this.savingRow.set(false);
          this.toast.error('No se pudo actualizar');
        },
      });
  }

  remove(id: number) {
    if (!confirm('¿Eliminar producto?')) return;

    this.adminApi.delete(id).subscribe({
      next: () => {
        this.toast.success('Producto eliminado');
        this.productsService.refresh().subscribe();
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

// para usar desde el HTML
isVideo(url?: string | null) {
  return this.isVideoUrl(url);
}

private uploadMedia(file: File, onDone: (url: string) => void) {
  // reusamos el mismo endpoint; backend lo hará "media"
  this.uploadingImg.set(true);
  this.adminApi.uploadImage(file).subscribe({
    next: (res) => {
      this.uploadingImg.set(false);
      onDone(res.url as any);
      this.toast.success('Archivo subido (guardá para confirmar)');
    },
    error: () => {
      this.uploadingImg.set(false);
      this.toast.error('No se pudo subir el archivo');
    }
  });
}

onMediaSelected(evt: Event, slot: 1|2|3) {
  const input = evt.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // opcional: límite distinto para video
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

onEditMediaSelected(evt: Event, slot: 1|2|3) {
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


}
