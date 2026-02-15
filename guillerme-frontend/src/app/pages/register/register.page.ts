import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-register-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  nombre = signal('');
  apellido = signal('');

  areaCode = signal('+54 11');
  telefonoNumero = signal('');

  provincia = signal('');
  direccionLinea = signal('');

  email = signal('');
  password = signal('');
  confirmPassword = signal(''); // ✅ nuevo

  // ✅ ver/ocultar
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  loading = signal(false);
  error = signal<string | null>(null);

  submitted = signal(false);

  readonly areaCodes = [
    '+54 11', '+54 221', '+54 261', '+54 341', '+54 351',
    '+54 381', '+54 387', '+54 376', '+54 299',
  ];

  readonly provincias = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
    'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
    'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
    'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
    'Tierra del Fuego', 'Tucumán',
  ];

  // -------------------------
  // Validadores
  // -------------------------
  private nameRx = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/;
  private phoneRx = /^[0-9]{6,15}$/;
  private emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  private passRx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  vNombre = computed(() => this.nombre().trim().length > 0 && this.nameRx.test(this.nombre().trim()));
  vApellido = computed(() => this.apellido().trim().length > 0 && this.nameRx.test(this.apellido().trim()));

  vTelefono = computed(() => this.phoneRx.test(this.telefonoNumero().trim()));
  vProvincia = computed(() => !!this.provincia().trim());
  vDireccion = computed(() => this.direccionLinea().trim().length >= 3);

  vEmail = computed(() => this.emailRx.test(this.email().trim()));
  vPassword = computed(() => this.passRx.test(this.password()));

  // ✅ confirmación (solo tiene sentido si password tiene algo)
  vConfirmPassword = computed(() => {
    const p = this.password();
    const c = this.confirmPassword();
    if (!c) return false;
    return p === c;
  });

  formValid = computed(() =>
    this.vNombre() &&
    this.vApellido() &&
    this.vTelefono() &&
    this.vProvincia() &&
    this.vDireccion() &&
    this.vEmail() &&
    this.vPassword() &&
    this.vConfirmPassword()
  );

  showErr(ok: boolean) {
    return this.submitted() && !ok;
  }

  onTelefonoNumeroChange(v: string) {
    const onlyDigits = String(v ?? '').replace(/\D/g, '');
    this.telefonoNumero.set(onlyDigits);
  }

  submit() {
    this.submitted.set(true);
    this.error.set(null);

    if (!this.formValid()) {
      this.error.set('Revisá los campos marcados');
      return;
    }

    this.loading.set(true);

    const telefono = `${this.areaCode()} ${this.telefonoNumero().trim()}`.trim();
    const direccion = `${this.provincia().trim()} - ${this.direccionLinea().trim()}`.trim();

    this.auth
      .register({
        nombre: this.nombre().trim(),
        apellido: this.apellido().trim(),
        telefono,
        direccion,
        email: this.email().trim(),
        password: this.password(), // ✅ igual que antes
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigateByUrl('/');
        },
        error: (e) => {
          console.error(e);
          this.loading.set(false);
          this.error.set('No se pudo registrar (email ya existe o datos inválidos)');
        },
      });
  }
}
