import { Component, inject, signal, HostListener, computed } from '@angular/core';

import { CommonModule, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../header/header';

import { ShopStore } from '../../shared/store/shop.store';
import { AuthService } from '../../shared/auth/auth.service';

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

  readonly menuOpen = signal(false);
  readonly userMenuOpen = signal(false);

  // signals del AuthService
  isLogged = this.auth.isLogged;
  email = this.auth.email;

  // ✅ nuevo: solo admin
  isAdmin = this.auth.isAdmin;

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

  // ✅ nuevo
  goAdminProducts() {
    this.closeUserMenu();
    this.closeMenu();
    this.router.navigateByUrl('/admin/products');
  }

  readonly productsOpen = signal(false);

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
  this.productsOpen.update(v => !v);
}

closeAllMenus() {
  this.productsOpen.set(false);
  this.closeUserMenu();
  this.closeMenu();
}

@HostListener('document:click')
onDocClick() {
  this.productsOpen.set(false);
  this.closeUserMenu();
}

}
