// src/app/components/productos-preview/productos-preview.ts
import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { ProductsService } from '../productos/products.service';
import { Product } from '../productos/product.model';
import { ShopStore, Producto } from '../../shared/store/shop.store';
import { ToastService } from '../../shared/service/toast.service';

declare const bootstrap: any;

@Component({
  selector: 'app-productos-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './productos-preview.html',
  styleUrl: './productos-preview.scss',
})
export class ProductosPreview implements AfterViewInit {
  private readonly productsService = inject(ProductsService);
  readonly store = inject(ShopStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // carrusel
  @ViewChild('track', { static: false }) track?: ElementRef<HTMLDivElement>;
  readonly canScrollLeft = signal(false);
  readonly canScrollRight = signal(false);

  constructor() {
    // aseguramos productos cargados
    this.productsService.load().subscribe();
  }

  private readonly productsSig = toSignal(this.productsService.products$, {
    initialValue: [] as Product[],
  });

  // máximo 20 productos, mezcla aleatoria
  readonly destacados = computed(() => {
    const all = this.productsSig().filter(p => (p as any).estado ?? true);
    if (!all.length) return [];

    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 20);
  });

  ngAfterViewInit(): void {
    // un pequeño delay para que se calcule el scrollWidth
    setTimeout(() => this.updateArrows(), 0);
  }

  // ------------ carrusel ------------
  private updateArrows() {
    const el = this.track?.nativeElement;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;

    this.canScrollLeft.set(el.scrollLeft > 0);
    this.canScrollRight.set(el.scrollLeft < maxScroll - 1);
  }

  scroll(dir: 1 | -1) {
    const el = this.track?.nativeElement;
    if (!el) return;

    const step = el.clientWidth * 0.9; // casi una “pantalla”
    el.scrollBy({ left: step * dir, behavior: 'smooth' });

    // actualizamos los estados de flechas un poquito después
    setTimeout(() => this.updateArrows(), 400);
  }

  onTrackScroll() {
    this.updateArrows();
  }

  // ------------ acciones UI ------------

  openDetalle(p: Product) {
    this.store.selectProducto(this.toProducto(p));

    const el = document.getElementById('staticBackdrop');
    if (el) {
      bootstrap.Modal.getOrCreateInstance(el).show();
    }
  }

  add(p: Product) {
    this.store.addToCart(this.toProducto(p));
    this.toast.success('Producto agregado al carrito');
  }

  goVerMas() {
    this.router.navigateByUrl('/productos');
    
  }

  formatPrice(value: number | string | null | undefined): string {
    const n = typeof value === 'string' ? Number(value) : value;
    if (n == null || Number.isNaN(n)) return '';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(n);
  }

  private toProducto(p: Product): Producto {
    return {
      id: p.id,
      nombre: p.nombre,
      img: p.img,
      info: p.descripcionCorta ?? '',
      infoModal: p.infoModal ?? p.descripcionCorta ?? '',
      cat: 'all',
      categoria1: (p.servicios?.[0] as any) ?? '',
      categoria2: (p.servicios?.[1] as any) ?? '',
      detalle1: p.variantes?.[0]?.label ?? '',
      detalle2: p.variantes?.[1]?.label ?? '',
      categorias: p.categorias ?? [],
      keywords: p.keywords ?? [],
      stock: p.stock ?? 0,
      precio: p.precio ?? 0,
      imagenes: [p.img].filter(Boolean) as string[],
    } as unknown as Producto;
  }
}