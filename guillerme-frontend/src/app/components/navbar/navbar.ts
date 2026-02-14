import { Component, inject, signal, HostListener } from '@angular/core';

import { CommonModule, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../header/header';

import { ShopStore } from '../../shared/store/shop.store';
import { AuthService } from '../../shared/auth/auth.service';

// ✅ NUEVO
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

  // ✅ NUEVO
  private readonly productsFilterState = inject(ProductsFilterStateService);

  readonly menuOpen = signal(false);
  readonly userMenuOpen = signal(false);

  // signals del AuthService
  isLogged = this.auth.isLogged;
  email = this.auth.email;

  // ✅ nuevo: solo admin
  isAdmin = this.auth.isAdmin;

  readonly productsOpen = signal(false);

  toggleMenu() {
    this.menuOpen.update((v) => !v);
    if (!this.menuOpen()) this.productsOpen.set(false);
  }

  closeMenu() {
    this.menuOpen.set(false);
    this.productsOpen.set(false);
  }

  openCart() {
    this.store.openCart();
  }

  toggleUserMenu() {
    this.userMenuOpen.update((v) => !v);
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

  openProductsMenu() {
    // Solo hover en desktop
    if (window.innerWidth > 768) this.productsOpen.set(true);
  }

  closeProductsMenu() {
    if (window.innerWidth > 768) this.productsOpen.set(false);
  }

  toggleProductsMenu(ev: MouseEvent) {
    // en desktop el hover manda, no el click
    if (window.innerWidth > 768) return;

    ev.preventDefault();
    ev.stopPropagation();
    this.productsOpen.update((v) => !v);
  }

  closeAllMenus() {
    this.productsOpen.set(false);
    this.userMenuOpen.set(false);
    this.menuOpen.set(false);
    this.mobileSearchOpen.set(false);
  }

  // ✅ NUEVO: ir a productos filtrados desde el dropdown
  goProducts(cat: ProductsCategory) {
    // 1) seteo filtro global
    this.productsFilterState.setCategory(cat);

    // 2) cierro menús
    this.closeAllMenus();

    // 3) si estás en otra ruta (ej /login), te llevo a /#producto
    //    si ya estás en /, igual te scrollea
    this.router.navigateByUrl('/#producto').then(() => {
      // 4) scroll suave por si el navegador no lo hace
      setTimeout(() => {
        document
          .getElementById('producto')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    });
  }

  @HostListener('document:click')
  onDocClick() {
    this.productsOpen.set(false);
    this.closeUserMenu();
  }

  readonly mobileSearchOpen = signal(false);

toggleMobileSearch() {
  // solo mobile
  if (window.innerWidth > 768) return;
  this.mobileSearchOpen.update(v => !v);

  // opcional: cerrar menú hamburguesa si está abierto
  this.menuOpen.set(false);
  this.productsOpen.set(false);
}

closeMobileSearch() {
  this.mobileSearchOpen.set(false);
}

}
