import { inject,Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.scss']
})
export class CategoriasComponent {

   private readonly router = inject(Router);
  categories = [
    {
      id: 'escolar',
      title: 'ESCOLAR',
      description: 'Todo lo que necesitás para brillar en el cole.',
      image: '/assets/img/categorias/escolar.jpg',
      link: '/escolar'
    },
    {
      id: 'artistico',
      title: 'ARTÍSTICO',
      description: 'Toda tu creatividad con nuestros productos de arte y dibujo.',
      image: '/assets/img/categorias/artistico.jpg',
      link: '/artistico'
    },
    {
      id: 'combos',
      title: 'COMBOS',
      description: 'Combos armados para que ahorres tiempo y dinero.',
      image: '/assets/img/categorias/combos.jpg',
      link: '/combos'
    },
    {
      id: 'mayorista',
      title: 'MAYORISTA',
      description: 'Soluciones para tu negocio con precios por mayor.',
      image: '/assets/img/categorias/mayorista.jpg',
      link: '/mayorista'
    }
  ];

  /** Ir a la pantalla de productos */
  goToProductsRoute() {
    this.router.navigate(['/productos']).then(() => {
      // por las dudas, scrolleo arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

}