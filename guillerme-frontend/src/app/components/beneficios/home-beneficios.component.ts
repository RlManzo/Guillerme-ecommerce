// src/app/components/beneficios/home-beneficios.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-beneficios',
  standalone: true,                // 👈 IMPORTANTE
  imports: [CommonModule],         // 👈 Para poder usar *ngFor / *ngIf
  templateUrl: './home-beneficios.component.html',
  styleUrls: ['./home-beneficios.component.scss']
})
export class HomeBeneficiosComponent {

  beneficios = [
    {
      id: 'envios',
      title: 'ENVÍOS',
      text: 'A domicilio y a todas las Sucursales de Correo Argentino del país.',
      icon: 'assets/envios-icono.jpg'     
    },
    {
      id: 'pagos',
      title: 'PAGOS',
      text: 'Con todas las tarjetas de crédito y débito, efectivo y transferencia bancaria.',
      icon: 'assets/pago-icono.webp'
    },
    {
      id: 'consultas',
      title: 'CONSULTAS',
      text: 'Respondemos todas tus consultas online. ¡Escribinos!',
      icon: 'assets/consulta-icono.png'
    }
  ];

}