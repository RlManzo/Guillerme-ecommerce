import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-order-success-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="admin-header">¡Pedido enviado!</h2>

    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>
        Entendido
      </button>
    </div>
  `,
  styles: [`
    p { margin: 0; line-height: 1.45; }
  `]
})
export class OrderSuccessDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { message: string }) {}
}
