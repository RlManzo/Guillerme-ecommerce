import {
  AfterViewInit,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { ProductsService } from './products.service';
import { filterProducts } from './search.util';
import { Product } from './product.model';

import {
  Producto,
  ShopStore,
} from '../../shared/store/shop.store';
import { ProductoModal } from '../producto-modal/producto-modal';
import { ToastService } from '../../shared/service/toast.service';
import { SearchStateService } from '../../shared/search-state.service';

type FilterKey =
  | 'all'
  | 'libreria'
  | 'juguetes'
  | 'combos'
  | 'varios';

type SortBy =
  | 'NEWEST'
  | 'OLDEST'
  | 'AZ'
  | 'ZA'
  | 'CHEAPEST'
  | 'EXPENSIVE';

type BrandKey =
  | 'all'
  | 'Filgo'
  | 'Skycolor'
  | 'Olami'
  | 'C-B-X'
  | 'FW'
  | 'Keyroad'
  | 'Ibicraft'
  | 'Wero'
  | 'Laprida-Exito'
  | 'Bic'
  | 'Carpel'
  | 'Nupro'
  | 'Avíos'
  | 'Otros';

type MobileFilterView =
  | 'main'
  | 'search'
  | 'brand'
  | 'price';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    FormsModule,
    ProductoModal,
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.scss',
})
export class Productos implements AfterViewInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly toast = inject(ToastService);
  private readonly searchState = inject(SearchStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  public readonly store = inject(ShopStore);

  /*
   * Estado general de filtros.
   */
  readonly filtro = signal<FilterKey>('all');
  readonly q = signal<string>('');
  readonly page = signal<number>(0);
  readonly pageSize = signal<number>(10);
  readonly sortBy = signal<SortBy>('NEWEST');
  readonly brand = signal<BrandKey>('all');

  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);

  readonly mobileFiltersOpen = signal(false);
  readonly mobileFilterView = signal<MobileFilterView>('main');

  /*
   * Se mantiene por compatibilidad con el filtro anterior.
   * Con el nuevo diseño lateral ya no debería utilizarse.
   */
  priceOpen = false;

  /*
   * Catálogo completo de marcas.
   */
  readonly brands: BrandKey[] = [
    'all',
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
    'Nupro',
    'Avíos',
    'Otros',
  ];

  /*
   * Marcas que se muestran en el sidebar.
   * No incluye "all", porque se limpia con un botón separado.
   */
  readonly visibleBrands: Exclude<BrandKey, 'all'>[] = [
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
    'Nupro',
    'Avíos',
    'Otros',
  ];

  /*
   * Productos cargados desde el servicio.
   */
  private readonly productsSig = toSignal(
    this.productsService.products$,
    {
      initialValue: [] as Product[],
    }
  );

  /*
   * Título que se muestra en el lateral y en mobile.
   */
  readonly categoryTitle = computed(() => {
    switch (this.filtro()) {
      case 'libreria':
        return 'LIBRERÍA';

      case 'juguetes':
        return 'JUGUETES';

      case 'combos':
        return 'COMBOS';

      case 'varios':
        return 'VARIOS';

      case 'all':
      default:
        return 'TODOS LOS PRODUCTOS';
    }
  });

  readonly priceFilterLabel = computed(() => {
    const minimum = this.minPrice();
    const maximum = this.maxPrice();

    if (minimum === null && maximum === null) {
      return 'Sin aplicar';
    }

    const minimumLabel =
      minimum !== null
        ? this.formatPrice(minimum)
        : '$ 0';

    const maximumLabel =
      maximum !== null
        ? this.formatPrice(maximum)
        : 'Sin límite';

    return `${minimumLabel} — ${maximumLabel}`;
  });

  readonly activeFiltersCount = computed(() => {
    let count = 0;

    if (this.q().trim()) {
      count++;
    }

    if (
      this.filtro() === 'libreria' &&
      this.brand() !== 'all'
    ) {
      count++;
    }

    if (
      this.minPrice() !== null ||
      this.maxPrice() !== null
    ) {
      count++;
    }

    return count;
  });

  constructor() {
    /*
     * Sincroniza el buscador global con el buscador
     * de la pantalla de productos.
     */
    effect(() => {
      const search = this.searchState.query();

      this.q.set(search);
      this.page.set(0);
    });

    /*
     * Lee los query params disponibles al crear el componente.
     */
    this.applyRouteFilters();

    /*
     * Reacciona a cambios posteriores en:
     *
     * /productos?cat=juguetes
     * /productos?cat=libreria&brand=Filgo
     */
    this.route.queryParamMap.subscribe((params) => {
      const category = this.parseFilterKey(
        params.get('cat')
      );

      const selectedBrand = this.parseBrandKey(
        params.get('brand')
      );

      this.filtro.set(category);
      this.brand.set(
        category === 'libreria'
          ? selectedBrand
          : 'all'
      );
      this.page.set(0);
    });

    this.productsService.load().subscribe();
  }

  ngAfterViewInit(): void {
    const modalElement =
      document.getElementById('staticBackdrop');

    if (!modalElement) {
      return;
    }

    modalElement.addEventListener(
      'hidden.bs.modal',
      () => {
        this.store.selectProducto(null);

        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty(
          'padding-right'
        );

        document
          .querySelectorAll('.modal-backdrop')
          .forEach((backdrop) => backdrop.remove());
      }
    );
  }

  ngOnDestroy(): void {
    document.body.style.removeProperty('overflow');
  }

  // =========================================================
  // QUERY PARAMS
  // =========================================================

  private applyRouteFilters(): void {
    const params =
      this.route.snapshot.queryParamMap;

    const category = this.parseFilterKey(
      params.get('cat')
    );

    const selectedBrand = this.parseBrandKey(
      params.get('brand')
    );

    this.filtro.set(category);
    this.brand.set(
      category === 'libreria'
        ? selectedBrand
        : 'all'
    );
    this.page.set(0);
  }

  private parseFilterKey(
    value: string | null
  ): FilterKey {
    const normalized = this.norm(value);

    if (normalized === 'libreria') {
      return 'libreria';
    }

    if (normalized === 'juguetes') {
      return 'juguetes';
    }

    if (normalized === 'combos') {
      return 'combos';
    }

    if (normalized === 'varios') {
      return 'varios';
    }

    return 'all';
  }

  private parseBrandKey(
    value: string | null
  ): BrandKey {
    const match = this.brands.find(
      (availableBrand) =>
        this.norm(availableBrand) ===
        this.norm(value)
    );

    return match ?? 'all';
  }

  /*
   * La marca se conserva en cualquier categoría.
   *
   * Ejemplos:
   *
   * /productos?cat=libreria&brand=Filgo
   * /productos?cat=juguetes&brand=Nupro
   */
  private updateRouteFilters(
    category: FilterKey,
    selectedBrand: BrandKey
  ): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        cat:
          category !== 'all'
            ? category
            : null,

        brand:
          category === 'libreria' &&
          selectedBrand !== 'all'
            ? selectedBrand
            : null,
      },
      queryParamsHandling: '',
      replaceUrl: true,
    });
  }

  // =========================================================
  // HELPERS GENERALES
  // =========================================================

  private norm(value: unknown): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private toNumber(value: unknown): number | null {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }

    const numberValue = Number(value);

    return Number.isFinite(numberValue)
      ? numberValue
      : null;
  }

  private priceOf(product: Product): number {
    const value = Number(
      (product as any).precio ?? 0
    );

    return Number.isFinite(value)
      ? value
      : 0;
  }

  private createdKey(product: Product): number {
    const source = product as any;

    const dateValue =
      source.createdAt ||
      source.created_at ||
      source.fechaAlta ||
      source.fechaCreacion ||
      source.created;

    const timestamp = dateValue
      ? new Date(dateValue).getTime()
      : Number.NaN;

    if (Number.isFinite(timestamp)) {
      return timestamp;
    }

    return Number(source.id ?? 0);
  }

  private sortProducts(
    products: Product[],
    sort: SortBy
  ): Product[] {
    const result = [...products];

    switch (sort) {
      case 'NEWEST':
        return result.sort(
          (a, b) =>
            this.createdKey(b) -
            this.createdKey(a)
        );

      case 'OLDEST':
        return result.sort(
          (a, b) =>
            this.createdKey(a) -
            this.createdKey(b)
        );

      case 'AZ':
        return result.sort((a, b) =>
          this.norm(a.nombre).localeCompare(
            this.norm(b.nombre)
          )
        );

      case 'ZA':
        return result.sort((a, b) =>
          this.norm(b.nombre).localeCompare(
            this.norm(a.nombre)
          )
        );

      case 'CHEAPEST':
        return result.sort(
          (a, b) =>
            this.priceOf(a) -
            this.priceOf(b)
        );

      case 'EXPENSIVE':
        return result.sort(
          (a, b) =>
            this.priceOf(b) -
            this.priceOf(a)
        );

      default:
        return result;
    }
  }

  // =========================================================
  // CATEGORÍAS Y MARCAS
  // =========================================================

  private getCategoriasNormalized(
    product: Product
  ): string[] {
    const raw = (product as any).categorias;

    if (Array.isArray(raw)) {
      return raw
        .map((category) => this.norm(category))
        .filter(Boolean);
    }

    if (typeof raw === 'string') {
      return raw
        .split(',')
        .map((category) => this.norm(category))
        .filter(Boolean);
    }

    return [];
  }

  private getKeywordsNormalized(
    product: Product
  ): string[] {
    const raw = (product as any).keywords;

    if (Array.isArray(raw)) {
      return raw
        .map((keyword) => this.norm(keyword))
        .filter(Boolean);
    }

    if (typeof raw === 'string') {
      return raw
        .split(',')
        .map((keyword) => this.norm(keyword))
        .filter(Boolean);
    }

    return [];
  }

  private hasBrand(
    product: Product,
    selectedBrand: string
  ): boolean {
    const wanted = this.norm(selectedBrand);

    if (!wanted || wanted === 'all') {
      return true;
    }

    const keywords =
      this.getKeywordsNormalized(product);

    /*
     * Comparación exacta para evitar que una marca
     * coincida parcialmente con otra.
     */
    return keywords.some(
      (keyword) => keyword === wanted
    );
  }

  private hasCat(
    product: Product,
    selectedCategory: string
  ): boolean {
    const wanted =
      this.norm(selectedCategory);

    const categories =
      this.getCategoriasNormalized(product);

    return categories.some(
      (category) =>
        category === wanted ||
        category.includes(wanted)
    );
  }

  private readonly tabFilter: Record<
    FilterKey,
    (product: Product) => boolean
  > = {
    all: () => true,

    libreria: (product) =>
      this.hasCat(product, 'libreria'),

    juguetes: (product) =>
      this.hasCat(product, 'juguetes'),

    combos: (product) =>
      this.hasCat(product, 'combos'),

    varios: (product) =>
      this.hasCat(product, 'varios'),
  };

  // =========================================================
  // FILTRADO FINAL
  // =========================================================

  readonly productosFiltrados = computed(() => {
    const allProducts = this.productsSig();

    const selectedCategory = this.filtro();
    const search = this.q();
    const selectedSort = this.sortBy();
    const minimumPrice = this.minPrice();
    const maximumPrice = this.maxPrice();
    const selectedBrand = this.brand();

    /*
     * Solo muestra productos activos.
     *
     * Si estado no viene informado, conserva
     * el comportamiento anterior y lo considera activo.
     */
    const activeProducts = allProducts.filter(
      (product) =>
        (product.estado ?? true) === true
    );

    const productsByCategory =
      activeProducts.filter(
        this.tabFilter[selectedCategory]
      );

    const productsByBrand =
      productsByCategory.filter((product) =>
        this.hasBrand(
          product,
          selectedBrand
        )
      );

    const productsByText = filterProducts(
      productsByBrand,
      search
    );

    const productsByPrice =
      productsByText.filter((product) => {
        const price = this.priceOf(product);

        const validMinimum =
          minimumPrice === null ||
          price >= minimumPrice;

        const validMaximum =
          maximumPrice === null ||
          price <= maximumPrice;

        return validMinimum && validMaximum;
      });

    const sortedProducts = this.sortProducts(
      productsByPrice,
      selectedSort
    );

    const totalPages = Math.max(
      1,
      Math.ceil(
        sortedProducts.length /
        this.pageSize()
      )
    );

    /*
     * Si un filtro reduce la cantidad de páginas,
     * vuelve automáticamente a la primera.
     */
    if (this.page() > totalPages - 1) {
      this.page.set(0);
    }

    return sortedProducts;
  });

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  readonly totalPages = computed(() => {
    const total =
      this.productosFiltrados().length;

    return Math.max(
      1,
      Math.ceil(total / this.pageSize())
    );
  });

  readonly productosPaginados = computed(() => {
    const products =
      this.productosFiltrados();

    const start =
      this.page() * this.pageSize();

    const end =
      start + this.pageSize();

    return products.slice(start, end);
  });

  prevPage(): void {
    this.page.update((currentPage) =>
      Math.max(0, currentPage - 1)
    );

    this.scrollToProducts();
  }

  nextPage(): void {
    this.page.update((currentPage) =>
      Math.min(
        this.totalPages() - 1,
        currentPage + 1
      )
    );

    this.scrollToProducts();
  }

  private scrollToProducts(): void {
    window.setTimeout(() => {
      document
        .getElementById('contenedorProductos')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
    });
  }

  // =========================================================
  // ACCIONES DE FILTROS
  // =========================================================

  /*
   * Se conserva porque puede utilizarse desde:
   *
   * - breadcrumb;
   * - botones antiguos;
   * - navegación interna.
   */
  setFilter(category: FilterKey): void {
    this.filtro.set(category);
    this.page.set(0);

    if (category !== 'libreria') {
      this.brand.set('all');
      this.updateRouteFilters(category, 'all');
    } else {
      this.updateRouteFilters(
        category,
        this.brand()
      );
    }

    this.closeMobileFilters();
  }

  onSearchChange(value: string): void {
    const search = value ?? '';

    this.q.set(search);
    this.searchState.setQuery(search);
    this.page.set(0);
  }

  onSortChange(value: SortBy): void {
    this.sortBy.set(
      (value ?? 'NEWEST') as SortBy
    );

    this.page.set(0);
  }

  /*
   * Ahora seleccionar una marca no fuerza
   * automáticamente la categoría Librería.
   */
  onBrandChange(value: BrandKey): void {
    const selectedBrand =
      this.filtro() === 'libreria'
        ? ((value ?? 'all') as BrandKey)
        : 'all';

    this.brand.set(selectedBrand);
    this.page.set(0);

    this.updateRouteFilters(
      this.filtro(),
      selectedBrand
    );
  }

  /*
   * Permite utilizar checkboxes con selección única.
   *
   * Si se vuelve a tocar la marca activa,
   * se desmarca y vuelve a "all".
   */
  selectBrandFromSidebar(
    value: BrandKey
  ): void {
    const selectedBrand =
      this.brand() === value &&
      value !== 'all'
        ? 'all'
        : value;

    this.onBrandChange(selectedBrand);
  }

  onMinPriceChange(value: unknown): void {
    const parsedValue =
      this.toNumber(value);

    this.minPrice.set(
      parsedValue !== null &&
      parsedValue >= 0
        ? parsedValue
        : null
    );

    this.page.set(0);
  }

  onMaxPriceChange(value: unknown): void {
    const parsedValue =
      this.toNumber(value);

    this.maxPrice.set(
      parsedValue !== null &&
      parsedValue >= 0
        ? parsedValue
        : null
    );

    this.page.set(0);
  }

  clearPriceFilter(): void {
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.page.set(0);
  }

  onPageSizeChange(value: number): void {
    const pageSize = Number(value);

    this.pageSize.set(
      Number.isFinite(pageSize) &&
      pageSize > 0
        ? pageSize
        : 10
    );

    this.page.set(0);
  }

  /*
   * Los filtros son reactivos.
   * Se conserva el método por compatibilidad
   * con botones existentes.
   */
  applyFilters(): void {
    this.page.set(0);
  }

  /*
   * Limpia búsqueda, marca, precio y orden,
   * pero conserva la categoría actual.
   *
   * Si el usuario está en Juguetes, continúa
   * en /productos?cat=juguetes.
   */
  clearCatalogFilters(): void {
    this.q.set('');
    this.searchState.setQuery('');

    this.sortBy.set('NEWEST');
    this.brand.set('all');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.pageSize.set(10);
    this.page.set(0);

    this.updateRouteFilters(
      this.filtro(),
      'all'
    );
  }

  /*
   * Alias para no romper el HTML anterior.
   */
  clearFilters(): void {
    this.clearCatalogFilters();
  }

  // =========================================================
  // FILTROS MOBILE
  // =========================================================

  openMobileFilters(): void {
    this.mobileFilterView.set('main');
    this.mobileFiltersOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeMobileFilters(): void {
    this.mobileFiltersOpen.set(false);
    this.mobileFilterView.set('main');
    document.body.style.removeProperty('overflow');
  }

  openMobileFilterView(
    view: MobileFilterView
  ): void {
    if (
      view === 'brand' &&
      this.filtro() !== 'libreria'
    ) {
      return;
    }

    this.mobileFilterView.set(view);
  }

  backMobileFilters(): void {
    this.mobileFilterView.set('main');
  }

  applyMobileFilters(): void {
    this.page.set(0);
    this.closeMobileFilters();

    window.setTimeout(() => {
      document
        .getElementById('contenedorProductos')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
    });
  }

  clearMobileFilters(): void {
    this.clearCatalogFilters();
    this.mobileFilterView.set('main');
  }

  // =========================================================
  // PRODUCTOS
  // =========================================================

  openDetalle(product: Product): void {
    this.store.selectProducto(
      this.toProducto(product)
    );
  }

  add(product: Product): void {
    if (!this.hasStock(product)) {
      this.toast.error('Producto sin stock');
      return;
    }

    this.store.addToCart(
      this.toProducto(product)
    );

    this.toast.success(
      'Producto agregado al carrito'
    );
  }

  whatsappInfoLink(product: Product): string {
    const phone = '543513721017';

    const categories =
      Array.isArray(product.categorias)
        ? product.categorias.join(', ')
        : String(product.categorias ?? '-');

    const services =
      Array.isArray(product.servicios)
        ? product.servicios.join(', ')
        : String(product.servicios ?? '-');

    const text =
      `Hola LKS! Me gustaría saber más sobre el siguiente artículo:\n\n` +
      `${product.nombre}.\n\n` +
      `Categoría:\n${categories || '-'}.\n\n` +
      `Servicios:\n${services || '-'}.\n\n` +
      `Detalle:\n${
        product.infoModal ??
        product.descripcionCorta ??
        ''
      }`;

    return (
      'https://api.whatsapp.com/send' +
      `?phone=${phone}` +
      `&text=${encodeURIComponent(text)}`
    );
  }

  // =========================================================
  // IMÁGENES Y VIDEOS
  // =========================================================

  private isVideoUrl(
    url?: string | null
  ): boolean {
    const normalizedUrl =
      (url ?? '').toLowerCase().trim();

    return (
      normalizedUrl.endsWith('.mp4') ||
      normalizedUrl.endsWith('.webm') ||
      normalizedUrl.endsWith('.mov') ||
      normalizedUrl.endsWith('.m4v') ||
      normalizedUrl.includes('video')
    );
  }

  isVideo(url?: string | null): boolean {
    return this.isVideoUrl(url);
  }

  private buildMedias(
    product: any
  ): string[] {
    const medias = [
      ...(
        Array.isArray(product?.imagenes)
          ? product.imagenes
          : []
      ),
      product?.imgUrl,
      product?.imgUrl2,
      product?.imgUrl3,
      product?.img,
    ]
      .map((value: unknown) =>
        String(value ?? '').trim()
      )
      .filter(Boolean);

    return Array.from(new Set(medias));
  }

  private toProducto(
    product: Product
  ): Producto {
    const medias =
      this.buildMedias(product as any);

    const principalImage =
      medias[0] ??
      product.img ??
      '';

    return {
      id: product.id,
      nombre: product.nombre,
      img: principalImage,

      info:
        product.descripcionCorta ?? '',

      infoModal:
        product.infoModal ??
        product.descripcionCorta ??
        '',

      cat: 'all',

      categoria1:
        (product.servicios?.[0] as any) ??
        '',

      categoria2:
        (product.servicios?.[1] as any) ??
        '',

      detalle1:
        product.variantes?.[0]?.label ??
        '',

      detalle2:
        product.variantes?.[1]?.label ??
        '',

      categorias:
        product.categorias ?? [],

      keywords:
        product.keywords ?? [],

      stock:
        product.stock ?? 0,

      precio:
        product.precio ?? 0,

      imagenes:
        medias.length
          ? medias
          : [principalImage].filter(Boolean),
    };
  }

  // =========================================================
  // PRESENTACIÓN
  // =========================================================

  formatPrice(
    value: number | string | null | undefined
  ): string {
    const numberValue =
      typeof value === 'string'
        ? Number(value)
        : value;

    if (
      numberValue === null ||
      numberValue === undefined ||
      Number.isNaN(numberValue)
    ) {
      return '';
    }

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(numberValue);
  }

  hasStock(product: Product): boolean {
    return Number(product.stock ?? 0) > 0;
  }
}