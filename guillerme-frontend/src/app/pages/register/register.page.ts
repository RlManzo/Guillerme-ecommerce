import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-register-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.page.html',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  nombre = signal('');
  apellido = signal('');
  telefono = signal('');
  direccion = signal('');
  email = signal('');
  password = signal('');

  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    this.error.set(null);
    this.loading.set(true);

    this.auth
      .register({
        nombre: this.nombre(),
        apellido: this.apellido(),
        telefono: this.telefono(),
        direccion: this.direccion(),
        email: this.email(),
        password: this.password(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigateByUrl('/'); // o a /productos
        },
        error: (e) => {
          console.error(e);
          this.loading.set(false);
          this.error.set('No se pudo registrar (email ya existe o datos inválidos)');
        },
      });
  }
}
