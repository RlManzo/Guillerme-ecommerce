import { CurrencyPipe, NgFor } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface OrderConfirmItem {
  id: number;
  nombre: string;
  imagen?: string | null;
  precio: number;
  cantidad: number;
  stock: number;
  subtotal: number;
}

export interface OrderConfirmDialogData {
  items: OrderConfirmItem[];
  totalItems: number;
  totalPrice: number;
}

@Component({
  selector: 'app-order-confirm-dialog',
  standalone: true,
  imports: [
    NgFor,
    CurrencyPipe,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title>Confirmar pedido</h2>

      <div mat-dialog-content>
        <p class="confirm-message">
          Revisá los productos antes de enviar tu pedido.
        </p>

        <div class="products">
          <div
            class="product"
            *ngFor="let item of data.items"
          >
            <img
              *ngIf="item.imagen"
              class="product-image"
              [src]="item.imagen"
              [alt]="item.nombre"
            />

            <div class="product-info">
              <div class="product-name">
                {{ item.nombre }}
              </div>

              <div class="product-detail">
                Cantidad:
                <strong>{{ item.cantidad }}</strong>
              </div>

              <div class="product-detail">
                Unitario:
                <strong>
                  {{ item.precio | currency:'$':'symbol':'1.0-0' }}
                </strong>
              </div>
            </div>

            <div class="product-subtotal">
              {{ item.subtotal | currency:'$':'symbol':'1.0-0' }}
            </div>
          </div>
        </div>

        <div class="summary">
          <div>
            Productos:
            <strong>{{ data.totalItems }}</strong>
          </div>

          <div class="summary-total">
            Total:
            <strong>
              {{ data.totalPrice | currency:'$':'symbol':'1.0-0' }}
            </strong>
          </div>
        </div>

        <div class="notice">
          Al confirmar, el pedido será enviado. Luego nos comunicaremos por
          WhatsApp para coordinar el pago y el envío.
        </div>
      </div>

      <div mat-dialog-actions align="end" class="actions">
        <button
          type="button"
          mat-button
          (click)="cancelar()"
        >
          Volver al carrito
        </button>

        <button
          type="button"
          mat-raised-button
          color="primary"
          (click)="confirmar()"
        >
          Confirmar pedido
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 0;
    }

    .confirm-message {
      margin: 0 0 18px;
      color: #666;
      line-height: 1.45;
    }

    .products {
      max-height: 360px;
      overflow-y: auto;
      border-top: 1px solid #e4e4e4;
    }

    .product {
      display: grid;
      grid-template-columns: 64px minmax(0, 1fr) auto;
      align-items: center;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid #e4e4e4;
    }

    .product-image {
      width: 56px;
      height: 56px;
      object-fit: contain;
      border-radius: 6px;
    }

    .product-info {
      min-width: 0;
    }

    .product-name {
      margin-bottom: 6px;
      font-weight: 600;
      line-height: 1.25;
    }

    .product-detail {
      color: #666;
      font-size: 13px;
      line-height: 1.4;
    }

    .product-subtotal {
      font-weight: 600;
      white-space: nowrap;
    }

    .summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-top: 18px;
      padding: 16px;
      background: #f7f7f7;
      border-radius: 8px;
    }

    .summary-total {
      font-size: 18px;
    }

    .notice {
      margin-top: 16px;
      padding: 12px;
      color: #6b4b00;
      background: #fff6dc;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.4;
    }

    .actions {
      padding: 16px 24px 20px;
      gap: 8px;
    }

    @media (max-width: 600px) {
      .product {
        grid-template-columns: 48px minmax(0, 1fr);
      }

      .product-image {
        width: 44px;
        height: 44px;
      }

      .product-subtotal {
        grid-column: 2;
      }

      .summary {
        align-items: flex-start;
        flex-direction: column;
      }

      .actions {
        align-items: stretch;
        flex-direction: column-reverse;
      }

      .actions button {
        width: 100%;
      }
    }
  `],
})
export class OrderConfirmDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public readonly data: OrderConfirmDialogData,
    private readonly dialogRef:
      MatDialogRef<OrderConfirmDialogComponent, boolean>,
  ) {}

  cancelar(): void {
    this.dialogRef.close(false);
  }

  confirmar(): void {
    this.dialogRef.close(true);
  }
}