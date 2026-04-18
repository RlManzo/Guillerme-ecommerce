import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  if (token && req.url.startsWith('/api/')) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  const isAuthRoute =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/register') ||
    req.url.includes('/api/auth/forgot-password') ||
    req.url.includes('/api/auth/reset-password') ||
    req.url.includes('/api/auth/verify-email');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        req.url.startsWith('/api/') &&
        !isAuthRoute &&
        (error.status === 401 || error.status === 403)
      ) {
        auth.logout('Tu sesión expiró. Iniciá sesión nuevamente.');
      }

      return throwError(() => error);
    })
  );
};