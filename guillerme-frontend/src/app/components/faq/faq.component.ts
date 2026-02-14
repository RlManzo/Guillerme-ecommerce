import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

type FaqItem = {
  q: string;
  a: string;
};

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FaqComponent {
  title = 'Preguntas frecuentes';
  intro =
    'Te dejamos respuestas rápidas a las consultas más comunes. Si necesitás ayuda, escribinos y te asesoramos.';

  faqs: FaqItem[] = [
    {
      q: '¿Cómo compro?',
      a: `Elegí los productos que te interesan y agregalos al carrito. 
Luego hacé clic en “Completar compra”. Si no tenés sesión iniciada, el sistema te va a pedir que te loguees para finalizar el pedido.`,
    },
    {
      q: '¿Métodos de envío?',
      a: `Realizamos envíos a domicilio y/o puntos de entrega (según tu zona). 
Al finalizar la compra coordinamos el envío por WhatsApp y te confirmamos costo y opción disponible.`,
    },
    {
      q: '¿Cuánto demora en llegar mi pedido?',
      a: `El tiempo depende de tu ubicación y la disponibilidad del producto. 
En general, la preparación demora 24/48 hs hábiles y luego el envío varía según la modalidad elegida.`,
    },
    {
      q: 'Canales de comunicación',
      a: `Podés comunicarte con nosotros por WhatsApp, Instagram o Email.
También podés dejarnos tu consulta en el formulario de contacto y te respondemos a la brevedad.`,
    },
  ];

  // -1 = ninguno abierto
  openIndex = signal<number>(0);

  toggle(i: number) {
    this.openIndex.update((curr) => (curr === i ? -1 : i));
  }

  isOpen(i: number) {
    return this.openIndex() === i;
  }
}
