import { Injectable, inject, effect } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ShopStore } from '../store/shop.store';

@Injectable({ providedIn: 'root' })
export class CartPersistenceService {
  private readonly auth = inject(AuthService);
  private readonly store = inject(ShopStore);

  constructor() {
    // 1) cargar carrito al iniciar o cambiar de usuario
    effect(() => {
      const key = this.key();
      const cart = this.read(key);
      this.store.setCart(cart); // vamos a agregar este método
    });

    // 2) persistir cada cambio de carrito
    effect(() => {
      const key = this.key();
      const cart = this.store.cart(); // signal
      this.write(key, cart);
    });
  }

  private key() {
    const email = this.auth.email();
    return email ? `cart:${email}` : 'cart:guest';
  }

  private read(key: string) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private write(key: string, cart: any) {
    try {
      localStorage.setItem(key, JSON.stringify(cart));
    } catch {}
  }
}
