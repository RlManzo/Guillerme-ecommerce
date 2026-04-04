import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-reset-password-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.scss',
})
export class ResetPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = signal(this.route.snapshot.queryParamMap.get('token') ?? '');
  password = signal('');
  confirmPassword = signal('');

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  submitted = signal(false);

  private passRx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  vPassword = computed(() => this.passRx.test(this.password()));
  vConfirmPassword = computed(() => {
    const p = this.password();
    const c = this.confirmPassword();
    return !!c && p === c;
  });

  showErr(ok: boolean) {
    return this.submitted() && !ok;
  }

  submit() {
    this.submitted.set(true);
    this.error.set(null);
    this.success.set(null);

    if (!this.token()) {
      this.error.set('El enlace no es válido o está incompleto.');
      return;
    }

    if (!this.vPassword() || !this.vConfirmPassword()) {
      this.error.set('Revisá los campos marcados.');
      return;
    }

    this.loading.set(true);

    this.auth.resetPassword({
      token: this.token(),
      newPassword: this.password(),
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(
          res?.message || 'Tu contraseña fue actualizada correctamente.'
        );

        setTimeout(() => {
          this.router.navigate(['/login'], {
            state: {
              successMessage: 'Tu contraseña fue actualizada. Ya podés iniciar sesión.',
            },
          });
        }, 1200);
      },
      error: (e: HttpErrorResponse) => {
  console.error(e);
  this.loading.set(false);

  const msg = e.error?.message || '';

  if (msg === 'Token inválido') {
    this.error.set('Token inválido. Volvé a pedir el reseteo de la contraseña.');
    return;
  }

  if (msg === 'El token venció') {
    this.error.set('El enlace expiró. Volvé a pedir el reseteo de la contraseña.');
    return;
  }

  this.error.set('No se pudo restablecer la contraseña.');
},
    });
  }
}