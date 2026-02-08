import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

type ServicioKey = 'filgo1' | 'filgo2' | 'filgo3' | 'filgo4';

interface ServicioItem {
  key: ServicioKey;
  label: string;
  icon: string;  
  banner: string; 
  alt: string;
}

@Component({
  selector: 'app-carousel-servicios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel-servicios.html',
  styleUrl: './carousel-servicios.scss',
})
export class CarouselServicios implements OnInit, OnDestroy {
  readonly items: ServicioItem[] = [
    {
      key: 'filgo1',
      label: 'filgo_1',
      icon: 'assets/carousel/vinilos.png',
      banner: 'assets/carousel/banners/banner_lanzamientos_TNTMarker.jpg',
      alt: 'vinilos',
    },
    {
      key: 'filgo2',
      label: 'filgo_2',
      icon: 'assets/carousel/sublimacion.png',
      banner: 'assets/carousel/banners/banner_lanzamientos_MultilighterFIT.jpg',
      alt: 'sublimacion',
    },
    {
      key: 'filgo3',
      label: 'filgo_3',
      icon: 'assets/carousel/DTF.png',
      banner: 'assets/carousel/banners/banner_lanzamientos_Alloy.jpg',
      alt: 'DTF',
    },
    {
      key: 'filgo4',
      label: 'filgo_4',
      icon: 'assets/carousel/serigrafia.png',
      banner: 'assets/carousel/banners/banner_lanzamientos_Portaminas.jpg',
      alt: 'serigrafia',
    },
  ];

  activeIndex = 0;

  private intervalId: any;

  ngOnInit(): void {
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  setActive(index: number): void {
    if (index === this.activeIndex) return;
    this.activeIndex = index;
  }

  startCarousel(): void {
    this.stopCarousel();
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

  // Opcional: si querés que al pasar el mouse se pause
  onMouseEnter(): void {
    this.stopCarousel();
  }

  onMouseLeave(): void {
    this.startCarousel();
  }
}
