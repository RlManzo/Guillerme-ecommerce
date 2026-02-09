import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopStore } from '../../shared/store/shop.store';

@Component({
  selector: 'app-producto-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto-modal.html',
})
export class ProductoModal {
  readonly store = inject(ShopStore);

  // signal readonly desde el store
  readonly producto = this.store.selected;

  // ✅ imagen seleccionada (la grande)
  readonly selectedImg = signal<string>('');

  // ✅ lista de imágenes disponibles (1..3)
    readonly imagenes = computed(() => {
    const p: any = this.producto();
    if (!p) return [];

    const list = [
      ...(Array.isArray(p.imagenes) ? p.imagenes : []),
      p.imgUrl,
      p.imgUrl2,
      p.imgUrl3,
      p.img,
    ]
      .map((x: any) => String(x ?? '').trim())
      .filter(Boolean);

    return Array.from(new Set(list));
  });

  constructor() {
    // ✅ cuando cambia el producto, seteo por default la primera imagen
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

    // ✅ imagen principal (fallback seguro para el template)
  readonly mainImg = computed(() => {
    const imgs = this.imagenes();
    return imgs[0] ?? '';
  });

  // ✅ src real de la imagen grande (selected o fallback)
  readonly bigImg = computed(() => this.selectedImg() || this.mainImg());

}
