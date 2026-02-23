import { Component } from '@angular/core';
import { Presupuesto } from '../../components/presupuesto/presupuesto';
import { Nosotros } from '../../components/nosotros/nosotros';
import { Productos } from '../../components/productos/productos';
import { CarouselServicios } from '../../components/carousel-servicios/carousel-servicios';
import { ProductoModal } from '../../components/producto-modal/producto-modal';
import { CarritoModal } from '../../components/carrito-modal/carrito-modal';
import { FooterComponent } from '../../components/footer/footer.component';
import { BrandsCarouselComponent } from '../../components/brands-carousel/brands-carousel.component';
import { FaqComponent } from '../../components/faq/faq.component';
import { ProductosPreview } from '../../components/productos/productos-preview'; 
import { InstagramFeed } from '../../components/instagram-feed/instagram-feed';
import { CategoriasComponent } from '../../components/categorias-productos/categorias.component';
import { HomeBeneficiosComponent } from '../../components/beneficios/home-beneficios.component';
import { NuevosIngresosComponent } from '../../components/nuevos-ingresos/nuevos-ingresos.component';

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
    FaqComponent,
    FooterComponent,
    ProductosPreview,
    InstagramFeed,
    CategoriasComponent,
    HomeBeneficiosComponent,
    NuevosIngresosComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'], 
})
export class HomeComponent {
  brands = [
    { name: 'Filgo', logoUrl: 'assets/carousel/filgo-logo-circular.png' },
    { name: 'Ibi Craft', logoUrl: 'assets/carousel/ibicraft-logo-2.png' },
    { name: 'Mundo FW', logoUrl: 'assets/carousel/fw-logo.png' },
    { name: 'keyroad', logoUrl: 'assets/carousel/keyroad-logo.png' },
    { name: 'C-B-X', logoUrl: 'assets/carousel/cbx-logo.png' },
    { name: 'Olami', logoUrl: 'assets/carousel/olami-logo.png' },
  ];
}
