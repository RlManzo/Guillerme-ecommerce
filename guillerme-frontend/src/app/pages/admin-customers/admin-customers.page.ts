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
        (customer.documento ?? '').toLowerCase().includes(value)
      );
    });
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
  }
}