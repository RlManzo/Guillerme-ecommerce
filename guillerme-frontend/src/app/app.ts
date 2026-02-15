import { Component, signal, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

import { Navbar } from './components/navbar/navbar';
import { CartPersistenceService } from './shared/cart/cart-persistence.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar],
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly _cartPersistence = inject(CartPersistenceService);

  readonly hideNavbar = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null)
    ),
    { initialValue: null }
  );

  shouldHideNavbar(): boolean {
    const url = this.router.url;

    return (
      url.includes('/login') ||
      url.includes('/register')
    );
  }
}
