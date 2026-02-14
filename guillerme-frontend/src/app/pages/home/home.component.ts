import { Component } from '@angular/core';
import { Presupuesto } from '../../components/presupuesto/presupuesto';
import { Nosotros } from '../../components/nosotros/nosotros';
import { Productos } from '../../components/productos/productos';
import { CarouselServicios } from '../../components/carousel-servicios/carousel-servicios';
import { ProductoModal } from '../../components/producto-modal/producto-modal';
import { CarritoModal } from '../../components/carrito-modal/carrito-modal';
import { FooterComponent } from '../../components/footer/footer.component';
import { BrandsCarouselComponent } from '../../components/brands-carousel/brands-carousel.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    Presupuesto,
    Nosotros,
    Productos,
    CarouselServicios,
    ProductoModal,
    CarritoModal,
    BrandsCarouselComponent,
    FooterComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'], 
})
export class HomeComponent {
  brands = [
    { name: 'Filgo', logoUrl: 'assets/carousel/filgo-logo-circular.png' },
    { name: 'Bic', logoUrl: 'assets/carousel/sharpie-logo.jpg' },
    { name: 'Sharpie', logoUrl: 'assets/brands/sharpie.jpg' },
    { name: 'Faber-Castell', logoUrl: 'assets/brands/faber.jpg' },
  ];
}
