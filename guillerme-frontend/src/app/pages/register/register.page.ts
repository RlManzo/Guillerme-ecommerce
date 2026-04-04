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

  // ahora este select representa país / prefijo internacional
  countryCode = signal('+54');
  telefonoNumero = signal('');

  provincia = signal('');
  direccionLinea = signal('');

  email = signal('');
  password = signal('');
  confirmPassword = signal('');

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  loading = signal(false);
  error = signal<string | null>(null);

  submitted = signal(false);

  readonly countryCodes = [
    { label: 'Arg (+54)', value: '+54' },
    { label: 'Uru (+598)', value: '+598' },
    { label: 'Chi (+56)', value: '+56' },
    { label: 'Par (+595)', value: '+595' },
    { label: 'Bol (+591)', value: '+591' },
    { label: 'Bras (+55)', value: '+55' },
    { label: 'Per (+51)', value: '+51' },
    { label: 'Col (+57)', value: '+57' },
    { label: 'Méx (+52)', value: '+52' },
    { label: 'Esp (+34)', value: '+34' },
    { label: 'Usa (+1)', value: '+1' },
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

  // ahora permitimos escribir área + número en el mismo input
  // se validan solo dígitos, entre 6 y 15
  private phoneRx = /^[0-9]{6,15}$/;

  private emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  private passRx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  vNombre = computed(() =>
    this.nombre().trim().length > 0 && this.nameRx.test(this.nombre().trim())
  );

  vApellido = computed(() =>
    this.apellido().trim().length > 0 && this.nameRx.test(this.apellido().trim())
  );

  vTelefono = computed(() =>
    this.phoneRx.test(this.telefonoNumero().trim())
  );

  vProvincia = computed(() => !!this.provincia().trim());

  vDireccion = computed(() =>
    this.direccionLinea().trim().length >= 6
  );

  vEmail = computed(() =>
    this.emailRx.test(this.email().trim())
  );

  vPassword = computed(() =>
    this.passRx.test(this.password())
  );

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
    // permitimos que escriba área + número, pero guardamos solo dígitos
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

    const telefono = `${this.countryCode()} ${this.telefonoNumero().trim()}`.trim();
    const direccion = `${this.provincia().trim()} - ${this.direccionLinea().trim()}`.trim();

    this.auth
      .register({
        nombre: this.nombre().trim(),
        apellido: this.apellido().trim(),
        telefono,
        direccion,
        email: this.email().trim(),
        password: this.password(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/login'], {
            state: {
              successMessage:
                '¡Te registraste exitosamente! Revisá tu email para validar tu cuenta y comenzar a comprar.',
            },
          });
        },
        error: (e) => {
          console.error(e);
          this.loading.set(false);
          this.error.set(e.error?.message || 'No se pudo registrar');
        },
      });
  }
}