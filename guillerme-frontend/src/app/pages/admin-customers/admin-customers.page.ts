import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import {
  AdminCustomersApi,
  AdminCustomerUserResponse,
} from '../../shared/admin/admin-customers.api';

@Component({
  selector: 'app-admin-customers-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-customers.page.html',
  styleUrl: './admin-customers.page.scss',
})
export class AdminCustomersPage {
  loading = signal(false);
  error = signal<string | null>(null);
  customers = signal<AdminCustomerUserResponse[]>([]);
  search = signal('');

  readonly pageSize = 50;
  currentPage = signal(1);

  filteredCustomers = computed(() => {
    const value = this.search().trim().toLowerCase();

    if (!value) {
      return this.customers();
    }

    return this.customers().filter((customer) => {
      const fullName = `${customer.nombre ?? ''} ${customer.apellido ?? ''}`.toLowerCase();

      return (
        customer.email.toLowerCase().includes(value) ||
        fullName.includes(value) ||
        (customer.telefono ?? '').toLowerCase().includes(value) ||
        (customer.documento ?? '').toLowerCase().includes(value) ||
        (customer.direccion ?? '').toLowerCase().includes(value)
      );
    });
  });

  totalPages = computed(() => {
    const total = this.filteredCustomers().length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  });

  paginatedCustomers = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;

    return this.filteredCustomers().slice(start, end);
  });

  pageStart = computed(() => {
    if (this.filteredCustomers().length === 0) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSize + 1;
  });

  pageEnd = computed(() => {
    return Math.min(
      this.currentPage() * this.pageSize,
      this.filteredCustomers().length
    );
  });

  constructor(private readonly adminCustomersApi: AdminCustomersApi) {}

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading.set(true);
    this.error.set(null);

    this.adminCustomersApi.getAll().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando usuarios registrados', err);
        this.error.set('No se pudieron cargar los usuarios registrados.');
        this.loading.set(false);
      },
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  previousPage() {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }
}