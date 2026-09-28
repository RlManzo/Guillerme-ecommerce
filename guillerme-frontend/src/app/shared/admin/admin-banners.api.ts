import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HomeBannerDto, HomeBannerType } from '../banners/banner.api';

export interface BannerRequest {
  imageUrl: string;
  altText?: string | null;
  bannerType?: HomeBannerType;
  targetUrl?: string | null;
  sortOrder?: number;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminBannersApi {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<HomeBannerDto[]>('/api/admin/banners');
  }

  create(body: BannerRequest) {
    return this.http.post<HomeBannerDto>('/api/admin/banners', body);
  }

  update(id: number, body: BannerRequest) {
    return this.http.put<HomeBannerDto>(`/api/admin/banners/${id}`, body);
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/admin/banners/${id}`);
  }

  reorder(ids: number[]) {
    return this.http.put<void>('/api/admin/banners/order', { ids });
  }

  uploadImage(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string; filename: string }>(
      '/api/admin/banners/image',
      form
    );
  }
}
