import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export type UserSession = {
  token: string;
  email: string;
  role?: string;
};

export type RegisterDto = {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _session = signal<UserSession | null>(this.readFromStorage());
  readonly session = this._session.asReadonly();

  readonly isLogged = computed(() => !!this._session());
  readonly token = computed(() => this._session()?.token ?? null);
  readonly email = computed(() => this._session()?.email ?? null);

  readonly role = computed(() => this._session()?.role ?? null);
  readonly isAdmin = computed(() => (this.role() ?? '').toUpperCase() === 'ADMIN');

  register(dto: RegisterDto) {
    return this.http.post<{ message: string }>('/api/auth/register', dto);
  }

  login(dto: LoginDto) {
    return this.http
      .post<{ token: string }>('/api/auth/login', dto)
      .pipe(tap((r) => this.setToken(r.token, dto.email)));
  }

  verifyEmail(token: string) {
    return this.http.post<{ message: string }>(
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
      {}
    );
  }

  logout() {
    this._session.set(null);
    localStorage.removeItem('auth.session');
  }

  private setToken(token: string, email: string) {
    const decoded = this.decodeJwt(token);

    const role =
      (decoded?.role as string | undefined) ??
      (decoded?.rol as string | undefined) ??
      (decoded?.authority as string | undefined) ??
      (decoded?.authorities as string | undefined);

    const s: UserSession = { token, email, role };
    this._session.set(s);
    localStorage.setItem('auth.session', JSON.stringify(s));
  }

  private readFromStorage(): UserSession | null {
    try {
      const raw = localStorage.getItem('auth.session');
      return raw ? (JSON.parse(raw) as UserSession) : null;
    } catch {
      return null;
    }
  }

  private decodeJwt(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;

      const payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);

      const json = decodeURIComponent(
        atob(padded)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}