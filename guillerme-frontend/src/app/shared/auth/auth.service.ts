import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
  documento: string;
  telefono: string;
  direccion: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type MeResponse = {
  email: string;
  role: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private logoutTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly _session = signal<UserSession | null>(this.readFromStorage());
  readonly session = this._session.asReadonly();

  readonly isLogged = computed(() => !!this._session());
  readonly token = computed(() => this._session()?.token ?? null);
  readonly email = computed(() => this._session()?.email ?? null);

  readonly role = computed(() => this._session()?.role ?? null);
  readonly isAdmin = computed(() => (this.role() ?? '').toUpperCase() === 'ADMIN');
  readonly isOperador = computed(() => (this.role() ?? '').toUpperCase() === 'OPERADOR');

  constructor() {
    this.restoreSessionTimer();
  }

  register(dto: RegisterDto) {
    return this.http.post<{ message: string }>('/api/auth/register', dto);
  }

  login(dto: LoginDto) {
    return this.http
      .post<{ token: string }>('/api/auth/login', dto)
      .pipe(tap((r) => this.setToken(r.token, dto.email)));
  }

  me() {
    return this.http.get<MeResponse>('/api/auth/me').pipe(
      tap((me) => {
        const current = this._session();
        if (!current) return;

        const updated: UserSession = {
          ...current,
          email: me.email ?? current.email,
          role: me.role ?? current.role,
        };

        this._session.set(updated);
        localStorage.setItem('auth.session', JSON.stringify(updated));
      })
    );
  }

  verifyEmail(token: string) {
    return this.http.post<{ message: string }>(
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
      {}
    );
  }

  logout(reason = 'Tu sesión expiró. Iniciá sesión nuevamente.') {
    this.clearLogoutTimer();
    this._session.set(null);
    localStorage.removeItem('auth.session');

    this.router.navigate(['/login'], {
      state: { successMessage: reason },
    });
  }

  clearSessionOnly() {
    this.clearLogoutTimer();
    this._session.set(null);
    localStorage.removeItem('auth.session');
  }

  isTokenExpired(): boolean {
    const token = this.token();
    if (!token) return true;

    const exp = this.getTokenExpiration(token);
    if (!exp) return true;

    return Date.now() >= exp;
  }

  restoreSessionTimer() {
    const current = this._session();
    if (!current?.token) return;

    const exp = this.getTokenExpiration(current.token);

    if (!exp) {
      this.clearSessionOnly();
      return;
    }

    if (Date.now() >= exp) {
      this.logout('Tu sesión venció. Volvé a iniciar sesión.');
      return;
    }

    this.scheduleAutoLogout(current.token);
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

    this.scheduleAutoLogout(token);
  }

  private scheduleAutoLogout(token: string) {
    this.clearLogoutTimer();

    const exp = this.getTokenExpiration(token);

    if (!exp) {
      this.clearSessionOnly();
      return;
    }

    const msUntilExpiration = exp - Date.now();

    if (msUntilExpiration <= 0) {
      this.logout('Tu sesión venció. Volvé a iniciar sesión.');
      return;
    }

    this.logoutTimer = setTimeout(() => {
      this.logout('Tu sesión venció. Volvé a iniciar sesión.');
    }, msUntilExpiration);
  }

  private getTokenExpiration(token: string): number | null {
    const decoded = this.decodeJwt(token);
    const exp = decoded?.exp;

    if (!exp || typeof exp !== 'number') return null;

    // exp viene en segundos desde epoch
    return exp * 1000;
  }

  private clearLogoutTimer() {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
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

  requestPasswordReset(email: string) {
    return this.http.post<{ message: string }>('/api/auth/forgot-password', { email });
  }

  resetPassword(body: { token: string; newPassword: string }) {
    return this.http.post<{ message: string }>('/api/auth/reset-password', body);
  }
}