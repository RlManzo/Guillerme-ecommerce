import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminBannersApi } from '../../shared/admin/admin-banners.api';
import { HomeBannerDto, HomeBannerType } from '../../shared/banners/banner.api';

@Component({
  standalone: true,
  selector: 'app-admin-banners-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-banners.page.html',
  styleUrl: './admin-banners.page.scss',
})
export class AdminBannersPage {
  private readonly api = inject(AdminBannersApi);

  readonly banners = signal<HomeBannerDto[]>([]);
  readonly carouselBanners = computed(() =>
    this.banners().filter((banner) => banner.bannerType === 'CAROUSEL')
  );
  readonly popupBanners = computed(() =>
    this.banners().filter((banner) => banner.bannerType === 'POPUP')
  );

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  altText = '';
  bannerType: HomeBannerType = 'CAROUSEL';
  targetUrl = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (items) => this.banners.set(items ?? []),
      error: (e) => {
        console.error(e);
        this.error.set('No se pudieron cargar los banners.');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;

    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = file ? URL.createObjectURL(file) : null;
  }

  addBanner(): void {
    if (!this.selectedFile || this.saving()) return;

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    this.api.uploadImage(this.selectedFile).subscribe({
      next: (upload) => {
        this.api.create({
          imageUrl: upload.url,
          altText: this.altText.trim() || null,
          bannerType: this.bannerType,
          targetUrl: this.targetUrl.trim() || null,
          active: true,
        }).pipe(finalize(() => this.saving.set(false))).subscribe({
          next: () => {
            const typeLabel = this.bannerType === 'POPUP' ? 'Popup' : 'Banner';
            this.resetForm();
            this.success.set(`${typeLabel} agregado correctamente.`);
            this.load();
          },
          error: (e) => {
            console.error(e);
            this.error.set('La imagen se subió, pero no se pudo guardar el banner.');
          },
        });
      },
      error: (e) => {
        console.error(e);
        this.saving.set(false);
        this.error.set('No se pudo subir la imagen.');
      },
    });
  }

  toggleActive(banner: HomeBannerDto): void {
    this.api.update(banner.id, {
      imageUrl: banner.imageUrl,
      altText: banner.altText,
      bannerType: banner.bannerType,
      targetUrl: banner.targetUrl,
      sortOrder: banner.sortOrder,
      active: !banner.active,
    }).subscribe({
      next: () => this.load(),
      error: (e) => {
        console.error(e);
        this.error.set('No se pudo cambiar el estado del banner.');
      },
    });
  }

  moveCarousel(index: number, direction: -1 | 1): void {
    const nextIndex = index + direction;
    const current = [...this.carouselBanners()];
    if (nextIndex < 0 || nextIndex >= current.length) return;

    [current[index], current[nextIndex]] = [current[nextIndex], current[index]];

    this.api.reorder(current.map((banner) => banner.id)).subscribe({
      next: () => this.load(),
      error: (e) => {
        console.error(e);
        this.error.set('No se pudo cambiar el orden.');
        this.load();
      },
    });
  }

  deleteBanner(banner: HomeBannerDto): void {
    const label = banner.bannerType === 'POPUP' ? 'popup' : 'banner del carrusel';
    if (!confirm(`¿Eliminar este ${label}?`)) return;

    this.api.delete(banner.id).subscribe({
      next: () => {
        this.success.set('Banner eliminado.');
        this.load();
      },
      error: (e) => {
        console.error(e);
        this.error.set('No se pudo eliminar el banner.');
      },
    });
  }

  private resetForm(): void {
    this.altText = '';
    this.bannerType = 'CAROUSEL';
    this.targetUrl = '';
    this.selectedFile = null;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }
}
