import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service'; // ajustá la ruta según tu proyecto

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
  stock?: number;   // puede venir undefined
  precio?: number;

  imagenes?: string[];
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class ShopStore {
  private readonly auth = inject(AuthService);

  // UI: carrito modal abierto/cerrado
  private readonly _cartOpen = signal(false);
  readonly cartOpen = this._cartOpen.asReadonly();

  // carrito
  private readonly _cart = signal<CartItem[]>([]);
  readonly cart = this._cart.asReadonly();

  readonly cartCount = computed(() =>
    this._cart().reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0)
  );

  // producto seleccionado para modal
  private readonly _selected = signal<Producto | null>(null);
  readonly selected = this._selected.asReadonly();

  // Para detectar cambio de "guest" -> "email"
  private readonly _currentKey = signal<string>(this.keyForEmail(this.auth.email()));

  constructor() {
    // 1) Carga inicial desde storage según usuario actual (guest o email)
    this._cart.set(this.readCart(this._currentKey()));

    // 2) Cuando cambia el usuario (email), migramos guest -> user y cargamos el cart correcto
    effect(() => {
      const email = this.auth.email(); // signal computed del AuthService
      const nextKey = this.keyForEmail(email);
      const prevKey = this._currentKey();

      if (nextKey === prevKey) return;

      // Caso: guest -> user (logueo)
      if (prevKey === this.keyForEmail(null) && nextKey !== prevKey) {
        const guest = this.readCart(prevKey);
        const user = this.readCart(nextKey);

        // Migración: si el user está vacío, copiamos todo el guest.
        // Si no está vacío, mergeamos (sumamos cantidades por producto).
        const merged = this.mergeCarts(user, guest);

        this.writeCart(nextKey, merged);

        // Opcional: borrar el guest una vez migrado
        // localStorage.removeItem(prevKey);

        this._cart.set(merged);
      } else {
        // Caso: user -> guest (logout) o cambio de usuario
        const loaded = this.readCart(nextKey);
        this._cart.set(loaded);
      }

      this._currentKey.set(nextKey);
    });

    // 3) Persistencia: cada cambio del carrito se guarda en la key actual
    effect(() => {
      const key = this._currentKey();
      const cart = this._cart();
      this.writeCart(key, cart);
    });
  }

  // -------------------------
  // Keys & storage helpers
  // -------------------------
  private keyForEmail(email: string | null): string {
    const e = (email ?? '').trim().toLowerCase();
    return e ? `cart:${e}` : 'cart:guest';
  }

  private readCart(key: string): CartItem[] {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeCart(key: string, cart: CartItem[]) {
    try {
      localStorage.setItem(key, JSON.stringify(cart ?? []));
    } catch {
      // no romper si falla storage
    }
  }

  private stockLimit(p: Producto): number {
    return p.stock == null ? Number.POSITIVE_INFINITY : Number(p.stock);
  }

  private mergeCarts(base: CartItem[], incoming: CartItem[]): CartItem[] {
    if (!incoming?.length) return base ?? [];
    if (!base?.length) return incoming ?? [];

    const map = new Map<number, CartItem>();
    for (const it of base) {
      map.set(it.producto.id, { ...it, cantidad: Number(it.cantidad) || 0 });
    }

    for (const it of incoming) {
      const id = it.producto.id;
      const addQty = Number(it.cantidad) || 0;
      const prev = map.get(id);

      if (!prev) {
        map.set(id, { ...it, cantidad: addQty });
      } else {
        // respeta stock si existe
        const stock = this.stockLimit(prev.producto);
        const nextQty = Math.min(stock, (Number(prev.cantidad) || 0) + addQty);
        map.set(id, { ...prev, cantidad: nextQty });
      }
    }

    return Array.from(map.values()).filter(x => (Number(x.cantidad) || 0) > 0);
  }

  // -------------------------
  // Producto seleccionado
  // -------------------------
  selectProducto(p: Producto | null) {
    this._selected.set(p);
  }

  // -------------------------
  // Carrito ops
  // -------------------------
  addToCart(p: Producto) {
    const cart = this._cart();
    const idx = cart.findIndex((x) => x.producto.id === p.id);

    const stock = this.stockLimit(p);
    if (stock <= 0) return;

    if (idx >= 0) {
      const current = Number(cart[idx].cantidad) || 0;
      if (current >= stock) return;

      const copy = cart.slice();
      copy[idx] = { ...copy[idx], cantidad: current + 1 };
      this._cart.set(copy);
    } else {
      this._cart.set([...cart, { producto: p, cantidad: 1 }]);
    }
  }

  incQty(productId: number) {
    const cart = this._cart();
    const idx = cart.findIndex((x) => x.producto.id === productId);
    if (idx < 0) return;

    const it = cart[idx];
    const stock = this.stockLimit(it.producto);
    const qty = Number(it.cantidad) || 0;

    if (stock <= 0 || qty >= stock) return;

    const copy = cart.slice();
    copy[idx] = { ...it, cantidad: qty + 1 };
    this._cart.set(copy);
  }

  decQty(productId: number) {
    const cart = this._cart();
    const idx = cart.findIndex((x) => x.producto.id === productId);
    if (idx < 0) return;

    const it = cart[idx];
    const qty = Number(it.cantidad) || 0;

    if (qty <= 1) {
      this._cart.set(cart.filter((x) => x.producto.id !== productId));
      return;
    }

    const copy = cart.slice();
    copy[idx] = { ...it, cantidad: qty - 1 };
    this._cart.set(copy);
  }

  canInc(productId: number): boolean {
    const it = this._cart().find((x) => x.producto.id === productId);
    if (!it) return false;
    const stock = this.stockLimit(it.producto);
    const qty = Number(it.cantidad) || 0;
    return stock > 0 && qty < stock;
  }

  removeFromCart(productId: number) {
    this._cart.set(this._cart().filter((x) => x.producto.id !== productId));
  }

  clearCart() {
    this._cart.set([]);
    try {
      localStorage.removeItem(this._currentKey());
    } catch {}
  }

  setCart(items: CartItem[]) {
    this._cart.set(items ?? []);
  }

  // -------------------------
  // UI carrito
  // -------------------------
  openCart() { this._cartOpen.set(true); }
  closeCart() { this._cartOpen.set(false); }
  toggleCart() { this._cartOpen.update(v => !v); }
}
