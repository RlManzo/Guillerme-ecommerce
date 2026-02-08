import { Component } from '@angular/core';
import { Presupuesto } from '../../components/presupuesto/presupuesto';
import { Nosotros } from '../../components/nosotros/nosotros';
import { Productos } from '../../components/productos/productos';
import { CarouselServicios } from '../../components/carousel-servicios/carousel-servicios';
import { ProductoModal } from '../../components/producto-modal/producto-modal';
import { CarritoModal } from '../../components/carrito-modal/carrito-modal';
import { FooterComponent } from '../../components/footer/footer.component';

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
    FooterComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'], 
})
export class HomeComponent {}
