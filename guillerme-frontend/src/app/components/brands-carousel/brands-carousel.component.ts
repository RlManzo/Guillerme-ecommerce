import { CommonModule } from '@angular/common';
import { Component, Input, signal, computed, OnInit, OnDestroy } from '@angular/core';

export type Brand = {
  name: string;
  logoUrl: string;
  link?: string;
};

@Component({
  selector: 'app-brands-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './brands-carousel.component.html',
  styleUrl: './brands-carousel.component.scss',
})
export class BrandsCarouselComponent implements OnInit, OnDestroy {
  @Input() title = 'Marcas con las que trabajamos';
  @Input() brands: Brand[] = [];

  /** ms entre cambios */
  @Input() autoplayMs = 3000;

  /** pausa cuando el mouse está encima */
  @Input() pauseOnHover = true;

  // cuántas marcas se ven a la vez
@Input() perView = 3;

// cuánto avanza por transición (1 = suave, 3 = por página)
@Input() step = 1;

  readonly index = signal(0);
  readonly paused = signal(false);

  private timerId: number | null = null;

  readonly safeBrands = computed(() => this.brands ?? []);
  readonly count = computed(() => this.safeBrands().length);

  visible = computed(() => {
  const list = this.safeBrands();
  const n = list.length;
  if (!n) return [];

  const start = this.index() % n;
  const k = Math.min(this.perView, n);

  const out = [];
  for (let j = 0; j < k; j++) {
    out.push(list[(start + j) % n]);
  }
  return out;
});


  ngOnInit() {
    this.startAutoplay();
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  startAutoplay() {
    this.stopAutoplay();

    const n = this.count();
    if (n <= 1) return; // nada para rotar

    this.timerId = window.setInterval(() => {
      if (this.pauseOnHover && this.paused()) return;
      this.next();
    }, Math.max(800, this.autoplayMs));
  }

  stopAutoplay() {
    if (this.timerId != null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  onMouseEnter() {
    if (this.pauseOnHover) this.paused.set(true);
  }

  onMouseLeave() {
    if (this.pauseOnHover) this.paused.set(false);
  }

  prev() {
  const n = this.count();
  if (!n) return;
  const s = Math.min(this.step, n);
  this.index.update((i) => (i - s + n) % n);
}

  next() {
  const n = this.count();
  if (!n) return;
  const s = Math.min(this.step, n);
  this.index.update((i) => (i + s) % n);
}

  goTo(i: number) {
    const n = this.count();
    if (!n) return;
    this.index.set(((i % n) + n) % n);
  }

  isActiveDot(i: number) {
    return i === (this.index() % Math.max(this.count(), 1));
  }
}
