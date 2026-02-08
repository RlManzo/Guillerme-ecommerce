import { Injectable, signal, computed } from '@angular/core';

export type CatKey = 'cat1' | 'cat2' | 'cat3' | 'polimero' | 'sublimable';

export interface Producto {
  id: number;
  nombre: string;
  img: string;
  info: string;
  infoModal: string;
  cat: string; // tus "cat1/cat2/cat3"
  categoria1: string;
  categoria2: string;
  detalle1: string;
  detalle2: string;
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class ShopStore {
  // carrito
  private readonly _cart = signal<CartItem[]>([]);
  readonly cart = this._cart.asReadonly();

  readonly cartCount = computed(() =>
    this._cart().reduce((acc, it) => acc + it.cantidad, 0)
  );

  // producto seleccionado para modal
  private readonly _selected = signal<Producto | null>(null);
  readonly selected = this._selected.asReadonly();

  selectProducto(p: Producto) {
    this._selected.set(p);
  }

  addToCart(p: Producto) {
    const cart = this._cart();
    const idx = cart.findIndex((x) => x.producto.id === p.id);
    if (idx >= 0) {
      const copy = cart.slice();
      copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + 1 };
      this._cart.set(copy);
    } else {
      this._cart.set([...cart, { producto: p, cantidad: 1 }]);
    }
  }

  removeFromCart(productId: number) {
    this._cart.set(this._cart().filter((x) => x.producto.id !== productId));
  }

  clearCart() {
    this._cart.set([]);
  }

    // UI: carrito modal abierto/cerrado
  private readonly _cartOpen = signal(false);
  readonly cartOpen = this._cartOpen.asReadonly();

  openCart() {
    this._cartOpen.set(true);
  }

  closeCart() {
    this._cartOpen.set(false);
  }

  toggleCart() {
    this._cartOpen.update(v => !v);
  }

    setCart(items: CartItem[]) {
    this._cart.set(items ?? []);
  }
}
