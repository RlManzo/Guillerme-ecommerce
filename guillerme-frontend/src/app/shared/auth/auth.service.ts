import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export type UserSession = {
  token: string;
  email: string;
  role?: string; // <- ahora sí lo persistimos
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

  // ✅ nuevo
  readonly role = computed(() => this._session()?.role ?? null);
  readonly isAdmin = computed(() => (this.role() ?? '').toUpperCase() === 'ADMIN');

  register(dto: RegisterDto) {
    return this.http
      .post<{ token: string }>('/api/auth/register', dto)
      .pipe(tap((r) => this.setToken(r.token, dto.email)));
  }

  login(dto: LoginDto) {
    return this.http
      .post<{ token: string }>('/api/auth/login', dto)
      .pipe(tap((r) => this.setToken(r.token, dto.email)));
  }

  logout() {
    this._session.set(null);
    localStorage.removeItem('auth.session');
  }

  private setToken(token: string, email: string) {
    const decoded = this.decodeJwt(token);

    // OJO: el claim puede llamarse role, rol, authority, etc.
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

  // ✅ JWT decode sin librerías
  private decodeJwt(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;

      const payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      // padding base64
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
