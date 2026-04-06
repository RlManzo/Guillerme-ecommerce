import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth/auth.service';
import {
  PROVINCIAS_ARGENTINA,
  getLocalidadesByProvincia,
  type LocalidadOption,
} from '../../shared/catalogs/argentina-locations.catalog';


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
  documento = signal('');

  countryCode = signal('+54');
  telefonoNumero = signal('');

  provincia = signal('');
  localidad = signal('');
  otraLocalidad = signal('');
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

  readonly provincias = PROVINCIAS_ARGENTINA;

readonly localidadesDisponibles = computed(() => {
  return getLocalidadesByProvincia(this.provincia().trim());
});

  private nameRx = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/;
  private phoneRx = /^[0-9]{6,15}$/;
  private documentoRx = /^[0-9]{7,12}$/;
  private emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  private passRx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  

  readonly isOtraLocalidad = computed(() => this.localidad() === 'Otra');

  vNombre = computed(() =>
    this.nombre().trim().length > 0 && this.nameRx.test(this.nombre().trim())
  );

  vApellido = computed(() =>
    this.apellido().trim().length > 0 && this.nameRx.test(this.apellido().trim())
  );

  vDocumento = computed(() =>
    this.documentoRx.test(this.documento().trim())
  );

  vTelefono = computed(() =>
    this.phoneRx.test(this.telefonoNumero().trim())
  );

  vProvincia = computed(() => !!this.provincia().trim());

  vLocalidad = computed(() => {
    if (!this.localidad().trim()) return false;
    if (this.isOtraLocalidad()) {
      return this.otraLocalidad().trim().length >= 2;
    }
    return true;
  });

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
    this.vDocumento() &&
    this.vTelefono() &&
    this.vProvincia() &&
    this.vLocalidad() &&
    this.vDireccion() &&
    this.vEmail() &&
    this.vPassword() &&
    this.vConfirmPassword()
  );

  showErr(ok: boolean) {
    return this.submitted() && !ok;
  }

  onDocumentoChange(v: string) {
    const onlyDigits = String(v ?? '').replace(/\D/g, '');
    this.documento.set(onlyDigits);
  }

  onTelefonoNumeroChange(v: string) {
    const onlyDigits = String(v ?? '').replace(/\D/g, '');
    this.telefonoNumero.set(onlyDigits);
  }

  onProvinciaChange(v: string) {
    this.provincia.set(v);
    this.localidad.set('');
    this.otraLocalidad.set('');
  }

  onLocalidadChange(v: string) {
    this.localidad.set(v);
    if (v !== 'Otra') {
      this.otraLocalidad.set('');
    }
  }

  private buildLocalidadFinal(): string {
    return this.isOtraLocalidad()
      ? this.otraLocalidad().trim()
      : this.localidad().trim();
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
    const localidadFinal = this.buildLocalidadFinal();

    const direccion = [
      this.provincia().trim(),
      localidadFinal,
      this.direccionLinea().trim(),
    ]
      .filter(Boolean)
      .join(' - ');

    this.auth
      .register({
        nombre: this.nombre().trim(),
        apellido: this.apellido().trim(),
        documento: this.documento().trim(),
        telefono,
        direccion,
        email: this.email().trim(),
        password: this.password(),
      } as any)
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