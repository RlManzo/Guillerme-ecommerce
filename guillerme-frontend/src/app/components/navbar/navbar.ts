import { Component, inject, signal, HostListener } from '@angular/core';
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

  @HostListener('document:click')
  onDocClick() {
    this.closeUserMenu();
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
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
}
