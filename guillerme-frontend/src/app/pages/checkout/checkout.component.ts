import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  CurrencyPipe,
  NgFor,
  NgIf,
} from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import {
  CartItem,
  ShopStore,
} from '../../shared/store/shop.store';
import { OrdersService } from '../../shared/orders/orders.service';
import { AuthService } from '../../shared/auth/auth.service';
import { ToastService } from '../../shared/service/toast.service';
import { ProductsService } from '../../components/productos/products.service';

import { OrderProgressOverlayComponent } from '../../components/progress-overlay/order-progress-overlay.component';
import { OrderSuccessDialogComponent } from '../../components/carrito-modal/order-success-dialog';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    CurrencyPipe,
    RouterLink,
    OrderProgressOverlayComponent,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  readonly store = inject(ShopStore);

  private readonly orders = inject(OrdersService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly productsService = inject(ProductsService);

  readonly sending = signal(false);
  readonly validatingStock = signal(false);

  readonly showProgress = signal(false);
  readonly progressStep = signal(0);

  readonly comment = signal('');

  readonly hasItems = computed(
    () => this.store.cart().length > 0
  );

  readonly totalItems = computed(() =>
    this.store.cart().reduce(
      (acc, item) => acc + Number(item.cantidad ?? 0),
      0
    )
  );

  readonly totalPrice = computed(() =>
    this.store.cart().reduce((acc, item) => {
      const price = Number(item.producto.precio ?? 0);
      const quantity = Number(item.cantidad ?? 0);

      return acc + price * quantity;
    }, 0)
  );

  readonly hasInvalidItems = computed(() =>
    this.store.cart().some((item) => {
      const stock = Number(item.producto.stock ?? 0);
      const quantity = Number(item.cantidad ?? 0);

      return stock <= 0 || quantity > stock;
    })
  );

  ngOnInit(): void {
    if (!this.auth.isLogged()) {
      this.toast.error('Iniciá sesión para completar la compra');
      this.router.navigateByUrl('/login');
      return;
    }

    if (!this.store.cart().length) {
      this.toast.error('Tu carrito está vacío');
      this.router.navigateByUrl('/');
      return;
    }

    this.refreshStock();
  }

  lineTotal(item: CartItem): number {
    const price = Number(item.producto.precio ?? 0);
    const quantity = Number(item.cantidad ?? 0);

    return price * quantity;
  }

  remove(productId: number): void {
    if (this.sending()) return;

    this.store.removeFromCart(productId);

    if (!this.store.cart().length) {
      this.toast.error('Tu carrito está vacío');
      this.router.navigateByUrl('/');
    }
  }

  inc(productId: number): void {
    if (this.sending() || this.validatingStock()) return;

    if (!this.store.canInc(productId)) {
      this.toast.error(
        'No hay más stock disponible para este producto'
      );
      return;
    }

    this.store.incQty(productId);
  }

  dec(productId: number): void {
    if (this.sending() || this.validatingStock()) return;

    this.store.decQty(productId);
  }

  updateComment(event: Event): void {
    const input = event.target as HTMLTextAreaElement;

    this.comment.set(input.value);
  }

  volverAlCarrito(): void {
    if (this.sending()) return;

    this.router.navigateByUrl('/');
    this.store.openCart();
  }

  confirmarPedido(): void {
    if (this.sending() || this.validatingStock()) return;

    if (!this.store.cart().length) {
      this.toast.error('Tu carrito está vacío');
      return;
    }

    this.sending.set(true);

    /*
     * Se vuelve a consultar el stock inmediatamente antes
     * de crear el pedido.
     */
    this.productsService.refresh().subscribe({
      next: (products: any[]) => {
        this.store.syncCartStock(products as any);

        const cart = this.store.cart();

        const invalid = cart.find((item) => {
          const stock = Number(item.producto.stock ?? 0);
          const quantity = Number(item.cantidad ?? 0);

          return stock <= 0 || quantity > stock;
        });

        if (invalid) {
          this.sending.set(false);

          this.toast.error(
            `Revisá tu pedido. Sin stock para: ${invalid.producto.nombre}`
          );

          return;
        }

        this.enviarPedido(cart);
      },

      error: (err) => {
        console.error(
          'Error validando stock antes de crear el pedido',
          err
        );

        this.sending.set(false);

        this.toast.error(
          'No se pudo validar el stock actual. Probá de nuevo.'
        );
      },
    });
  }

  private refreshStock(): void {
    this.validatingStock.set(true);

    this.productsService.refresh().subscribe({
      next: (products: any[]) => {
        this.store.syncCartStock(products as any);
        this.validatingStock.set(false);

        if (this.hasInvalidItems()) {
          this.toast.error(
            'Algunos productos cambiaron de stock. Revisá tu pedido.'
          );
        }
      },

      error: (err) => {
        console.error('Error actualizando el stock', err);

        this.validatingStock.set(false);

        this.toast.error(
          'No pudimos actualizar el stock de los productos.'
        );
      },
    });
  }

  private enviarPedido(cart: CartItem[]): void {
    const comment = this.comment().trim();

    const body = {
      items: cart.map((item) => ({
        productId: item.producto.id,
        qty: item.cantidad,
      })),
      comment: comment || null,
    };

    this.showProgress.set(true);
    this.progressStep.set(0);

    const t1 = window.setTimeout(
      () => this.progressStep.set(1),
      600
    );

    const t2 = window.setTimeout(
      () => this.progressStep.set(2),
      1200
    );

    this.orders.checkout(body).subscribe({
      next: (res) => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);

        this.showProgress.set(false);
        this.sending.set(false);

        this.store.clearCart();

        this.dialog
          .open(OrderSuccessDialogComponent, {
            width: '520px',
            maxWidth: '92vw',
            disableClose: true,
            data: {
              message:
                '¡Gracias por tu compra! El detalle de tu pedido ha sido enviado a tu mail. Recordá que nos estaremos comunicando por WhatsApp desde +54 11 38617954 para completar el pago y acordar el envío.',
            },
          })
          .afterClosed()
          .subscribe(() => {
            this.router.navigateByUrl('/');
          });

        this.toast.success(
          `Pedido #${res.orderId} enviado.`
        );
      },

      error: (error) => {
        console.error(error);

        window.clearTimeout(t1);
        window.clearTimeout(t2);

        this.showProgress.set(false);
        this.sending.set(false);

        const message =
          error?.error?.message ||
          'No se pudo completar la compra. Probá de nuevo.';

        this.toast.error(message);
      },
    });
  }
}