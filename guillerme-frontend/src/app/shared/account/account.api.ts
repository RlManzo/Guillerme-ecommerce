import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type ProfileResponse = {
  email: string;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  direccion: string;
};

export type UpdateProfileRequest = {
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  direccion: string;
};

@Injectable({ providedIn: 'root' })
export class AccountApi {
  private readonly http = inject(HttpClient);

  getProfile() {
    return this.http.get<ProfileResponse>('/api/account/profile');
  }

  updateProfile(body: UpdateProfileRequest) {
    return this.http.put<ProfileResponse>('/api/account/profile', body);
  }
}