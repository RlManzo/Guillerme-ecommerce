import { Injectable, signal, computed } from '@angular/core';

export type CatKey = 'cat1' | 'cat2' | 'cat3' | 'polimero' | 'sublimable';

export interface Producto {
  id: number;
  nombre: string;
  img: string;
  info: string;
  infoModal: string;
  cat: string;
  categoria1: string;
  categoria2: string;
  detalle1: string;
  detalle2: string;

  categorias?: string[];
  keywords?: string[];
  stock?: number;
  precio?: number;

  imagenes?: string[];
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

  selectProducto(p: Producto | null) {
    this._selected.set(p);
  }

  // ✅ Agrega 1 respetando stock
  addToCart(p: Producto) {
    const cart = this._cart();
    const idx = cart.findIndex((x) => x.producto.id === p.id);

    const stock = p.stock ?? 0;
    if (stock <= 0) return; // sin stock

    if (idx >= 0) {
      const current = cart[idx].cantidad;
      if (current >= stock) return; // ya está en el máximo

      const copy = cart.slice();
      copy[idx] = { ...copy[idx], cantidad: current + 1 };
      this._cart.set(copy);
    } else {
      this._cart.set([...cart, { producto: p, cantidad: 1 }]);
    }
  }

  // ✅ suma qty en carrito (modal)
  incQty(productId: number) {
    const cart = this._cart();
    const idx = cart.findIndex((x) => x.producto.id === productId);
    if (idx < 0) return;

    const it = cart[idx];
    const stock = it.producto.stock ?? 0;
    if (stock <= 0 || it.cantidad >= stock) return;

    const copy = cart.slice();
    copy[idx] = { ...it, cantidad: it.cantidad + 1 };
    this._cart.set(copy);
  }

  // ✅ resta qty en carrito (si llega a 0, elimina)
  decQty(productId: number) {
    const cart = this._cart();
    const idx = cart.findIndex((x) => x.producto.id === productId);
    if (idx < 0) return;

    const it = cart[idx];
    if (it.cantidad <= 1) {
      this._cart.set(cart.filter((x) => x.producto.id !== productId));
      return;
    }

    const copy = cart.slice();
    copy[idx] = { ...it, cantidad: it.cantidad - 1 };
    this._cart.set(copy);
  }

  // ✅ helper para UI (deshabilitar "+")
  canInc(productId: number): boolean {
    const it = this._cart().find((x) => x.producto.id === productId);
    if (!it) return false;
    const stock = it.producto.stock ?? 0;
    return stock > 0 && it.cantidad < stock;
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
    this._cartOpen.update((v) => !v);
  }

  setCart(items: CartItem[]) {
    this._cart.set(items ?? []);
  }
}
