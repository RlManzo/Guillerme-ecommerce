import { Component, signal,  inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { CartPersistenceService } from './shared/cart/cart-persistence.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('guillerme-ecommerce');
  private readonly _cartPersistence = inject(CartPersistenceService);
}
