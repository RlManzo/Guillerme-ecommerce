import { CommonModule, DatePipe, NgIf, NgFor } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OrdersService } from '../../shared/orders/orders.service';
import { OrderDetailDto, OrderSummaryDto } from '../../shared/orders/order.dto';
import { AuthService } from '../../shared/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-orders-page',
  imports: [CommonModule, NgIf, NgFor, RouterLink, DatePipe],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.scss',
})
export class OrdersPage {
  private readonly orders = inject(OrdersService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  rows = signal<OrderSummaryDto[]>([]);
  selected = signal<OrderDetailDto | null>(null);

  ngOnInit() {
  if (!this.auth.isLogged()) {
    this.router.navigateByUrl('/login');
    return;
  }

  const role = (this.auth.session()?.role ?? '').toUpperCase();
  if (role === 'ADMIN') {
    this.router.navigateByUrl('/admin/orders');
    return;
  }

  this.load();
}

  load() {
    this.loading.set(true);
    this.error.set(null);

    this.orders.listMine().subscribe({
      next: (r) => {
        this.rows.set(r ?? []);
        this.loading.set(false);
      },
      error: (e) => {
        console.error(e);
        this.error.set('No se pudieron cargar tus pedidos');
        this.rows.set([]);
        this.loading.set(false);
      },
    });
  }

  open(id: number) {
    this.selected.set(null);
    this.orders.getById(id).subscribe({
      next: (d) => this.selected.set(d),
      error: (e) => {
        console.error(e);
        this.error.set('No se pudo cargar el detalle del pedido');
      },
    });
  }

  closeDetail() {
    this.selected.set(null);
  }
}
