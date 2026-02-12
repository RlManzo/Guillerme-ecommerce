import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../shared/auth/auth.service';
import {
  AdminOrdersApi,
  AdminOrderDetailDto,
  AdminOrderSummaryDto,
  OrderStatus,
} from '../../shared/admin/admin-orders.api';

import { downloadPaidOrderPdf } from '../../shared/pdf/order-receipt.pdf';

@Component({
  standalone: true,
  selector: 'app-admin-orders-page',
  imports: [CommonModule, NgIf, NgFor, RouterLink, DatePipe, FormsModule],
  templateUrl: './admin-orders.page.html',
  styleUrl: './admin-orders.page.scss',
})
export class AdminOrdersPage {
  private readonly api = inject(AdminOrdersApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  fromDate = signal<string>(''); // YYYY-MM-DD
  toDate = signal<string>('');   // YYYY-MM-DD

  rows = signal<AdminOrderSummaryDto[]>([]);
  selected = signal<AdminOrderDetailDto | null>(null);

  // filtros
  q = signal('');
  statusFilter = signal<string>(''); // '' = todos

  // paginación
  page = signal(0);
  size = signal(10);
  totalPages = signal(1);
  totalElements = signal(0);

  canPrev = computed(() => this.page() > 0);
  canNext = computed(() => this.page() + 1 < this.totalPages());

  // ✅ totales para el detalle
  totalItemsSelected = computed(() => {
    const s = this.selected();
    if (!s) return 0;
    return (s.items ?? []).reduce((acc, it) => acc + (it.qty ?? 0), 0);
  });

  totalPriceSelected = computed(() => {
    const s = this.selected();
    if (!s) return 0;
    return (s.items ?? []).reduce(
      (acc, it) => acc + ((it.unitPrice ?? 0) * (it.qty ?? 0)),
      0
    );
  });

  // edición status
  statusEdit = signal<OrderStatus>('NUEVO');
  savingStatus = signal(false);

  readonly statusOptions: OrderStatus[] = [
    'NUEVO',
    'PENDIENTE_DE_PAGO',
    'PAGADO',
    'ENVIADO',
  ];

  readonly statusLabel: Record<OrderStatus, string> = {
    NUEVO: 'NUEVO',
    PENDIENTE_DE_PAGO: 'PENDIENTE DE PAGO',
    PAGADO: 'PAGADO',
    ENVIADO: 'ENVIADO',
  };

  ngOnInit() {
    if (!this.auth.isLogged()) {
      this.router.navigateByUrl('/login');
      return;
    }

    const role = (this.auth.session()?.role ?? '').toUpperCase();
    if (role && role !== 'ADMIN') {
      this.router.navigateByUrl('/');
      return;
    }

    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    const qq = this.q().trim();
    const st = this.statusFilter().trim();
    const from = this.fromDate().trim();
    const to = this.toDate().trim();

    this.api
      .list({
        q: qq || undefined,
        status: st || undefined,
        from: from || undefined,
        to: to || undefined,
        page: this.page(),
        size: this.size(),
        sort: 'createdAt,desc',
      })
      .subscribe({
        next: (r) => {
          this.rows.set(r?.content ?? []);
          this.totalPages.set(r?.totalPages ?? 1);
          this.totalElements.set(r?.totalElements ?? 0);
          this.page.set(r?.number ?? this.page());
          this.size.set(r?.size ?? this.size());
          this.loading.set(false);
        },
        error: (e) => {
          console.error(e);
          this.error.set('No se pudieron cargar los pedidos');
          this.rows.set([]);
          this.totalPages.set(1);
          this.totalElements.set(0);
          this.loading.set(false);
        },
      });
  }

  applyFilters() {
    this.selected.set(null);
    this.page.set(0);
    this.load();
  }

  resetFilters() {
    this.q.set('');
    this.statusFilter.set('');
    this.fromDate.set('');
    this.toDate.set('');
    this.selected.set(null);
    this.page.set(0);
    this.load();
  }

  changeSize(v: number) {
    const next = Number(v || 10);
    this.size.set(next);
    this.page.set(0);
    this.load();
  }

  prevPage() {
    if (!this.canPrev()) return;
    this.page.update((p) => Math.max(0, p - 1));
    this.load();
  }

  nextPage() {
    if (!this.canNext()) return;
    this.page.update((p) => p + 1);
    this.load();
  }

  refresh() {
    this.load();
  }

  open(id: number) {
    this.selected.set(null);
    this.error.set(null);

    this.api.getById(id).subscribe({
      next: (d) => {
        this.selected.set(d);
        this.statusEdit.set(d.status);
      },
      error: (e) => {
        console.error(e);
        this.error.set('No se pudo cargar el detalle del pedido');
      },
    });
  }

  closeDetail() {
    this.selected.set(null);
  }

  saveStatus() {
    const sel = this.selected();
    if (!sel) return;

    const next = this.statusEdit();
    if (!next) return;

    this.savingStatus.set(true);
    this.api.updateStatus(sel.id, next).subscribe({
      next: () => {
        this.savingStatus.set(false);

        // 1) actualizo detalle local
        this.selected.update((v) => (v ? { ...v, status: next } : v));

        // 2) actualizo listado
        this.rows.update((arr) =>
          arr.map((o) => (o.id === sel.id ? { ...o, status: next } : o))
        );

        // 3) si queda PAGADO, descargar automáticamente
        if (next === 'PAGADO') {
          const updated = { ...(this.selected() as any), status: next };
          downloadPaidOrderPdf(updated);
        }
      },
      error: (e) => {
        console.error(e);
        this.savingStatus.set(false);
        this.error.set('No se pudo actualizar el estado');
      },
    });
  }

  downloadPdf() {
    const sel = this.selected();
    if (!sel) return;
    downloadPaidOrderPdf(sel);
  }
}
