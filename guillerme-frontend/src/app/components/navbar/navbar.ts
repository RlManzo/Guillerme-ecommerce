import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { Header } from '../header/header';

import { ShopStore } from '../../shared/store/shop.store';
import { AuthService } from '../../shared/auth/auth.service';

import {
  ProductsFilterStateService,
  ProductsCategory,
} from '../../shared/products-filter-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink, Header],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  readonly store = inject(ShopStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly productsFilterState = inject(ProductsFilterStateService);

  readonly menuOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly productsOpen = signal(false);

  // signals del AuthService
  isLogged = this.auth.isLogged;
  email = this.auth.email;
  isAdmin = this.auth.isAdmin;

  // =======================
  // NAV & MENÚ PRINCIPAL
  // =======================

  toggleMenu() {
    this.menuOpen.update(v => !v);
    if (!this.menuOpen()) {
      this.productsOpen.set(false);
    }
  }

  closeMenu() {
    this.menuOpen.set(false);
    this.productsOpen.set(false);
  }

  openCart() {
    this.store.openCart();
  }

  // =======================
  // MENÚ USUARIO
  // =======================

  toggleUserMenu() {
    this.userMenuOpen.update(v => !v);
  }

  closeUserMenu() {
    this.userMenuOpen.set(false);
  }

  logout() {
    this.auth.logout();
    this.closeUserMenu();
    this.closeMenu();
    this.router.navigateByUrl('/');
  }

  goOrders() {
    this.closeUserMenu();
    this.closeMenu();

    const role = (this.auth.session()?.role ?? '').toUpperCase();
    const target = role === 'ADMIN' ? '/admin/orders' : '/orders';

    this.router.navigateByUrl(target);
  }

  goAdminProducts() {
    this.closeUserMenu();
    this.closeMenu();
    this.router.navigateByUrl('/admin/products');
  }

  // =======================
  // DROPDOWN PRODUCTOS
  // =======================

  openProductsMenu() {
    // Solo hover en desktop
    if (window.innerWidth > 768) {
      this.productsOpen.set(true);
    }
  }

  closeProductsMenu() {
    if (window.innerWidth > 768) {
      this.productsOpen.set(false);
    }
  }

  toggleProductsMenu(ev: MouseEvent) {
    // en desktop el hover manda, no el click
    if (window.innerWidth > 768) return;

    ev.preventDefault();
    ev.stopPropagation();
    this.productsOpen.update(v => !v);
  }

  closeAllMenus() {
    this.productsOpen.set(false);
    this.userMenuOpen.set(false);
    this.menuOpen.set(false);
  }

  // =======================
  // NAVEGAR A /productos
  // =======================

  /** Ir a la pantalla de productos */
  private goToProductsRoute() {
    this.router.navigate(['/productos']).then(() => {
      // por las dudas, scrolleo arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /** categoría (TODOS / LIBRERÍA / COMBOS / VARIOS) */
  goProducts(cat: ProductsCategory) {
    // 1) seteo filtro global de categoría
    this.productsFilterState.setCategory(cat);

    // 2) cierro menús
    this.closeAllMenus();

    // 3) voy a la ruta /productos
    this.goToProductsRoute();
  }

  /** botón tipo "Ver todos" desde el menú */
  resetProductsFilters() {
    this.productsFilterState.reset(); // vuelve a 'all'
    this.closeAllMenus();
    this.goToProductsRoute();
  }

  // =======================
  // CLIC FUERA DEL NAV
  // =======================

  @HostListener('document:click')
  onDocClick() {
    this.productsOpen.set(false);
    this.closeUserMenu();
  }

  // =======================
// FAQ DESDE LA NAVBAR
// =======================

goFaq(code: 'como-compro' | 'metodos-envio') {
  this.closeAllMenus();

  this.router.navigate(['/'], {
    fragment: 'faq',
    queryParams: { faq: code },
    // opcional si ya usás otros params:
    // queryParamsHandling: 'merge'
  });
}
}