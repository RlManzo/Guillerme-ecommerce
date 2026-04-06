import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AccountApi } from '../../shared/account/account.api';

@Component({
  standalone: true,
  selector: 'app-profile-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage {
  private readonly accountApi = inject(AccountApi);

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  submitted = signal(false);

  email = signal('');

  nombre = signal('');
  apellido = signal('');
  documento = signal('');
  telefono = signal('');
  direccion = signal('');

  private nameRx = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/;
  private documentoRx = /^[0-9]{7,12}$/;
  private phoneRx = /^[0-9+\s()-]{6,25}$/;

  vNombre = computed(() =>
    this.nombre().trim().length > 0 && this.nameRx.test(this.nombre().trim())
  );

  vApellido = computed(() =>
    this.apellido().trim().length > 0 && this.nameRx.test(this.apellido().trim())
  );

  vDocumento = computed(() => {
  const d = this.documento().trim();
  if (!d) return true; // ahora es opcional
  return this.documentoRx.test(d);
});

  vTelefono = computed(() =>
    this.phoneRx.test(this.telefono().trim())
  );

  vDireccion = computed(() =>
    this.direccion().trim().length >= 6
  );

  formValid = computed(() =>
    this.vNombre() &&
    this.vApellido() &&
    this.vDocumento() &&
    this.vTelefono() &&
    this.vDireccion()
  );

  constructor() {
    this.loadProfile();
  }

  showErr(ok: boolean) {
    return this.submitted() && !ok;
  }

  onDocumentoChange(v: string) {
    const onlyDigits = String(v ?? '').replace(/\D/g, '');
    this.documento.set(onlyDigits);
  }

  loadProfile() {
    this.loading.set(true);
    this.error.set(null);

    this.accountApi.getProfile().subscribe({
      next: (res) => {
        this.loading.set(false);

        this.email.set(res.email ?? '');
        this.nombre.set(res.nombre ?? '');
        this.apellido.set(res.apellido ?? '');
        this.documento.set(res.documento ?? '');
        this.telefono.set(res.telefono ?? '');
        this.direccion.set(res.direccion ?? '');
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
        this.loading.set(false);
        this.error.set(e.error?.message || 'No se pudo cargar el perfil');
      },
    });
  }

  submit() {
    this.submitted.set(true);
    this.error.set(null);
    this.success.set(null);

    if (!this.formValid()) {
      this.error.set('Revisá los campos marcados');
      return;
    }

    this.saving.set(true);

    this.accountApi.updateProfile({
      nombre: this.nombre().trim(),
      apellido: this.apellido().trim(),
      documento: this.documento().trim(),
      telefono: this.telefono().trim(),
      direccion: this.direccion().trim(),
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.success.set('Tus datos fueron actualizados correctamente.');

        this.email.set(res.email ?? '');
        this.nombre.set(res.nombre ?? '');
        this.apellido.set(res.apellido ?? '');
        this.documento.set(res.documento ?? '');
        this.telefono.set(res.telefono ?? '');
        this.direccion.set(res.direccion ?? '');
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
        this.saving.set(false);
        this.error.set(e.error?.message || 'No se pudo actualizar el perfil');
      },
    });
  }
}