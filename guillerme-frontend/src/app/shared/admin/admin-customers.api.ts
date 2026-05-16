// src/app/shared/admin/admin-customers.api.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AdminCustomerUserResponse = {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN' | 'OPERADOR';
  enabled: boolean;
  emailVerified: boolean;

  createdAt?: string | null;
  updatedAt?: string | null;

  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  documento?: string | null;
};

@Injectable({ providedIn: 'root' })
export class AdminCustomersApi {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<AdminCustomerUserResponse[]> {
    return this.http.get<AdminCustomerUserResponse[]>('/api/admin/customers');
  }
}