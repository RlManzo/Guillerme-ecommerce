import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-forgot-password-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss',
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  email = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  resendCooldown = signal(0);

  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearCooldownTimer();
    });
  }

  canSubmit() {
    return !this.loading() && this.resendCooldown() === 0;
  }

  buttonText() {
    if (this.loading()) return 'Enviando...';
    if (this.resendCooldown() > 0) return `Reenviar en ${this.resendCooldown()}s`;
    return 'Enviar enlace';
  }

  submit() {
    this.error.set(null);
    this.success.set(null);

    const email = this.email().trim();
    if (!email) {
      this.error.set('Ingresá tu email');
      return;
    }

    if (this.resendCooldown() > 0) {
      return;
    }

    this.loading.set(true);

    this.auth.requestPasswordReset(email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(
          res?.message || 'Si el email existe, te enviamos un enlace para restablecer tu contraseña.'
        );
        this.startCooldown(30);
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
        this.loading.set(false);
        this.error.set(
          e.error?.message || 'No se pudo procesar la solicitud'
        );
      },
    });
  }

  private startCooldown(seconds: number) {
    this.clearCooldownTimer();
    this.resendCooldown.set(seconds);

    this.timerId = setInterval(() => {
      const next = this.resendCooldown() - 1;

      if (next <= 0) {
        this.resendCooldown.set(0);
        this.clearCooldownTimer();
        return;
      }

      this.resendCooldown.set(next);
    }, 1000);
  }

  private clearCooldownTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}