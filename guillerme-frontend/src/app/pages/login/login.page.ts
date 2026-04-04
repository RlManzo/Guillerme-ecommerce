import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = signal('');
  password = signal('');

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  showPassword = signal(false);

  constructor() {
    const navState = history.state;
    if (navState?.successMessage) {
      this.success.set(navState.successMessage);
    }

    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.verifyEmailToken(token);
    }
  }

  private verifyEmailToken(token: string) {
    this.error.set(null);

    this.auth.verifyEmail(token).subscribe({
      next: (res) => {
        this.success.set(
          res.message || '¡Tu cuenta fue verificada! Ya podés iniciar sesión.'
        );

        this.router.navigate([], {
          queryParams: {},
          replaceUrl: true,
        });
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
        this.error.set(
          e.error?.message || 'No se pudo verificar la cuenta.'
        );

        this.router.navigate([], {
          queryParams: {},
          replaceUrl: true,
        });
      },
    });
  }

  submit() {
    this.error.set(null);
    this.success.set(null);
    this.loading.set(true);

    this.auth
      .login({ email: this.email().trim(), password: this.password() })
      .subscribe({
        next: () => {
          this.loading.set(false);

          const role = (this.auth.session()?.role ?? '').toUpperCase();

          if (role === 'ADMIN') {
            this.router.navigateByUrl('/admin');
            return;
          }

          this.router.navigateByUrl('/');
        },
        error: (e: HttpErrorResponse) => {
          console.error(e);
          this.loading.set(false);

          if (e.status === 403) {
            this.error.set(
              e.error?.message || 'Debés verificar tu email antes de ingresar'
            );
            return;
          }

          if (e.status === 401) {
            this.error.set('Email o contraseña incorrectos');
            return;
          }

          if (e.status === 400) {
            this.error.set(e.error?.message || 'Datos inválidos');
            return;
          }

          this.error.set('Ocurrió un error al iniciar sesión');
        },
      });
  }
}