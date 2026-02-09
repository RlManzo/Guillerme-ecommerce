import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopStore } from '../../shared/store/shop.store';
import { ToastService } from '../../shared/service/toast.service';

@Component({
  selector: 'app-producto-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto-modal.html',
})
export class ProductoModal {
  readonly store = inject(ShopStore);
  private readonly toast = inject(ToastService);

  // signal readonly desde el store
  readonly producto = this.store.selected;

  // ✅ media seleccionada (img o video)
  readonly selectedImg = signal<string>('');

  // ✅ lista de medias disponibles (img/video)
  readonly imagenes = computed(() => {
    const p = this.producto();
    if (!p) return [];

    const list = (p.imagenes ?? [p.img])
      .map((x: any) => String(x ?? '').trim())
      .filter(Boolean);

    return Array.from(new Set(list));
  });

  constructor() {
    effect(() => {
      const imgs = this.imagenes();
      this.selectedImg.set(imgs[0] ?? '');
    });
  }

  selectImg(url: string) {
    this.selectedImg.set(url);
  }

  onAgregar(): void {
    const p = this.producto();
    if (!p) return;
    this.store.addToCart(p);
    this.toast.success('Producto agregado al carrito');
  }

  onClose(): void {
    this.store.selectProducto(null);
  }

  splitInfo(text?: string | null): string[] {
    if (!text) return [];
    return text
      .split(/\r?\n|•|- /g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // ✅ fallback seguro
  readonly mainImg = computed(() => {
    const imgs = this.imagenes();
    return imgs[0] ?? '';
  });

  // ✅ media grande (selected o fallback)
  readonly bigImg = computed(() => this.selectedImg() || this.mainImg());

  private currentIndex(): number {
    const imgs = this.imagenes();
    if (!imgs.length) return -1;
    const cur = this.bigImg();
    const idx = imgs.indexOf(cur);
    return idx >= 0 ? idx : 0;
  }

  prevImg() {
    const imgs = this.imagenes();
    if (imgs.length <= 1) return;
    const idx = this.currentIndex();
    const next = (idx - 1 + imgs.length) % imgs.length;
    this.selectedImg.set(imgs[next]);
  }

  nextImg() {
    const imgs = this.imagenes();
    if (imgs.length <= 1) return;
    const idx = this.currentIndex();
    const next = (idx + 1) % imgs.length;
    this.selectedImg.set(imgs[next]);
  }

  // ✅ helper video
  private isVideoUrl(url?: string | null): boolean {
    const u = (url ?? '').toLowerCase().trim();
    return (
      u.endsWith('.mp4') ||
      u.endsWith('.webm') ||
      u.endsWith('.mov') ||
      u.endsWith('.m4v') ||
      u.includes('video')
    );
  }

  isVideo(url?: string | null) {
    return this.isVideoUrl(url);
  }
}
