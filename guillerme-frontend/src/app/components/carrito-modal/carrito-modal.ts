import { Component, inject, computed, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { ShopStore } from '../../shared/store/shop.store';
import { OrdersService } from '../../shared/orders/orders.service';
import { AuthService } from '../../shared/auth/auth.service';
import { ToastService } from '../../shared/service/toast.service';
import { MatDialog } from '@angular/material/dialog';
import { OrderSuccessDialogComponent } from './order-success-dialog';

@Component({
  selector: 'app-carrito-modal',
  standalone: true,
  imports: [NgIf, NgFor],
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

  readonly hasItems = computed(() => this.store.cartCount() > 0);
  readonly sending = signal(false);

  close() {
    this.store.closeCart();
  }

  remove(productId: number) {
    this.store.removeFromCart(productId);
  }

  clear() {
    this.store.clearCart();
  }

  completarCompra() {

  // si no está logueado -> login
  if (!this.auth.isLogged()) {
    this.toast.error('Iniciá sesión para completar la compra');
    this.router.navigateByUrl('/login');
    return;
  }

  // armar payload desde el carrito
  const cart = this.store.cart();
  if (!cart.length) return;

  const body = {
    items: cart.map((it) => ({
      productId: it.producto.id,
      qty: it.cantidad,
    })),
    comment: null,
  };

  // llamar checkout
  this.sending.set(true);
  this.orders.checkout(body).subscribe({
    next: (res) => {
      this.sending.set(false);
      this.store.clearCart();

      this.close();

      // ✅ cartel Angular Material
      this.dialog.open(OrderSuccessDialogComponent, {
        width: '520px',
        maxWidth: '92vw',
        data: {
          message:
            '¡Gracias por tu compra! El detalle de tu pedido ha sido enviado a tu mail. Recorda que nos estaremos comunicando con usted por WhatsApp para completar el pago y acordar el envío solo desde este numero: .',
        },
      });

      // (opcional) si querés mantener un toast corto:
       this.toast.success(`Pedido #${res.orderId} enviado.`);
    },
    error: (e) => {
      console.error(e);
      this.sending.set(false);
      this.toast.error('No se pudo completar la compra. Probá de nuevo.');
    },
  });
}


  private hideBootstrapModal() {
    const open = document.querySelector('.modal.show') as HTMLElement | null;
    if (!open) return;
    const bootstrapAny = (window as any).bootstrap;
    const instance = bootstrapAny?.Modal?.getInstance(open);
    instance?.hide();
  }
}
