import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = signal('');
  password = signal('');

  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    this.error.set(null);
    this.loading.set(true);

    this.auth
      .login({ email: this.email(), password: this.password() })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigateByUrl('/'); // o donde quieras
        },
        error: (e) => {
          console.error(e);
          this.loading.set(false);
          this.error.set('Email o contraseña incorrectos');
        },
      });
  }
}
