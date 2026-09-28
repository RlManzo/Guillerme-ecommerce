import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type HomeBannerType = 'CAROUSEL' | 'POPUP';

export interface HomeBannerDto {
  id: number;
  imageUrl: string;
  altText?: string | null;
  bannerType: HomeBannerType;
  targetUrl?: string | null;
  sortOrder: number;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class BannerApi {
  private readonly http = inject(HttpClient);

  listPublic() {
    return this.http.get<HomeBannerDto[]>('/api/banners');
  }

  getPopup() {
    return this.http.get<HomeBannerDto | null>('/api/banners/popup');
  }
}
