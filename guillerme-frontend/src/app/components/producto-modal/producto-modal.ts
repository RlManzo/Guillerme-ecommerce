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
    // para que no quede "pegado" el producto en el modal
    this.store.selectProducto(null as unknown as Producto);
   
  }
}
