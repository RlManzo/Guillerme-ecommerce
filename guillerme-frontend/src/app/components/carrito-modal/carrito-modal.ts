import { Component, inject, computed, signal } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ShopStore, CartItem } from '../../shared/store/shop.store';
import { OrdersService } from '../../shared/orders/orders.service';
import { AuthService } from '../../shared/auth/auth.service';
import { ToastService } from '../../shared/service/toast.service';
import { MatDialog } from '@angular/material/dialog';
import { OrderSuccessDialogComponent } from './order-success-dialog';
import { OrderProgressOverlayComponent } from '../progress-overlay/order-progress-overlay.component';
import { ProductsService } from '../productos/products.service';

@Component({
  selector: 'app-carrito-modal',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, OrderProgressOverlayComponent],
  templateUrl: './carrito-modal.html',
  styleUrl: './carrito-modal.scss',
})
export class CarritoModal {
  readonly store = inject(ShopStore);
  private readonly orders = inject(OrdersService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly productsService = inject(ProductsService);

  readonly showProgress = signal(false);
  readonly progressStep = signal(0);
  readonly hasItems = computed(() => this.store.cartCount() > 0);
  readonly sending = signal(false);

  readonly totalItems = computed(() =>
    this.store.cart().reduce((acc, it) => acc + (it.cantidad ?? 0), 0)
  );

  readonly totalPrice = computed(() =>
    this.store.cart().reduce((acc, it) => {
      const unit = Number(it.producto.precio ?? 0);
      return acc + unit * (it.cantidad ?? 0);
    }, 0)
  );

  lineTotal(it: CartItem): number {
    const unit = Number(it.producto.precio ?? 0);
    return unit * (it.cantidad ?? 0);
  }

  close() {
    this.store.closeCart();
  }

  remove(productId: number, ev?: MouseEvent) {
    ev?.stopPropagation();
    this.store.removeFromCart(productId);
  }

  clear() {
    if (this.sending()) return;
    this.store.clearCart();
  }

  inc(productId: number, ev?: MouseEvent) {
    ev?.stopPropagation();
    ev?.preventDefault();

    if (this.sending()) return;

    if (!this.store.canInc(productId)) {
      this.toast.error('No hay más stock disponible para este producto');
      return;
    }

    this.store.incQty(productId);
  }

  dec(productId: number, ev?: MouseEvent) {
    ev?.stopPropagation();
    ev?.preventDefault();

    if (this.sending()) return;
    this.store.decQty(productId);
  }

  completarCompra() {
    if (this.sending()) return;

    if (!this.auth.isLogged()) {
      this.toast.error('Iniciá sesión para completar la compra');
      this.router.navigateByUrl('/login');
      return;
    }

    const cart = this.store.cart();
    if (!cart.length) return;

    const invalid = cart.find((it) => {
      const stock = it.producto.stock ?? 0;
      return stock <= 0 || it.cantidad > stock;
    });

    if (invalid) {
      const name = invalid.producto.nombre ?? 'Producto';
      this.toast.error(`Stock insuficiente para: ${name}`);
      return;
    }

    const body = {
      items: cart.map((it) => ({
        productId: it.producto.id,
        qty: it.cantidad,
      })),
      comment: null,
    };

    this.sending.set(true);
    this.showProgress.set(true);
    this.progressStep.set(0);

    const t1 = window.setTimeout(() => this.progressStep.set(1), 600);
    const t2 = window.setTimeout(() => this.progressStep.set(2), 1200);

    this.orders.checkout(body).subscribe({
      next: (res) => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);

        // refresco inmediato de productos para traer stock/estado actualizado
        this.productsService.refresh().subscribe({
          error: (err) => {
            console.error('Error refrescando productos post-checkout', err);
          },
        });

        this.showProgress.set(false);
        this.sending.set(false);

        this.store.clearCart();
        this.close();

        this.dialog.open(OrderSuccessDialogComponent, {
          width: '520px',
          maxWidth: '92vw',
          data: {
            message:
              '¡Gracias por tu compra! El detalle de tu pedido ha sido enviado a tu mail. Recordá que nos estaremos comunicando por WhatsApp desde +54 11 38617954 para completar el pago y acordar el envío.',
          },
        });

        this.toast.success(`Pedido #${res.orderId} enviado.`);
      },
      error: (e) => {
        console.error(e);

        window.clearTimeout(t1);
        window.clearTimeout(t2);

        this.showProgress.set(false);
        this.sending.set(false);

        this.toast.error('No se pudo completar la compra. Probá de nuevo.');
      },
    });
  }
}