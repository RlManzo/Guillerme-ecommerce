import {
  Component,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  OnInit,
  HostListener,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


import { AdminProductsApi, ProductResponse } from '../../shared/admin/admin-products.api';
import {
  LocalSalesApi,
  LocalSaleSummaryDto,
  LocalSaleDetailDto,
} from '../../shared/admin/local-sales.api';
import { AuthService } from '../../shared/auth/auth.service';
import { ToastService } from '../../shared/service/toast.service';
import { downloadLocalSalePdf } from '../../shared/pdf/local-sale-receipt.pdf';
import { AdminStockLookupComponent } from '../admin-stock-lookup/admin-stock-lookup.component';

type CartItem = {
  productId: number;
  nombre: string;
  barcode?: string | null;
  precio: number;
  stock: number;
  qty: number;
};

@Component({
  standalone: true,
  selector: 'app-admin-purchases',
  imports: [CommonModule, FormsModule, NgIf, NgFor, DatePipe, DecimalPipe, AdminStockLookupComponent],
  templateUrl: './admin-cart.page.html',
  styleUrl: './admin-cart.page.scss',
})
export class AdminCartPage implements OnInit {
  private readonly api = inject(AdminProductsApi);
  private readonly localSalesApi = inject(LocalSalesApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  @ViewChild('scanInputEl') scanInputEl?: ElementRef<HTMLInputElement>;

  tab = signal<'new' | 'history' | 'stock'>('history');

  q = signal('');
  fromDate = signal<string | null>(null);
  toDate = signal<string | null>(null);

  orderStarted = signal(false);
  scanInput = signal('');
  cart = signal<CartItem[]>([]);
  loading = signal(false);
  sending = signal(false);
  lastAddedId = signal<number | null>(null);

  historyLoading = signal(false);
  historyRows = signal<LocalSaleSummaryDto[]>([]);
  selectedSale = signal<LocalSaleDetailDto | null>(null);

  manualTypingMode = signal(false);

  page = signal(0);
  size = signal(10);
  totalPages = signal(0);
  totalElements = signal(0);
  customerName = signal('');

  // null = venta nueva
  // number = venta reabierta en edición
  editingSaleId = signal<number | null>(null);

  manualSearchResults = signal<ProductResponse[]>([]);
  manualSearchLoading = signal(false);
  @ViewChild('cartSection') cartSection?: ElementRef;

  // scanner global
  private scannerBuffer = '';
  private scannerTimer: ReturnType<typeof setTimeout> | null = null;
  private manualSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private manualSearchRequestId = 0;

  ngOnInit(): void {
    if (this.tab() === 'history') {
      this.loadHistory();
    }
  }

  totalItems = computed(() =>
    this.cart().reduce((acc, it) => acc + it.qty, 0)
  );

  totalAmount = computed(() =>
    this.cart().reduce((acc, it) => acc + it.precio * it.qty, 0)
  );

  switchTab(next: 'new' | 'history' | 'stock') {
  this.tab.set(next);

  if (next === 'history') {
    this.loadHistory();
  } else if (next === 'new') {
    this.selectedSale.set(null);
    this.focusInput();
  } else {
    this.selectedSale.set(null);
  }
}

  startOrder() {
    this.tab.set('new');
    this.orderStarted.set(true);
    this.scanInput.set('');
    this.customerName.set('');
    this.cart.set([]);
    this.lastAddedId.set(null);
    this.editingSaleId.set(null);
    this.manualTypingMode.set(false);
    this.manualSearchResults.set([]);
    this.manualSearchLoading.set(false);
    this.clearManualSearchTimer();
    this.scannerBuffer = '';
    this.clearScannerTimer();
    this.focusInput();
  }

  cancelOrder() {
    const saleId = this.editingSaleId();

    if (saleId == null) {
      this.orderStarted.set(false);
      this.scanInput.set('');
      this.customerName.set('');
      this.cart.set([]);
      this.lastAddedId.set(null);
      this.editingSaleId.set(null);
      this.manualTypingMode.set(false);
      this.manualSearchResults.set([]);
      this.manualSearchLoading.set(false);
      this.clearManualSearchTimer();
      this.scannerBuffer = '';
      this.clearScannerTimer();
      return;
    }

    if (
      !confirm(
        `¿Cancelar la edición de la venta #${saleId}? La venta volverá a FINALIZADA y se descontará nuevamente el stock original.`
      )
    ) {
      return;
    }

    this.sending.set(true);

    this.localSalesApi.close(saleId).subscribe({
      next: () => {
        this.sending.set(false);

        this.toast.success(`Venta #${saleId} restaurada a FINALIZADA`);

        this.orderStarted.set(false);
        this.scanInput.set('');
        this.customerName.set('');
        this.cart.set([]);
        this.lastAddedId.set(null);
        this.editingSaleId.set(null);
        this.manualTypingMode.set(false);
        this.manualSearchResults.set([]);
        this.manualSearchLoading.set(false);
        this.clearManualSearchTimer();
        this.scannerBuffer = '';
        this.clearScannerTimer();

        this.switchTab('history');
        this.openSale(saleId);
        this.loadHistory();
      },
      error: (e) => {
        console.error(e);
        this.sending.set(false);
        this.toast.error(
          e?.error?.message || 'No se pudo cancelar la edición de la venta'
        );
      },
    });
  }

  focusInput() {
    setTimeout(() => {
      this.scanInputEl?.nativeElement.focus();
      this.scanInputEl?.nativeElement.select();
    }, 0);
  }

  @HostListener('document:keydown', ['$event'])
onGlobalKeydown(event: KeyboardEvent) {
  if (!this.orderStarted()) return;
  if (this.loading() || this.sending()) return;

  /**
   * Si está activado el modo escritura manual,
   * no interceptamos teclas globales.
   * El usuario escribe en el input y agrega con botón o Enter.
   */
  if (this.manualTypingMode()) {
    return;
  }

  const target = event.target as HTMLElement | null;
  const tag = target?.tagName?.toLowerCase();

  // No interceptar si el usuario está escribiendo en otro campo distinto del input de escaneo
  if (
    target &&
    (
      tag === 'textarea' ||
      tag === 'select' ||
      (tag === 'input' && target !== this.scanInputEl?.nativeElement)
    )
  ) {
    return;
  }

  // Ignorar combinaciones tipo Ctrl/Cmd/Alt
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  // Enter => procesar buffer
  if (event.key === 'Enter') {
    const code = this.scannerBuffer.trim() || this.scanInput().trim();
    if (!code) return;

    event.preventDefault();
    this.scanInput.set(code);
    this.scannerBuffer = '';
    this.clearScannerTimer();
    this.scanCode();
    return;
  }

  // Backspace para edición manual
  if (event.key === 'Backspace') {
    this.scannerBuffer = this.scannerBuffer.slice(0, -1);
    this.scanInput.set(this.scannerBuffer);
    return;
  }

  // Ignorar teclas especiales
  if (event.key.length !== 1) {
    return;
  }

  this.scannerBuffer += event.key;
  this.scanInput.set(this.scannerBuffer);
  this.restartScannerTimer();
}

  private restartScannerTimer() {
    this.clearScannerTimer();

    // Si el scanner no manda Enter, resolvemos el buffer por timeout corto
    this.scannerTimer = setTimeout(() => {
      const code = this.scannerBuffer.trim();
      if (!code) return;

      this.scanInput.set(code);
      this.scannerBuffer = '';
      this.scanCode();
    }, 120);
  }

  private clearScannerTimer() {
    if (this.scannerTimer) {
      clearTimeout(this.scannerTimer);
      this.scannerTimer = null;
    }
  }

  scanCode() {
    const code = this.scanInput().trim();
    if (!code || this.loading() || this.sending()) return;

    this.loading.set(true);

    this.api.getByBarcode(code).subscribe({
      next: (p) => {
        this.loading.set(false);
        this.addToCart(p);
        this.scanInput.set('');
        this.scannerBuffer = '';
        this.clearScannerTimer();
        this.focusInput();
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('No se encontró producto con ese código');
        this.scanInput.set('');
        this.scannerBuffer = '';
        this.clearScannerTimer();
        this.focusInput();
      },
    });
  }

addToCart(p: any) {
  this.cart.update((list) => {
    const existing = list.find((i) => i.productId === p.id);

    if (existing) {
      if (existing.qty + 1 > existing.stock) {
        this.toast.error(`Sin stock suficiente para ${p.nombre}`);
        return list;
      }

      const updatedItem: CartItem = {
        ...existing,
        qty: existing.qty + 1,
      };

      this.flashAdded(p.id);

      // ✅ Si ya existía, lo actualiza y también lo mueve arriba
      return [
        updatedItem,
        ...list.filter((i) => i.productId !== p.id),
      ];
    }

    const newItem: CartItem = {
      productId: p.id,
      nombre: p.nombre,
      barcode: p.barcode,
      precio: Number(p.precio ?? 0),
      stock: Number(p.stock ?? 0),
      qty: 1,
    };

    this.flashAdded(p.id);

    // ✅ Si es nuevo, se agrega arriba de todo
    return [
      newItem,
      ...list,
    ];
  });
}

  flashAdded(productId: number) {
    this.lastAddedId.set(productId);
    setTimeout(() => this.lastAddedId.set(null), 900);
  }

  removeItem(id: number) {
    if (this.sending()) return;
    this.cart.update((list) => list.filter((i) => i.productId !== id));
    this.focusInput();
  }

  changeQty(item: CartItem, qty: number) {
    if (this.sending()) return;

    const nextQty = Number(qty);

    if (!Number.isFinite(nextQty) || nextQty <= 0) {
      this.toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (nextQty > item.stock) {
      this.toast.error(`Stock máximo disponible: ${item.stock}`);
      qty = item.stock;
    }

    this.cart.update((list) => {
      const it = list.find((i) => i.productId === item.productId);
      if (it) it.qty = Number(qty);
      return [...list];
    });
  }

  clearCart() {
    if (this.sending()) return;
    this.cart.set([]);
    this.scanInput.set('');
    this.lastAddedId.set(null);
    this.manualTypingMode.set(false);
    this.manualSearchResults.set([]);
    this.manualSearchLoading.set(false);
    this.clearManualSearchTimer();
    this.scannerBuffer = '';
    this.clearScannerTimer();
    this.focusInput();
  }

  finalize() {
    if (!this.auth.isLogged()) {
      this.toast.error('Iniciá sesión para completar la compra');
      this.router.navigateByUrl('/login');
      return;
    }

    const cart = this.cart();
    if (!cart.length) {
      this.toast.error('Carrito vacío');
      return;
    }

    const invalid = cart.find((it) => {
      const stock = it.stock ?? 0;
      return stock <= 0 || it.qty > stock;
    });

    if (invalid) {
      this.toast.error(`Stock insuficiente para: ${invalid.nombre}`);
      return;
    }

    const body = {
      items: cart.map((it) => ({
        productId: it.productId,
        qty: it.qty,
      })),
      comment: '[ADMIN MOSTRADOR] Venta presencial generada desde caja',
      customerName: this.customerName().trim() || null,
    };

    this.sending.set(true);

    const saleId = this.editingSaleId();

    const req$ =
      saleId == null
        ? this.localSalesApi.create(body)
        : this.localSalesApi.update(saleId, body);

    req$.subscribe({
      next: (res) => {
        this.localSalesApi.getById(res.saleId).subscribe({
          next: async (saleDetail) => {
            this.sending.set(false);

            this.toast.success(
              saleId == null
                ? `Venta #${res.saleId} generada correctamente`
                : `Venta #${res.saleId} actualizada correctamente`
            );

            await this.downloadSalePdf(saleDetail);

            this.cart.set([]);
            this.scanInput.set('');
            this.lastAddedId.set(null);
            this.orderStarted.set(false);
            this.customerName.set('');
            this.editingSaleId.set(null);
            this.manualTypingMode.set(false);
            this.manualSearchResults.set([]);
            this.manualSearchLoading.set(false);
            this.clearManualSearchTimer();
            this.scannerBuffer = '';
            this.clearScannerTimer();

            this.switchTab('history');
            this.openSale(res.saleId);
          },
          error: (e) => {
            console.error(e);
            this.sending.set(false);

            this.toast.success(
              saleId == null
                ? `Venta #${res.saleId} generada correctamente`
                : `Venta #${res.saleId} actualizada correctamente`
            );

            this.toast.error('La venta se guardó, pero no se pudo descargar el PDF');

            this.cart.set([]);
            this.scanInput.set('');
            this.lastAddedId.set(null);
            this.orderStarted.set(false);
            this.customerName.set('');
            this.editingSaleId.set(null);
            this.manualTypingMode.set(false);
            this.manualSearchResults.set([]);
            this.manualSearchLoading.set(false);
            this.clearManualSearchTimer();
            this.scannerBuffer = '';
            this.clearScannerTimer();

            this.switchTab('history');
            this.openSale(res.saleId);
          },
        });
      },
      error: (e) => {
        console.error(e);
        this.sending.set(false);
        this.toast.error(e?.error?.message || 'No se pudo guardar la venta');
      },
    });
  }

  loadHistory() {
    this.historyLoading.set(true);

    this.localSalesApi
      .list({
        q: this.q().trim() || undefined,
        from: this.toIsoDateStart(this.fromDate()),
        to: this.toIsoDateEnd(this.toDate()),
        page: this.page(),
        size: this.size(),
        sort: 'createdAt,desc',
      })
      .subscribe({
        next: (r) => {
          this.historyLoading.set(false);
          this.historyRows.set(r?.content ?? []);
          this.totalPages.set(r?.totalPages ?? 0);
          this.totalElements.set(r?.totalElements ?? 0);
        },
        error: (e) => {
          console.error(e);
          this.historyLoading.set(false);
          this.toast.error('No se pudo cargar el historial');
        },
      });
  }

  applyHistoryFilters() {
    this.page.set(0);
    this.selectedSale.set(null);
    this.loadHistory();
  }

  resetHistoryFilters() {
    this.q.set('');
    this.fromDate.set(null);
    this.toDate.set(null);
    this.page.set(0);
    this.selectedSale.set(null);
    this.loadHistory();
  }

  changeHistorySize(v: number) {
    this.size.set(Number(v || 10));
    this.page.set(0);
    this.selectedSale.set(null);
    this.loadHistory();
  }

  openSale(id: number) {
    this.selectedSale.set(null);

    this.localSalesApi.getById(id).subscribe({
      next: (d) => this.selectedSale.set(d),
      error: (e) => {
        console.error(e);
        this.toast.error('No se pudo cargar el detalle de la venta');
      },
    });
  }

  closeSaleDetail() {
    this.selectedSale.set(null);
  }

  cancelSelectedSale() {
    const sale = this.selectedSale();
    if (!sale) return;

    if (!confirm(`¿Anular la venta #${sale.id}? Se devolverá el stock.`)) {
      return;
    }

    this.localSalesApi.cancel(sale.id).subscribe({
      next: () => {
        this.toast.success(`Venta #${sale.id} anulada`);
        this.openSale(sale.id);
        this.loadHistory();
      },
      error: (e) => {
        console.error(e);
        this.toast.error(e?.error?.message || 'No se pudo anular la venta');
      },
    });
  }

  reopenSelectedSale() {
    const sale = this.selectedSale();
    if (!sale) return;

    if (
      !confirm(
        `¿Reabrir la venta #${sale.id}? Se devolverá el stock para volver a editarla.`
      )
    ) {
      return;
    }

    this.localSalesApi.reopen(sale.id).subscribe({
      next: () => {
        this.localSalesApi.getById(sale.id).subscribe({
          next: (d) => {
            this.selectedSale.set(d);

            this.tab.set('new');
            this.orderStarted.set(true);
            this.editingSaleId.set(d.id);
            this.customerName.set(d.customerName ?? '');
            this.scanInput.set('');
            this.lastAddedId.set(null);
            this.manualTypingMode.set(false);
            this.manualSearchResults.set([]);
            this.manualSearchLoading.set(false);
            this.clearManualSearchTimer();
            this.scannerBuffer = '';
            this.clearScannerTimer();

            const items = d.items.map((it) => ({
              productId: it.productId,
              nombre: it.productNombre,
              barcode: it.barcode,
              precio: Number(it.unitPrice ?? 0),
              stock: 999999,
              qty: Number(it.qty ?? 1),
            }));

            this.cart.set(items);
            this.loadHistory();
            this.toast.success(`Venta #${sale.id} reabierta`);
            this.focusInput();
          },
          error: (e) => {
            console.error(e);
            this.toast.error('La venta se reabrió pero no se pudo cargar su detalle');
          },
        });
      },
      error: (e) => {
        console.error(e);
        this.toast.error(e?.error?.message || 'No se pudo reabrir la venta');
      },
    });
  }

  saleStatusLabel(status?: string | null): string {
    switch (status) {
      case 'ABIERTA':
        return 'Abierta';
      case 'ANULADA':
        return 'Anulada';
      case 'FINALIZADA':
      default:
        return 'Finalizada';
    }
  }

  saleStatusClass(status?: string | null): string {
    switch (status) {
      case 'ABIERTA':
        return 'status-open';
      case 'ANULADA':
        return 'status-cancelled';
      case 'FINALIZADA':
      default:
        return 'status-finalized';
    }
  }

  canCancelSelectedSale(): boolean {
    return this.selectedSale()?.status === 'FINALIZADA';
  }

  canReopenSelectedSale(): boolean {
    return this.selectedSale()?.status === 'FINALIZADA';
  }

  goPrev() {
    if (this.page() <= 0) return;
    this.page.set(this.page() - 1);
    this.loadHistory();
  }

  goNext() {
    if (this.page() + 1 >= this.totalPages()) return;
    this.page.set(this.page() + 1);
    this.loadHistory();
  }

  downloadSalePdf(sale: LocalSaleDetailDto | null) {
    if (!sale) return;
    downloadLocalSalePdf(sale);
  }

  toIsoDateStart(d: string | null): string | undefined {
    if (!d) return undefined;
    return new Date(d + 'T00:00:00').toISOString();
  }

  toIsoDateEnd(d: string | null): string | undefined {
    if (!d) return undefined;
    return new Date(d + 'T23:59:59').toISOString();
  }

  onManualProductSelected(p: ProductResponse) {
    if (this.sending()) return;

    if ((p.stock ?? 0) <= 0) {
      this.toast.error(`Sin stock para ${p.nombre}`);
      return;
    }

    this.addToCart(p);
    this.toast.success(`${p.nombre} agregado al pedido`);

    this.scanInput.set('');
    this.manualSearchResults.set([]);
    this.manualSearchLoading.set(false);
    this.clearManualSearchTimer();
    this.focusInput();
    this.scrollToCart();
  }

  scrollToCart() {
    setTimeout(() => {
      this.cartSection?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 0);
  }

  toggleManualTypingMode() {
    this.manualTypingMode.update((v) => !v);

    this.scannerBuffer = '';
    this.clearScannerTimer();
    this.clearManualSearchTimer();
    this.manualSearchResults.set([]);
    this.manualSearchLoading.set(false);
    this.scanInput.set('');

    this.focusInput();
  }

  onScanInputChange(value: string): void {
    this.scanInput.set(value);

    if (!this.manualTypingMode()) {
      return;
    }

    this.scannerBuffer = '';
    this.clearScannerTimer();
    this.scheduleManualSearch(value);
  }

  scanCodeManual(event?: Event): void {
    event?.preventDefault();

    if (!this.manualTypingMode()) {
      this.scanCode();
      return;
    }

    const query = this.scanInput().trim();
    if (!query || this.loading() || this.sending()) return;

    const exact = this.manualSearchResults().find((p) => {
      const barcode = String(p.barcode ?? '').trim().toLowerCase();
      const codigo = String((p as any).codigo ?? '').trim().toLowerCase();
      const normalizedQuery = query.toLowerCase();

      return barcode === normalizedQuery || codigo === normalizedQuery;
    });

    if (exact) {
      this.onManualProductSelected(exact);
      return;
    }

    if (this.manualSearchResults().length === 1) {
      this.onManualProductSelected(this.manualSearchResults()[0]);
      return;
    }

    this.scheduleManualSearch(query, true);
  }

  private scheduleManualSearch(value: string, immediate = false): void {
    this.clearManualSearchTimer();

    const query = value.trim();

    if (query.length < 2) {
      this.manualSearchResults.set([]);
      this.manualSearchLoading.set(false);
      return;
    }

    this.manualSearchResults.set([]);
    this.manualSearchLoading.set(true);

    if (immediate) {
      this.searchManualProducts(query);
      return;
    }

    this.manualSearchTimer = setTimeout(() => {
      this.searchManualProducts(query);
    }, 250);
  }

  private searchManualProducts(query: string): void {
    if (!this.manualTypingMode()) return;

    const requestId = ++this.manualSearchRequestId;
    this.manualSearchLoading.set(true);

    this.api.search(query).subscribe({
      next: (res) => {
        if (requestId !== this.manualSearchRequestId) return;
        if (this.scanInput().trim() !== query) return;

        this.manualSearchLoading.set(false);
        this.manualSearchResults.set(
          this.rankAndFilterProducts(res ?? [], query)
        );
      },
      error: () => {
        if (requestId !== this.manualSearchRequestId) return;

        this.manualSearchLoading.set(false);
        this.manualSearchResults.set([]);
      },
    });
  }

  private clearManualSearchTimer(): void {
    if (this.manualSearchTimer) {
      clearTimeout(this.manualSearchTimer);
      this.manualSearchTimer = null;
    }

    // Invalida cualquier respuesta anterior que todavía esté en vuelo.
    this.manualSearchRequestId++;
  }

  private rankAndFilterProducts(
    products: ProductResponse[],
    rawTerm: string
  ): ProductResponse[] {
    const term = this.normalizeSearch(rawTerm);

    if (!term) {
      return [];
    }

    return products
      .map((product) => ({
        product,
        score: this.getProductScore(product, term),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return this.normalizeSearch(a.product.nombre).localeCompare(
          this.normalizeSearch(b.product.nombre)
        );
      })
      .map((item) => item.product);
  }

  private getProductScore(product: ProductResponse, term: string): number {
    const p: any = product;

    const nombre = this.normalizeSearch(p.nombre);
    const marca = this.normalizeSearch(p.marca);
    const barcode = this.normalizeSearch(p.barcode);
    const codigo = this.normalizeSearch(p.codigo);
    const keywords = this.normalizeSearch(p.keywords);

    if (barcode && barcode === term) return 100;
    if (codigo && codigo === term) return 95;
    if (marca && marca === term) return 90;
    if (this.hasExactWord(nombre, term)) return 80;
    if (this.hasExactWord(keywords, term)) return 75;
    if (nombre.startsWith(term)) return 70;

    if (term.length <= 3) return 0;

    if (nombre.includes(term)) return 40;
    if (marca.includes(term)) return 35;
    if (keywords.includes(term)) return 30;

    return 0;
  }

  private normalizeSearch(value: string | null | undefined): string {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private hasExactWord(text: string, term: string): boolean {
    if (!text || !term) return false;

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `(^|[\\s\\-_/.,;:()\\[\\]])${escaped}($|[\\s\\-_/.,;:()\\[\\]])`,
      'i'
    );

    return regex.test(text);
  }
}
