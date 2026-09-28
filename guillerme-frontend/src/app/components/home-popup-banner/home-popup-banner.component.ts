import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BannerApi, HomeBannerDto } from '../../shared/banners/banner.api';

@Component({
  selector: 'app-home-popup-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-popup-banner.component.html',
  styleUrl: './home-popup-banner.component.scss',
})
export class HomePopupBannerComponent implements OnInit {
  private readonly api = inject(BannerApi);
  private readonly router = inject(Router);
  private readonly storageKey = 'guillerme-home-popup-seen';

  readonly banner = signal<HomeBannerDto | null>(null);
  readonly visible = signal(false);

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (sessionStorage.getItem(this.storageKey) === '1') return;

    this.api.getPopup().subscribe({
      next: (banner) => {
        if (!banner?.active) return;
        this.banner.set(banner);
        window.setTimeout(() => this.visible.set(true), 250);
      },
      error: (error) => {
        console.error('No se pudo cargar el popup del home', error);
      },
    });
  }

  close(): void {
    this.visible.set(false);
    this.markAsSeen();
  }

  goToTarget(): void {
    const target = this.banner()?.targetUrl?.trim();
    if (!target) return;

    this.markAsSeen();
    this.visible.set(false);

    if (target.startsWith('/')) {
      void this.router.navigateByUrl(target);
      return;
    }

    window.location.href = target;
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  private markAsSeen(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.storageKey, '1');
    }
  }
}
