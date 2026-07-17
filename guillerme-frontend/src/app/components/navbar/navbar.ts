import {
  Component,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { Header } from '../header/header';

import { ShopStore } from '../../shared/store/shop.store';
import { AuthService } from '../../shared/auth/auth.service';

import {
  ProductsCategory,
} from '../../shared/products-filter-state.service';

type ProductsBrand =
  | 'all'
  | 'Filgo'
  | 'Skycolor'
  | 'Olami'
  | 'C-B-X'
  | 'FW'
  | 'Keyroad'
  | 'Ibicraft'
  | 'Wero'
  | 'Laprida-Exito'
  | 'Bic'
  | 'Carpel'
  | 'Nupro'
  | 'Avíos'
  | 'Otros';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    RouterLink,
    Header,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnDestroy {
  readonly store = inject(ShopStore);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly productsOpen = signal(false);
  readonly adminOpen = signal(false);
  readonly libraryOpen = signal(false);

  readonly isDesktop = signal(
    window.innerWidth > 768
  );

  readonly isLogged = this.auth.isLogged;
  readonly email = this.auth.email;
  readonly isAdmin = this.auth.isAdmin;
  readonly isOperador = this.auth.isOperador;

  readonly isAdminOrOperador = computed(
    () => this.isAdmin() || this.isOperador()
  );

  readonly isOnlyOperador = computed(
    () => this.isOperador() && !this.isAdmin()
  );

  readonly libraryBrands: ProductsBrand[] = [
    'Filgo',
    'Skycolor',
    'Olami',
    'C-B-X',
    'FW',
    'Keyroad',
    'Ibicraft',
    'Wero',
    'Bic',
    'Laprida-Exito',
    'Carpel',
    'Nupro',
    'Avíos',
    'Otros',
  ];

  ngOnDestroy(): void {
    document.body.style.removeProperty('overflow');
  }

  // =========================================================
  // MENÚ MOBILE
  // =========================================================

  toggleMenu(event?: Event): void {
    event?.stopPropagation();

    const nextValue = !this.menuOpen();

    this.menuOpen.set(nextValue);

    if (nextValue) {
      this.userMenuOpen.set(false);
      document.body.style.overflow = 'hidden';
      return;
    }

    this.closeMobileMenuState();
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.closeMobileMenuState();
  }

  private closeMobileMenuState(): void {
    this.productsOpen.set(false);
    this.adminOpen.set(false);
    this.libraryOpen.set(false);

    document.body.style.removeProperty('overflow');
  }

  closeAllMenus(): void {
    this.productsOpen.set(false);
    this.adminOpen.set(false);
    this.userMenuOpen.set(false);
    this.menuOpen.set(false);
    this.libraryOpen.set(false);

    document.body.style.removeProperty('overflow');
  }

  // =========================================================
  // CARRITO
  // =========================================================

  openCart(): void {
    this.store.openCart();
  }

  // =========================================================
  // USUARIO
  // =========================================================

  toggleUserMenu(event?: Event): void {
    event?.stopPropagation();

    this.userMenuOpen.update(
      (value) => !value
    );
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();

    this.closeUserMenu();
    this.closeMenu();

    this.router.navigateByUrl('/');
  }

  goProfile(): void {
    this.closeUserMenu();
    this.closeMenu();

    this.router.navigateByUrl('/perfil');
  }

  goOrders(): void {
    this.closeUserMenu();
    this.closeMenu();
    this.adminOpen.set(false);

    const role = (
      this.auth.session()?.role ?? ''
    ).toUpperCase();

    const target =
      role === 'ADMIN'
        ? '/admin/orders'
        : '/orders';

    this.router.navigateByUrl(target);
  }

  // =========================================================
  // ADMINISTRACIÓN
  // =========================================================

  goAdminHome(): void {
    this.closeUserMenu();
    this.closeMenu();
    this.adminOpen.set(false);

    this.router.navigateByUrl('/admin');
  }

  goAdminProducts(): void {
    this.closeUserMenu();
    this.closeMenu();
    this.adminOpen.set(false);

    this.router.navigateByUrl(
      '/admin/products'
    );
  }

  goAdminCustomers(): void {
    this.closeUserMenu();
    this.closeMenu();
    this.adminOpen.set(false);

    this.router.navigateByUrl(
      '/admin/customers'
    );
  }

  goLocalSales(): void {
    this.closeUserMenu();
    this.closeMenu();
    this.adminOpen.set(false);

    this.router.navigateByUrl(
      '/admin/cartOrders'
    );
  }

  goManagePurchases(): void {
    this.closeUserMenu();
    this.closeMenu();
    this.adminOpen.set(false);

    this.router.navigateByUrl(
      '/admin/purchases'
    );
  }

  openAdminMenu(): void {
    if (window.innerWidth > 768) {
      this.adminOpen.set(true);
    }
  }

  closeAdminMenu(): void {
    if (window.innerWidth > 768) {
      this.adminOpen.set(false);
    }
  }

  toggleAdminMenu(
    event: MouseEvent
  ): void {
    if (window.innerWidth > 768) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.adminOpen.update(
      (value) => !value
    );

    if (this.adminOpen()) {
      this.productsOpen.set(false);
      this.libraryOpen.set(false);
    }
  }

  // =========================================================
  // PRODUCTOS
  // =========================================================

  openProductsMenu(): void {
    if (window.innerWidth > 768) {
      this.productsOpen.set(true);
    }
  }

  closeProductsMenu(): void {
    if (window.innerWidth > 768) {
      this.productsOpen.set(false);
      this.libraryOpen.set(false);
    }
  }

  toggleProductsMenu(
    event: MouseEvent
  ): void {
    if (window.innerWidth > 768) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.productsOpen.update(
      (value) => !value
    );

    if (!this.productsOpen()) {
      this.libraryOpen.set(false);
    }

    if (this.productsOpen()) {
      this.adminOpen.set(false);
    }
  }

  toggleLibraryMenu(
    event?: Event
  ): void {
    if (window.innerWidth > 768) {
      return;
    }

    event?.preventDefault();
    event?.stopPropagation();

    this.libraryOpen.update(
      (value) => !value
    );
  }

  closeLibraryMenu(): void {
    this.libraryOpen.set(false);
  }

  private goToProductsRoute(
    category: ProductsCategory = 'all',
    brand: ProductsBrand = 'all'
  ): void {
    this.router
      .navigate(['/productos'], {
        queryParams: {
          cat:
            category !== 'all'
              ? category
              : null,

          brand:
            brand !== 'all'
              ? brand
              : null,
        },
      })
      .then(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      });
  }

  goProducts(
    category: ProductsCategory
  ): void {
    this.closeAllMenus();

    this.goToProductsRoute(
      category,
      'all'
    );
  }

  goProductsByBrand(
    brand: ProductsBrand
  ): void {
    this.closeAllMenus();

    this.goToProductsRoute(
      'libreria',
      brand
    );
  }

  resetProductsFilters(): void {
    this.closeAllMenus();

    this.goToProductsRoute(
      'all',
      'all'
    );
  }

  // =========================================================
  // PREGUNTAS FRECUENTES Y CONTACTO
  // =========================================================

  goFaq(
    code: 'como-compro' | 'metodos-envio'
  ): void {
    this.closeAllMenus();

    this.router.navigate(['/'], {
      fragment: 'faq',
      queryParams: {
        faq: code,
      },
    });
  }

  goContactoForm(): void {
    this.closeUserMenu();
    this.closeMenu();

    this.router.navigateByUrl('/contacto');
  }

  // =========================================================
  // EVENTOS GLOBALES
  // =========================================================

  @HostListener(
    'document:click',
    ['$event']
  )
  onDocClick(event: MouseEvent): void {
    /*
     * El drawer mobile se cierra mediante:
     * - backdrop;
     * - botón X;
     * - navegación.
     *
     * No se cierra ante cualquier clic interno.
     */
    if (!this.isDesktop()) {
      this.closeUserMenu();
      return;
    }

    this.productsOpen.set(false);
    this.adminOpen.set(false);
    this.libraryOpen.set(false);
    this.closeUserMenu();
  }

  @HostListener('window:resize')
  onResize(): void {
    const desktop =
      window.innerWidth > 768;

    this.isDesktop.set(desktop);

    if (desktop) {
      this.menuOpen.set(false);
      this.libraryOpen.set(false);
      document.body.style.removeProperty(
        'overflow'
      );

      return;
    }

    this.adminOpen.set(false);
    this.userMenuOpen.set(false);
  }

  @HostListener(
    'document:keydown.escape'
  )
  onEscape(): void {
    if (this.menuOpen()) {
      this.closeMenu();
    }

    this.closeUserMenu();
  }
}