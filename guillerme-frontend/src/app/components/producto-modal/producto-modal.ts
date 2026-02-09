import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopStore } from '../../shared/store/shop.store';
import { Producto } from '../../shared/store/shop.store';

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
    .split(/\r?\n|•|- /g)     // separa por saltos, bullets o “- ”
    .map(s => s.trim())
    .filter(Boolean);
}



}
