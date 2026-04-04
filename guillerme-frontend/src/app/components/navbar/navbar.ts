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
  readonly adminOpen = signal(false);
  readonly isDesktop = signal(window.innerWidth > 768);

  isLogged = this.auth.isLogged;
  email = this.auth.email;
  isAdmin = this.auth.isAdmin;

  toggleMenu() {
    this.menuOpen.update(v => !v);
    if (!this.menuOpen()) {
      this.productsOpen.set(false);
      this.adminOpen.set(false);
    }
  }

  closeMenu() {
    this.menuOpen.set(false);
    this.productsOpen.set(false);
    this.adminOpen.set(false);
  }

  openCart() {
    this.store.openCart();
  }

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
    this.adminOpen.set(false);

    const role = (this.auth.session()?.role ?? '').toUpperCase();
    const target = role === 'ADMIN' ? '/admin/orders' : '/orders';

    this.router.navigateByUrl(target);
  }

  goAdminProducts() {
    this.closeUserMenu();
    this.closeMenu();
    this.adminOpen.set(false);
    this.router.navigateByUrl('/admin/products');
  }

  goLocalSales() {
    this.closeUserMenu();
    this.closeMenu();
    this.adminOpen.set(false);
    this.router.navigateByUrl('/admin/cartOrders');
  }

  goManagePurchases() {
    this.closeUserMenu();
    this.closeMenu();
    this.adminOpen.set(false);
    this.router.navigateByUrl('/admin/purchases');
  }

  openProductsMenu() {
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
    if (window.innerWidth > 768) return;

    ev.preventDefault();
    ev.stopPropagation();
    this.productsOpen.update(v => !v);
  }

  openAdminMenu() {
    if (window.innerWidth > 768) {
      this.adminOpen.set(true);
    }
  }

  closeAdminMenu() {
    if (window.innerWidth > 768) {
      this.adminOpen.set(false);
    }
  }

  toggleAdminMenu(ev: MouseEvent) {
    if (window.innerWidth > 768) return;

    ev.preventDefault();
    ev.stopPropagation();
    this.adminOpen.update(v => !v);
  }

  closeAllMenus() {
    this.productsOpen.set(false);
    this.adminOpen.set(false);
    this.userMenuOpen.set(false);
    this.menuOpen.set(false);
  }

  private goToProductsRoute() {
    this.router.navigate(['/productos']).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  goProducts(cat: ProductsCategory) {
    this.productsFilterState.setCategory(cat);
    this.closeAllMenus();
    this.goToProductsRoute();
  }

  resetProductsFilters() {
    this.productsFilterState.reset();
    this.closeAllMenus();
    this.goToProductsRoute();
  }

  @HostListener('document:click')
  onDocClick() {
    this.productsOpen.set(false);
    this.adminOpen.set(false);
    this.closeUserMenu();
  }

  goFaq(code: 'como-compro' | 'metodos-envio') {
    this.closeAllMenus();

    this.router.navigate(['/'], {
      fragment: 'faq',
      queryParams: { faq: code },
    });
  }

  goContactoForm() {
    this.closeUserMenu();
    this.closeMenu();
    this.router.navigateByUrl('/contacto');
  }

  @HostListener('window:resize')
onResize() {
  this.isDesktop.set(window.innerWidth > 768);

  // si pasa a mobile, cerramos dropdowns admin
  if (!this.isDesktop()) {
    this.adminOpen.set(false);
    this.userMenuOpen.set(false);
  }
}

goAdminHome() {
  this.closeUserMenu();
  this.closeMenu();
  this.adminOpen.set(false);
  this.router.navigateByUrl('/admin');
}
}