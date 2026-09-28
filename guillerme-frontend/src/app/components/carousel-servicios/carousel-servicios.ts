import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { BannerApi, HomeBannerDto } from '../../shared/banners/banner.api';

@Component({
  selector: 'app-carousel-servicios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel-servicios.html',
  styleUrl: './carousel-servicios.scss',
})
export class CarouselServicios implements OnInit, OnDestroy {
  private readonly bannerApi = inject(BannerApi);

  items: HomeBannerDto[] = [];
  activeIndex = 0;
  loading = true;

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private touchStartX = 0;
  private touchEndX = 0;
  private readonly minSwipeDistance = 50;

  ngOnInit(): void {
    this.bannerApi.listPublic().subscribe({
      next: (items) => {
        this.items = items ?? [];
        this.activeIndex = 0;
        this.loading = false;
        this.startCarousel();
      },
      error: (error) => {
        console.error('No se pudieron cargar los banners', error);
        this.items = [];
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  next(): void {
    if (this.items.length <= 1) return;
    this.activeIndex = (this.activeIndex + 1) % this.items.length;
    this.resetTimer();
  }

  prev(): void {
    if (this.items.length <= 1) return;
    this.activeIndex = (this.activeIndex - 1 + this.items.length) % this.items.length;
    this.resetTimer();
  }

  goTo(index: number): void {
    if (index === this.activeIndex || index < 0 || index >= this.items.length) return;
    this.activeIndex = index;
    this.resetTimer();
  }

  startCarousel(): void {
    this.stopCarousel();
    if (this.items.length <= 1) return;

    this.intervalId = setInterval(() => {
      this.activeIndex = (this.activeIndex + 1) % this.items.length;
    }, 8000);
  }

  stopCarousel(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onMouseEnter(): void {
    this.stopCarousel();
  }

  onMouseLeave(): void {
    this.startCarousel();
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchEndX = this.touchStartX;
  }

  onTouchMove(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
  }

  onTouchEnd(): void {
    if (this.items.length <= 1) return;

    const distance = this.touchStartX - this.touchEndX;
    if (Math.abs(distance) < this.minSwipeDistance) return;

    distance > 0 ? this.next() : this.prev();
  }

  private resetTimer(): void {
    this.startCarousel();
  }
}
