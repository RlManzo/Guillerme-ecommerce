import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShopStore } from '../../shared/store/shop.store';

@Component({
  selector: 'app-presupuesto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './presupuesto.html',
  styleUrls: ['./presupuesto.scss'],
})
export class Presupuesto {
  private fb = inject(FormBuilder);
  readonly store = inject(ShopStore);

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    contacto: ['', Validators.required],
     producto: ['', Validators.required],
    mensaje: [''],
  });

  enviarPresupuesto() {
    if (this.form.invalid) return;

    const { nombre, contacto, mensaje } = this.form.getRawValue();
    const carrito = this.store.cart();

    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const productosTexto = carrito
      .map(
        (item) =>
          `• ${item.producto.nombre} (x${item.cantidad})`
      )
      .join('%0A');

    const texto = `
Hola! Quiero pedir un presupuesto.%0A
Nombre: ${nombre}%0A
Contacto: ${contacto}%0A
%0A
Productos:%0A
${productosTexto}%0A
%0A
Mensaje:%0A
${mensaje || '-'}
    `.trim();

    const phone = '543513721017'; // ← número del cliente
    const url = ``;

    window.open(url, '_blank');
  }
}
