import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../shared/auth/auth.service';
import { ProductsService } from '../../components/productos/products.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Product } from '../../components/productos/product.model';
import { AdminOrdersApi, AdminOrderSummaryDto } from '../../shared/admin/admin-orders.api';

@Component({
  standalone: true,
  selector: 'app-admin-home-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-home.page.html',
  styleUrl: './admin-home.page.scss',
})
export class AdminHomePage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly productsService = inject(ProductsService);
  private readonly ordersApi = inject(AdminOrdersApi);

  loading = signal(false);
  error = signal<string | null>(null);

  readonly productsSig = toSignal(this.productsService.products$, {
    initialValue: [] as Product[],
  });

  newOrders = signal<AdminOrderSummaryDto[]>([]);

  constructor() {
    if (!this.auth.isLogged()) {
      this.router.navigateByUrl('/login');
      return;
    }

    const role = (this.auth.session()?.role ?? '').toUpperCase();
    if (role !== 'ADMIN') {
      this.router.navigateByUrl('/');
      return;
    }

    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    this.productsService.load().subscribe({
      next: () => {},
      error: (e) => {
        console.error(e);
      },
    });

    this.ordersApi
      .list({
        status: 'NUEVO',
        page: 0,
        size: 100,
        sort: 'createdAt,desc',
      })
      .subscribe({
        next: (r) => {
          this.newOrders.set(r?.content ?? []);
          this.loading.set(false);
        },
        error: (e) => {
          console.error(e);
          this.error.set('No se pudo cargar el panel admin');
          this.loading.set(false);
        },
      });
  }

  productsCount() {
    return this.productsSig().length;
  }

  totalStock() {
    return this.productsSig().reduce((acc, p) => acc + (p.stock ?? 0), 0);
  }

  newOrdersCount() {
    return this.newOrders().length;
  }

  goProducts() {
    this.router.navigateByUrl('/admin/products');
  }

  goOrders() {
    this.router.navigateByUrl('/admin/orders');
  }
}